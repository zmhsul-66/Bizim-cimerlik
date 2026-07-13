import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Köməkçi funksiya: Şifrəni yoxlayır
function verifyAdmin(request) {
  const password = request.headers.get("x-admin-password");
  const expectedPassword = process.env.ADMIN_PASSWORD || "deniz123";
  return password === expectedPassword;
}

// ----------------------------------------------------
// 1. GET: Xidmətləri çəkir (Local JSON)
// ----------------------------------------------------
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "menuData.json");
    const fileContent = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(fileContent);
    return NextResponse.json({ 
      services: data.services || [], 
      isDatabase: false 
    });
  } catch (error) {
    console.error("Lokal JSON oxunarkən xəta (Services):", error);
    return NextResponse.json({ 
      services: [], 
      error: error.message 
    });
  }
}

// ----------------------------------------------------
// 2. POST: Bütün xidmətləri yeniləyir (Yalnız Admin)
// ----------------------------------------------------
export async function POST(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "İcazəsiz giriş. Şifrə səhvdir." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { services } = body;

    if (!services || !Array.isArray(services)) {
      return NextResponse.json({ error: "Yanlış məlumat formatı." }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "public", "menuData.json");
    const fileContent = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(fileContent);
    
    // Məlumatı yenilə
    data.services = services;

    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");

    return NextResponse.json({ 
      success: true, 
      message: "Xidmətlər uğurla yeniləndi." 
    });
  } catch (error) {
    console.error("Xidmətlər yenilənərkən xəta:", error);
    return NextResponse.json({ error: "Daxili server xətası." }, { status: 500 });
  }
}
