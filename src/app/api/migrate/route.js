import { NextResponse } from "next/server";
import { supabase, isDbReady } from "@/lib/supabase";
import fs from "fs/promises";
import path from "path";

// Şifrəni yoxlayan köməkçi funksiya
function verifyAdmin(request) {
  const password = request.headers.get("x-admin-password");
  const expectedPassword = process.env.ADMIN_PASSWORD || "deniz123";
  return password === expectedPassword;
}

export async function POST(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "İcazəsiz giriş. Şifrə səhvdir." }, { status: 401 });
  }

  if (!isDbReady) {
    return NextResponse.json({ error: "Verilənlər bazası hələ sazlanmayıb. Öncə .env.local faylını quraşdırın." }, { status: 400 });
  }

  try {
    // 1. Mövcud menuData.json faylını oxuyuruq
    const filePath = path.join(process.cwd(), "public", "menuData.json");
    const fileContent = await fs.readFile(filePath, "utf-8");
    const localData = JSON.parse(fileContent);

    // 2. Yeməkləri miqrasiya edirik
    if (localData.items && localData.items.length > 0) {
      // Dublikat olmaması üçün köhnə elementləri silirik
      await supabase
        .from("menu_items")
        .delete()
        .neq("id", "dummy-prevent-empty-error");

      const itemsToInsert = localData.items.map(item => ({
        id: item.id,
        category_id: item.categoryId,
        name: item.name,
        price: String(item.price),
        ingredients: item.ingredients,
        image: item.image,
        tags: item.tags || [],
        is_chef_special: !!item.isChefSpecial
      }));

      const { error: itemsError } = await supabase
        .from("menu_items")
        .insert(itemsToInsert);

      if (itemsError) {
        if (itemsError.message?.includes("Could not find the table") || itemsError.code === "PGRST116" || itemsError.message?.includes("relation") && itemsError.message?.includes("does not exist")) {
          return NextResponse.json({ 
            error: "Supabase-də 'menu_items' cədvəli tapılmadı! Zəhmət olmasa, layihə qovluğundakı 'schema.sql' faylının içindəki bütün kodları kopyalayın və Supabase Dashboard-da sol menyudan 'SQL Editor' bölməsinə daxil olub 'New Query' yaradaraq oraya yapışdırıb 'Run' düyməsinə sıxın." 
          }, { status: 400 });
        }
        throw itemsError;
      }
    }

    // 2.5. Kateqoriyaları miqrasiya edirik
    if (localData.categories && localData.categories.length > 0) {
      // Dublikat olmaması üçün köhnə kateqoriyaları silirik
      await supabase
        .from("menu_categories")
        .delete()
        .neq("id", "dummy-prevent-empty-error");

      const categoriesToInsert = localData.categories.map((cat, idx) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon || "Utensils",
        description: cat.description || "",
        sort_order: cat.sort_order !== undefined ? cat.sort_order : idx,
        watermark_url: cat.watermark_url || ""
      }));

      const { error: catsError } = await supabase
        .from("menu_categories")
        .insert(categoriesToInsert);

      if (catsError) {
        if (catsError.message?.includes("Could not find the table") || catsError.code === "PGRST116" || catsError.message?.includes("relation") && catsError.message?.includes("does not exist")) {
          return NextResponse.json({ 
            error: "Supabase-də 'menu_categories' cədvəli tapılmadı! Zəhmət olmasa, layihə qovluğundakı 'schema.sql' faylının sonuna əlavə edilmiş SQL kodlarını Supabase Dashboard-da SQL Editor-da işə salın." 
          }, { status: 400 });
        }
        throw catsError;
      }
    }

    // 3. Restoran ümumi məlumatlarını miqrasiya edirik (settings)
    const dbSettings = {
      id: "main",
      restaurant_name: localData.restaurantName || "Bizim çimərlik",
      restaurant_subtitle: localData.restaurantSubtitle || "Restaurant & Lounge",
      currency: localData.currency || "₼",
      phone: localData.contact?.phone || "",
      address: localData.contact?.address || "",
      wifi: localData.contact?.wifi || "",
      wifi_password: localData.contact?.wifiPassword || ""
    };

    const { error: settingsError } = await supabase
      .from("restaurant_settings")
      .upsert([dbSettings]);

    if (settingsError) {
      if (settingsError.message?.includes("Could not find the table") || settingsError.code === "PGRST116" || settingsError.message?.includes("relation") && settingsError.message?.includes("does not exist")) {
        return NextResponse.json({ 
          error: "Supabase-də 'restaurant_settings' cədvəli tapılmadı! Zəhmət olmasa, layihə qovluğundakı 'schema.sql' faylının içindəki bütün kodları kopyalayın və Supabase Dashboard-da sol menyudan 'SQL Editor' bölməsinə daxil olub 'New Query' yaradaraq oraya yapışdırıb 'Run' düyməsinə sıxın." 
        }, { status: 400 });
      }
      throw settingsError;
    }

    return NextResponse.json({ 
      success: true, 
      message: "Uğurlu! Bütün yeməklər və restoran ümumi məlumatları (ad, ünvan, telefon, wifi) bazaya uğurla köçürüldü.",
      count: localData.items ? localData.items.length : 0
    });
  } catch (error) {
    console.error("Miqrasiya zamanı xəta:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
