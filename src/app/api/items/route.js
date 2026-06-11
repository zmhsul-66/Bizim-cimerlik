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

// Köməkçi funksiya: Lokal JSON faylından məlumatları oxuyur (Fallback)
async function getLocalData() {
  try {
    const filePath = path.join(process.cwd(), "public", "menuData.json");
    const fileContent = await fs.readFile(filePath, "utf-8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.error("Lokal JSON oxunarkən xəta:", error);
    return { categories: [], items: [] };
  }
}

// ----------------------------------------------------
// 1. GET: Bütün menyu elementlərini çəkir (Live / Fallback)
// ----------------------------------------------------
export async function GET() {
  // Əgər baza qoşulmayıbsa, birbaşa lokal JSON-dan qaytarırıq
  if (!isDbReady) {
    const localData = await getLocalData();
    return NextResponse.json({ 
      items: localData.items, 
      isDatabase: false 
    });
  }

  try {
    // Supabase-dən məlumatları oxuyuruq
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Verilənlər bazası sütunlarını (snake_case) frontend formatına (camelCase) uyğunlaşdırırıq
    const formattedItems = data.map(item => ({
      id: item.id,
      categoryId: item.category_id,
      name: item.name,
      price: item.price !== null && item.price !== undefined ? String(item.price) : "",
      ingredients: item.ingredients,
      image: item.image,
      tags: item.tags || [],
      isChefSpecial: item.is_chef_special
    }));

    return NextResponse.json({ 
      items: formattedItems, 
      isDatabase: true 
    });
  } catch (error) {
    console.error("Supabase-dən oxunarkən xəta (lokal fayla keçid edilir):", error);
    const localData = await getLocalData();
    return NextResponse.json({ 
      items: localData.items, 
      isDatabase: false,
      error: error.message 
    });
  }
}

// ----------------------------------------------------
// 2. POST: Yeni element əlavə edir (Yalnız Admin)
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
    const { categoryId, name, price, ingredients, image, tags, isChefSpecial } = body;

    // Yeni id generasiya edirik
    const cleanCategory = (categoryId || "main").replace(/[^a-zA-Z0-9]/g, "");
    const generatedId = `${cleanCategory}-${Date.now()}`;

    const newItem = {
      id: generatedId,
      category_id: categoryId,
      name,
      price: price !== null && price !== undefined ? String(price).trim() : "",
      ingredients,
      image: image || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&auto=format&fit=crop&q=80",
      tags: tags || [],
      is_chef_special: !!isChefSpecial
    };

    const { data, error } = await supabase
      .from("menu_items")
      .insert([newItem])
      .select();

    if (error) {
      if (error.message?.includes("Could not find the table") || error.code === "PGRST116" || error.message?.includes("relation") && error.message?.includes("does not exist")) {
        return NextResponse.json({ 
          error: "Supabase-də 'menu_items' cədvəli tapılmadı! Zəhmət olmasa, layihə qovluğundakı 'schema.sql' faylının içindəki bütün kodları kopyalayın və Supabase Dashboard-da sol menyudan 'SQL Editor' bölməsinə daxil olub 'New Query' yaradaraq oraya yapışdırıb 'Run' düyməsinə sıxın." 
        }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, item: data[0] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ----------------------------------------------------
// 3. PUT: Elementi redaktə edir (Yalnız Admin)
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
    const { id, categoryId, name, price, ingredients, image, tags, isChefSpecial } = body;

    if (!id) {
      return NextResponse.json({ error: "Element ID-si təqdim edilməyib." }, { status: 400 });
    }

    const updatedItem = {
      category_id: categoryId,
      name,
      price: price !== null && price !== undefined ? String(price).trim() : "",
      ingredients,
      image,
      tags: tags || [],
      is_chef_special: !!isChefSpecial
    };

    const { data, error } = await supabase
      .from("menu_items")
      .update(updatedItem)
      .eq("id", id)
      .select();

    if (error) {
      if (error.message?.includes("Could not find the table") || error.code === "PGRST116" || error.message?.includes("relation") && error.message?.includes("does not exist")) {
        return NextResponse.json({ 
          error: "Supabase-də 'menu_items' cədvəli tapılmadı! Zəhmət olmasa, layihə qovluğundakı 'schema.sql' faylının içindəki bütün kodları kopyalayın və Supabase Dashboard-da sol menyudan 'SQL Editor' bölməsinə daxil olub 'New Query' yaradaraq oraya yapışdırıb 'Run' düyməsinə sıxın." 
        }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, item: data[0] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ----------------------------------------------------
// 4. DELETE: Elementi silir (Yalnız Admin)
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
      return NextResponse.json({ error: "Silinəcək elementin ID-si təqdim edilməyib." }, { status: 400 });
    }

    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", id);

    if (error) {
      if (error.message?.includes("Could not find the table") || error.code === "PGRST116" || error.message?.includes("relation") && error.message?.includes("does not exist")) {
        return NextResponse.json({ 
          error: "Supabase-də 'menu_items' cədvəli tapılmadı! Zəhmət olmasa, layihə qovluğundakı 'schema.sql' faylının içindəki bütün kodları kopyalayın və Supabase Dashboard-da sol menyudan 'SQL Editor' bölməsinə daxil olub 'New Query' yaradaraq oraya yapışdırıb 'Run' düyməsinə sıxın." 
        }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
