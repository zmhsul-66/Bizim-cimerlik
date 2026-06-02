import { NextResponse } from "next/server";
import { supabase, isDbReady } from "@/lib/supabase";
import fs from "fs/promises";
import path from "path";

// Köməkçi funksiya: Şifrəni yoxlayır
function verifyAdmin(request) {
  const password = request.headers.get("x-admin-password");
  const expectedPassword = process.env.ADMIN_PASSWORD || "deniz123";
  return password === expectedPassword;
}

// Köməkçi funksiya: Lokal JSON faylından kateqoriyaları oxuyur (Fallback)
async function getLocalCategories() {
  try {
    const filePath = path.join(process.cwd(), "public", "menuData.json");
    const fileContent = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(fileContent);
    return data.categories || [];
  } catch (error) {
    console.error("Lokal JSON oxunarkən xəta:", error);
    return [];
  }
}

// ----------------------------------------------------
// 1. GET: Bütün kateqoriyaları çəkir (Live / Fallback)
// ----------------------------------------------------
export async function GET() {
  // Əgər baza qoşulmayıbsa, birbaşa lokal JSON-dan qaytarırıq
  if (!isDbReady) {
    const localCategories = await getLocalCategories();
    return NextResponse.json({ 
      categories: localCategories, 
      isDatabase: false 
    });
  }

  try {
    // Supabase-dən kateqoriyaları oxuyuruq
    const { data, error } = await supabase
      .from("menu_categories")
      .select("*")
      .order("created_at", { ascending: true });

    // Əgər cədvəl yoxdursa və ya digər xəta baş verərsə, lokal JSON-a fallback edirik
    if (error) {
      console.warn("Supabase-dən kateqoriyalar oxunarkən xəta (lokal fayla keçid edilir):", error.message);
      const localCategories = await getLocalCategories();
      return NextResponse.json({ 
        categories: localCategories, 
        isDatabase: false,
        error: error.message 
      });
    }

    return NextResponse.json({ 
      categories: data, 
      isDatabase: true 
    });
  } catch (error) {
    console.error("Kateqoriyalar çəkilərkən kritik xəta:", error);
    const localCategories = await getLocalCategories();
    return NextResponse.json({ 
      categories: localCategories, 
      isDatabase: false,
      error: error.message 
    });
  }
}

// ----------------------------------------------------
// 2. POST: Yeni kateqoriya əlavə edir (Yalnız Admin)
// ----------------------------------------------------
export async function POST(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "İcazəsiz giriş. Şifrə səhvdir." }, { status: 401 });
  }

  if (!isDbReady) {
    return NextResponse.json({ error: "Verilənlər bazası sazlanmayıb." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { name, icon, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Kateqoriya adı mütləq daxil edilməlidir." }, { status: 400 });
    }

    // Name-dən unikal id generasiya edirik (kiçik hərflər və rəqəmlər)
    let generatedId = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();

    if (!generatedId) {
      generatedId = `cat-${Date.now()}`;
    } else {
      generatedId = `${generatedId}-${Date.now().toString().slice(-4)}`;
    }

    const newCategory = {
      id: generatedId,
      name,
      icon: icon || "Utensils",
      description: description || ""
    };

    const { data, error } = await supabase
      .from("menu_categories")
      .insert([newCategory])
      .select();

    if (error) {
      if (error.message?.includes("Could not find the table") || error.code === "PGRST116" || error.message?.includes("relation") && error.message?.includes("does not exist")) {
        return NextResponse.json({ 
          error: "Supabase-də 'menu_categories' cədvəli tapılmadı! Zəhmət olmasa, layihə qovluğundakı 'schema.sql' faylının sonuna əlavə edilmiş SQL kodlarını Supabase Dashboard-da sol menyudan 'SQL Editor' bölməsinə daxil olub yapışdıraraq 'Run' düyməsinə sıxın." 
        }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, category: data[0] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ----------------------------------------------------
// 3. DELETE: Kateqoriyanı silir (Yalnız Admin)
// ----------------------------------------------------
export async function DELETE(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "İcazəsiz giriş. Şifrə səhvdir." }, { status: 401 });
  }

  if (!isDbReady) {
    return NextResponse.json({ error: "Verilənlər bazası sazlanmayıb." }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Silinəcək kateqoriyanın ID-si təqdim edilməyib." }, { status: 400 });
    }

    const { error } = await supabase
      .from("menu_categories")
      .delete()
      .eq("id", id);

    if (error) {
      if (error.message?.includes("Could not find the table") || error.code === "PGRST116" || error.message?.includes("relation") && error.message?.includes("does not exist")) {
        return NextResponse.json({ 
          error: "Supabase-də 'menu_categories' cədvəli tapılmadı! Zəhmət olmasa SQL skriptini işə salın." 
        }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
