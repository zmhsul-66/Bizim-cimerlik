import { NextResponse } from "next/server";
import { supabase, isDbReady } from "@/lib/supabase";
import fs from "fs/promises";
import path from "path";

function verifyAdmin(request) {
  const password = request.headers.get("x-admin-password");
  const expectedPassword = process.env.ADMIN_PASSWORD || "deniz123";
  return password === expectedPassword;
}

async function getLocalSettings() {
  try {
    const filePath = path.join(process.cwd(), "public", "menuData.json");
    const fileContent = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(fileContent);
    return {
      restaurantName: data.restaurantName || "Bizim çimərlik",
      restaurantSubtitle: data.restaurantSubtitle || "Restaurant & Lounge",
      currency: data.currency || "₼",
      contact: data.contact || { phone: "", address: "", wifi: "", wifiPassword: "" }
    };
  } catch (err) {
    console.error("Lokal settings oxunarkən xəta:", err);
    return {
      restaurantName: "Bizim çimərlik",
      restaurantSubtitle: "Restaurant & Lounge",
      currency: "₼",
      contact: { phone: "", address: "", wifi: "", wifiPassword: "" }
    };
  }
}

// ----------------------------------------------------
// 1. GET: Restoran sazlamalarını çəkir (Live / Fallback)
// ----------------------------------------------------
export async function GET() {
  if (!isDbReady) {
    const localSettings = await getLocalSettings();
    return NextResponse.json({ 
      settings: localSettings, 
      isDatabase: false 
    });
  }

  try {
    const { data, error } = await supabase
      .from("restaurant_settings")
      .select("*")
      .eq("id", "main")
      .single();

    if (error) {
      console.warn("Supabase-dən sazlamalar oxunarkən xəbərdarlıq (lokal rejimə keçid edilir):", error.message);
      
      // Əgər cədvəl mövcuddursa, lakin hələ heç bir məlumat yazılmayıbsa (PGRST116 - 0 rows returned)
      if (error.code === "PGRST116") {
        const localSettings = await getLocalSettings();
        return NextResponse.json({ 
          settings: localSettings, 
          isDatabase: true,
          isNew: true
        });
      }

      // Cədvəl yoxdursa və ya digər baza xətalarında birbaşa lokal settings qaytarırıq (500 xətasının qarşısını almaq üçün!)
      const localSettings = await getLocalSettings();
      return NextResponse.json({ 
        settings: localSettings, 
        isDatabase: false,
        error: error.message 
      });
    }

    if (!data) {
      const localSettings = await getLocalSettings();
      return NextResponse.json({ 
        settings: localSettings, 
        isDatabase: true,
        isNew: true
      });
    }

    const formattedSettings = {
      restaurantName: data.restaurant_name,
      restaurantSubtitle: data.restaurant_subtitle,
      currency: data.currency,
      contact: {
        phone: data.phone,
        address: data.address,
        wifi: data.wifi,
        wifiPassword: data.wifi_password
      }
    };

    return NextResponse.json({ 
      settings: formattedSettings, 
      isDatabase: true 
    });
  } catch (error) {
    console.error("Supabase-dən sazlamalar oxunarkən kritik xəta:", error);
    const localSettings = await getLocalSettings();
    return NextResponse.json({ 
      settings: localSettings, 
      isDatabase: false,
      error: error.message 
    });
  }
}

// ----------------------------------------------------
// 2. POST: Sazlamaları yeniləyir (Yalnız Admin)
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
    const { restaurantName, restaurantSubtitle, currency, contact } = body;

    if (!restaurantName) {
      return NextResponse.json({ error: "Restoran adı mütləq daxil edilməlidir." }, { status: 400 });
    }

    const dbSettings = {
      id: "main",
      restaurant_name: restaurantName,
      restaurant_subtitle: restaurantSubtitle || "",
      currency: currency || "₼",
      phone: contact?.phone || "",
      address: contact?.address || "",
      wifi: contact?.wifi || "",
      wifi_password: contact?.wifiPassword || ""
    };

    // Upsert (varsa yeniləyir, yoxdursa yaradır)
    const { data, error } = await supabase
      .from("restaurant_settings")
      .upsert([dbSettings])
      .select();

    if (error) {
      if (error.message?.includes("Could not find the table") || error.code === "PGRST116" || error.message?.includes("relation") && error.message?.includes("does not exist")) {
        return NextResponse.json({ 
          error: "Supabase-də 'restaurant_settings' cədvəli tapılmadı! Zəhmət olmasa, layihə qovluğundakı 'schema.sql' faylının içindəki bütün kodları kopyalayın və Supabase Dashboard-da sol menyudan 'SQL Editor' bölməsinə daxil olub 'New Query' yaradaraq oraya yapışdırıb 'Run' düyməsinə sıxın." 
        }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, settings: data[0] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
