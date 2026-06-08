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
      .select("*");

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

    // JS-də sort_order sütununun olub-olmamasını xətasız yoxlayıb sıralayırıq (fallback)
    if (data) {
      data.sort((a, b) => {
        const orderA = a.sort_order !== undefined && a.sort_order !== null ? a.sort_order : 0;
        const orderB = b.sort_order !== undefined && b.sort_order !== null ? b.sort_order : 0;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return new Date(a.created_at) - new Date(b.created_at);
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
    const { name, icon, description, watermark_url } = body;

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
      description: description || "",
      watermark_url: watermark_url || ""
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

// ----------------------------------------------------
// 4. PUT: Kateqoriyaların sırasını yeniləyir (Yalnız Admin)
// ----------------------------------------------------
export async function PUT(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "İcazəsiz giriş. Şifrə səhvdir." }, { status: 401 });
  }

  if (!isDbReady) {
    return NextResponse.json({ error: "Verilənlər bazası sazlanmayıb." }, { status: 400 });
  }

  try {
    const body = await request.json();
    
    // Case 1: Reordering categories
    if (body.orders && Array.isArray(body.orders)) {
      for (const item of body.orders) {
        const { error } = await supabase
          .from("menu_categories")
          .update({ sort_order: item.sort_order })
          .eq("id", item.id);

        if (error) {
          if (error.message?.includes("sort_order") || error.code === "PGRST116" || error.message?.includes("column") && error.message?.includes("does not exist")) {
            return NextResponse.json({ 
              error: "Supabase-də 'menu_categories' cədvəlində 'sort_order' sütunu tapılmadı! Sıralamanın yadda qalması üçün SQL Editor-da müvafiq sütunu yaratmalısınız.",
              needsMigration: true
            }, { status: 400 });
          }
          throw error;
        }
      }
      return NextResponse.json({ success: true, message: "Sıralama uğurla yeniləndi!" });
    }

    // Case 2: Update single category details
    const { id, name, icon, description, watermark_url } = body;
    if (!id || !name) {
      return NextResponse.json({ error: "Kateqoriya ID-si və adı təqdim edilməlidir." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("menu_categories")
      .update({ name, icon, description, watermark_url })
      .eq("id", id)
      .select();

    if (error) {
      if (error.message?.includes("watermark_url") || error.code === "PGRST116" || error.message?.includes("column") && error.message?.includes("does not exist")) {
        return NextResponse.json({ 
          error: "Supabase-də 'menu_categories' cədvəlində 'watermark_url' sütunu tapılmadı! Zəhmət olmasa SQL Editor-da bu skripti işə salın:\n\nALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS watermark_url TEXT;",
          needsWatermarkMigration: true
        }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, category: data[0] });

  } catch (error) {
    console.error("Kateqoriyalar yenilənərkən xəta:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
