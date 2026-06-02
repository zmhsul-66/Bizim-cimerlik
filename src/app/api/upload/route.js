import { NextResponse } from "next/server";
import { supabase, isDbReady } from "@/lib/supabase";

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
    return NextResponse.json({ error: "Verilənlər bazası sazlanmayıb." }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "Yükləmək üçün heç bir şəkil seçilməyib." }, { status: 400 });
    }

    // Faylın həcmini yoxlayırıq (maksimum 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Şəkil çox böyükdür. Maksimum limit 5MB-dır." }, { status: 400 });
    }

    // Yalnız şəkil fayllarına icazə veririk
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Yalnız şəkil faylları yüklənə bilər (PNG, JPG, WEBP)." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Təkrarolunmaz fayl adı yaradırıq (tarix + təmizlənmiş orijinal ad)
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
    const fileName = `${Date.now()}-${cleanFileName}`;

    // Supabase Storage-ə şəkli yükləyirik
    const { data, error } = await supabase.storage
      .from("menu-images")
      .upload(fileName, buffer, {
        contentType: file.type,
        duplex: 'half',
        upsert: true
      });

    if (error) {
      // Əgər "menu-images" qovluğu hələ yaradılmayıbsa istifadəçiyə aydın xəbərdarlıq veririk
      if (error.message.includes("not found") || error.statusCode === "404") {
        return NextResponse.json({ 
          error: "Supabase-də 'menu-images' adlı yaddaş qovluğu (Storage Bucket) tapılmadı! Zəhmət olmasa Supabase panelindən Storage bölməsinə keçib 'menu-images' adında İCTİMAİ (Public) qovluq yaradın." 
        }, { status: 404 });
      }
      throw error;
    }

    // Yüklənmiş şəklin ictimai URL-ni əldə edirik
    const { data: { publicUrl } } = supabase.storage
      .from("menu-images")
      .getPublicUrl(fileName);

    return NextResponse.json({ 
      success: true, 
      url: publicUrl 
    });
  } catch (error) {
    console.error("Şəkil yüklənərkən xəta:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
