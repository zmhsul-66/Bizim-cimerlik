'use client';

import { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import menuData from "../../../public/menuData.json";

export default function PrintPage() {
  // Verilənlər
  const [items, setItems] = useState(menuData.items);
  const [categories, setCategories] = useState(menuData.categories);
  const [settings, setSettings] = useState({
    restaurantName: menuData.restaurantName,
    restaurantSubtitle: menuData.restaurantSubtitle,
    currency: menuData.currency,
    contact: menuData.contact
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Çap Parametrləri (Print Settings)
  const [selectedCategory, setSelectedCategory] = useState("all");
  const columns = "1"; // Həmişə 1 sütunlu (alt-alta) düzən
  const [showImages, setShowImages] = useState(false);
  const [showIngredients, setShowIngredients] = useState(true);
  const [fontSize, setFontSize] = useState("14px"); // 12px, 14px, 16px, 18px
  const [marginSize, setMarginSize] = useState("1.5cm"); // 1cm, 1.5cm, 2cm
  const [theme, setTheme] = useState("gold"); // "minimalist", "gold", "classic"
  const [showContactInfo, setShowContactInfo] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.50); // Default 50% opacity

  // Səhifə yüklənəndə mövzunu və real məlumatları çəkirik
  useEffect(() => {
    // Mövzu yoxlanılması
    try {
      const savedTheme = localStorage.getItem("deniz_theme");
      setIsDarkMode(savedTheme === "dark");
    } catch (e) {
      console.error(e);
    }

    const loadAllData = async () => {
      try {
        // 1. Settings
        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData.settings) {
            setSettings(settingsData.settings);
          }
        }
        
        // 2. Categories
        const categoriesRes = await fetch("/api/categories");
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          if (categoriesData.categories && categoriesData.categories.length > 0) {
            // Kateqoriyaları sort_order-ə görə sıralayaq
            const sortedCats = [...categoriesData.categories].sort((a, b) => {
              const orderA = a.sort_order !== undefined ? a.sort_order : 0;
              const orderB = b.sort_order !== undefined ? b.sort_order : 0;
              return orderA - orderB;
            });
            setCategories(sortedCats);
          }
        }

        // 3. Items
        const itemsRes = await fetch("/api/items");
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          if (itemsData.items && itemsData.items.length > 0) {
            setItems(itemsData.items);
          }
        }
      } catch (err) {
        console.warn("Məlumatlar bazadan çəkilmədi, lokal ehtiyat nüsxə işlədilir:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, []);

  // Kateqoriya üzrə filtrlənmiş yeməklər
  const getFilteredCategories = () => {
    if (selectedCategory === "all") {
      // Yalnız yeməyi olan kateqoriyaları göstərək
      return categories.filter(cat => items.some(item => item.categoryId === cat.id));
    }
    return categories.filter(cat => cat.id === selectedCategory);
  };

  // Səhifələri qruplaşdırmaq üçün funksiya (Helper to get print sheets)
  const getPrintSheets = () => {
    const activeCategories = categories.filter(cat => items.some(item => item.categoryId === cat.id));
    
    if (selectedCategory !== "all") {
      const cat = activeCategories.find(c => c.id === selectedCategory);
      return cat ? [{ id: cat.id, categories: [cat] }] : [];
    }

    const sheets = [];
    const processedCatIds = new Set();

    activeCategories.forEach(cat => {
      if (processedCatIds.has(cat.id)) return;

      if (cat.id === 'qazanyemklri-3951' || cat.id === 'suplar-2026') {
        const qazanCat = activeCategories.find(c => c.id === 'qazanyemklri-3951');
        const suplarCat = activeCategories.find(c => c.id === 'suplar-2026');
        const sheetCats = [];
        if (qazanCat) {
          sheetCats.push(qazanCat);
          processedCatIds.add('qazanyemklri-3951');
        }
        if (suplarCat) {
          sheetCats.push(suplarCat);
          processedCatIds.add('suplar-2026');
        }
        if (sheetCats.length > 0) {
          sheets.push({
            id: 'qazan-suplar',
            categories: sheetCats
          });
        }
      } else if (cat.id === 'sac-3032' || cat.id === 'pizza') {
        const sacCat = activeCategories.find(c => c.id === 'sac-3032');
        const pizzaCat = activeCategories.find(c => c.id === 'pizza');
        const sheetCats = [];
        if (sacCat) {
          sheetCats.push(sacCat);
          processedCatIds.add('sac-3032');
        }
        if (pizzaCat) {
          sheetCats.push(pizzaCat);
          processedCatIds.add('pizza');
        }
        if (sheetCats.length > 0) {
          sheets.push({
            id: 'sac-pizza',
            categories: sheetCats
          });
        }
      } else {
        processedCatIds.add(cat.id);
        sheets.push({
          id: cat.id,
          categories: [cat]
        });
      }
    });

    return sheets;
  };

  const getCategoryItems = (catId) => {
    return items.filter(item => item.categoryId === catId);
  };

  // Çap dialoqunu açır
  const handlePrint = () => {
    window.print();
  };

  // PDF kimi yadda saxlayır (Birbaşa fayla ixrac edir)
  const handleSavePDF = async () => {
    setIsGenerating(true);
    try {
      // Dinamik importlar (SSR zamanı build/window xətalarının qarşısını almaq üçün)
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const container = document.getElementById("print-content");
      if (!container) return;

      // PDF üçün xüsusi sinfi əlavə edirik (kənarlıqları/kölgələri təmizləmək üçün)
      container.classList.add("generating-pdf");

      const sheets = container.querySelectorAll(".preview-sheet");
      if (sheets.length === 0) {
        container.classList.remove("generating-pdf");
        setIsGenerating(false);
        return;
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      for (let i = 0; i < sheets.length; i++) {
        const sheet = sheets[i];
        
        // Hər bir vərəqi ayrılıqda şəkilə çeviririk (CORS aktivdir ki, 4K arxa fonlar düşsün)
        const canvas = await html2canvas(sheet, {
          scale: 2.5,
          useCORS: true,
          logging: false
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }

      pdf.save('deniz_qiragi_menyu.pdf');
    } catch (err) {
      console.error("PDF yaradılarkən xəta baş verdi:", err);
      alert("PDF faylı yaradıla bilmədi. Zəhmət olmasa yenidən cəhd edin.");
    } finally {
      const container = document.getElementById("print-content");
      if (container) {
        container.classList.remove("generating-pdf");
      }
      setIsGenerating(false);
    }
  };

  // İkonu render etmək
  const renderIcon = (iconName, className = "w-5 h-5") => {
    const IconComponent = Icons[iconName];
    if (!IconComponent) return <Icons.HelpCircle className={className} />;
    return <IconComponent className={className} />;
  };

  // Qiymətin formatlanması (çoxlu qiymətlərə sləş və ya defis ilə dəstək)
  const formatPrice = (price, currency) => {
    if (price === undefined || price === null) return "";
    const priceStr = String(price).trim();
    if (!isNaN(priceStr) && priceStr !== "") {
      return `${Number(priceStr).toFixed(2)} ${currency}`;
    }
    const hasLetters = /[a-zA-Z₼]/.test(priceStr);
    
    // Rəqəmləri formatlayan köməkçi funksiya (məsələn: 15 -> 15.00)
    const formatPart = (part) => {
      const trimmed = part.trim();
      return (!isNaN(trimmed) && trimmed !== "") ? Number(trimmed).toFixed(2) : trimmed;
    };

    let formatted = priceStr;
    if (priceStr.includes("/")) {
      formatted = priceStr.split("/").map(formatPart).join(" / ");
    } else if (priceStr.includes("-")) {
      formatted = priceStr.split("-").map(formatPart).join(" - ");
    }

    return `${formatted}${!hasLetters ? ` ${currency}` : ""}`;
  };

  const getCategoryWatermark = (catId) => {
    const cat = categories.find(c => c.id === catId);
    if (cat && cat.watermark_url) {
      return cat.watermark_url;
    }

    switch (catId) {
      case 'alkoqolsuzikilr-1595':
      case 'drinks':
      case 'istiikilr-2571':
        return '/bg_isti_ickiler.jpg'; // Alkoqolsuz / İsti içkilər / Çay (İstifadəçi şəkli)
      case 'alkoqolluikilr-0561':
        return 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1000&auto=format&fit=crop&q=40'; // Premium şərab qədəhləri
      case 'rzlr-6753':
      case 'desserts':
        return '/bg_cerezdeler.jpg'; // Zəngin çərəz assortisi (İstifadəçi şəkli)
      case 'kabablar-3265':
      case 'grill':
        return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1000&auto=format&fit=crop&q=40'; // Köz üstündə kabab şişləri
      case 'tavayemklri-1427':
      case 'mains':
        return 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1000&auto=format&fit=crop&q=40'; // İsti tava yeməkləri / Tabaka
      case 'sac-3032':
        return '/bg_sac.jpg'; // Sac üzərində qızmar təamlar (İstifadəçi şəkli)
      case 'qazanyemklri-3951':
        return 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=1000&auto=format&fit=crop&q=40'; // Ənənəvi qazan yeməyi / Dolma
      case 'suplar-2026':
      case 'soups':
        return '/bg_suplar.jpg'; // İsti buxarlanan şorba piyaləsi (İstifadəçi şəkli)
      case 'starters':
      case 'salatlar-3209':
        return '/bg_salatlar.jpg'; // Soyuq qəlyanaltılar / Salatlar (İstifadəçi şəkli)
      case 'breakfast':
      case 'seheryemeyi':
      case 'seher-yemeyi':
      case 'shrymy':
      case 'shryemklri-9374':
        return '/bg_seher_yemeyi.jpg'; // Səhər yeməyi (İstifadəçi şəkli)
      default:
        return 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=1000&auto=format&fit=crop&q=40'; // Restoran dizaynlı default arxa fon
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center space-y-4">
        <Icons.Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
        <p className="text-xs font-bold tracking-widest uppercase text-slate-300">Çap məlumatları yüklənir...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#06152d] text-slate-800 dark:text-white pb-12 transition-colors duration-300">
      
      {/* CSS STYLE HAKİ - Çap zamanı və ekranda fərqli görünüşlər üçün */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          html, body {
            width: 100% !important;
            height: 100% !important;
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-page-container {
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: none !important;
          }
          .preview-sheet {
            box-sizing: border-box !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: ${marginSize} !important;
            width: 100vw !important;
            height: 100vh !important;
            max-width: 100vw !important;
            max-height: 100vh !important;
            min-height: 100vh !important;
            page-break-after: always !important;
            break-after: page !important;
            overflow: hidden !important;
          }
          .page-break-before {
            page-break-before: always !important;
            break-before: page !important;
          }
          .print-item-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          /* Çapda şrift rənglərini tündləşdiririk ki, aydın oxunsun */
          .print-text-dark {
            color: #111827 !important;
          }
          .print-text-muted {
            color: #4b5563 !important;
          }
          .print-border-gold {
            border-color: #b45309 !important;
          }
          .print-leader-line {
            border-bottom-color: #9ca3af !important;
          }
        }

        /* Ekranda vərəq önizləməsi */
        .preview-sheet {
          background: white;
          color: #1f2937;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -10px rgba(0, 0, 0, 0.04);
          width: 100%;
          max-width: 210mm;
          min-height: 297mm;
          height: 297mm;
          padding: ${marginSize};
          margin: 0 auto;
          position: relative;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
        }

        .leader-dots {
          flex-grow: 1;
          border-bottom: 2px dotted #9ca3af;
          margin-left: 8px;
          margin-right: 8px;
          position: relative;
          top: -4px;
        }

        .gold-double-border {
          border: 4px double #d97706;
          padding: 1.5rem;
          height: 100%;
        }

        .classic-border {
          border: 1px solid #e5e7eb;
          padding: 1.5rem;
          height: 100%;
        }

        /* PDF Generation Styles */
        .generating-pdf {
          background: transparent !important;
          padding: 0 !important;
          margin: 0 !important;
          width: 210mm !important;
        }
        .generating-pdf .preview-sheet {
          box-shadow: none !important;
          border-radius: 0 !important;
          margin: 0 !important;
          padding: ${marginSize} !important;
          width: 210mm !important;
          height: 297mm !important;
          position: relative !important;
          page-break-after: always !important;
          break-after: page !important;
          display: flex !important;
          flex-direction: column !important;
        }
        .generating-pdf .gold-double-border,
        .generating-pdf .classic-border {
          height: 100% !important;
        }
      `}</style>

      {/* ÜST İDARƏETMƏ PANELİ (NO-PRINT) */}
      <div className="no-print bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.close()} 
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
              title="Bağla"
            >
              <Icons.ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-playfair text-lg font-bold text-amber-400 flex items-center gap-1.5">
                <Icons.Printer className="w-5 h-5" />
                <span>Menyu Çap Paneli</span>
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Premium kağız menyu ixracatı</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSavePDF}
              disabled={isGenerating}
              className={`px-5 py-2.5 text-white rounded-xl text-sm font-bold shadow-md active:scale-98 transition-all flex items-center gap-2 cursor-pointer ${
                isGenerating 
                  ? "bg-slate-700 shadow-slate-700/20 cursor-not-allowed" 
                  : "bg-sky-600 hover:bg-sky-700 shadow-sky-600/20"
              }`}
            >
              {isGenerating ? (
                <>
                  <Icons.Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>PDF Hazırlanır...</span>
                </>
              ) : (
                <>
                  <Icons.Download className="w-4.5 h-4.5" />
                  <span>PDF Yadda Saxla</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              disabled={isGenerating}
              className={`px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 active:scale-98 transition-all flex items-center gap-2 cursor-pointer ${
                isGenerating ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Icons.Printer className="w-4.5 h-4.5" />
              <span>Çap Et (Ctrl + P)</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SOL TƏRƏF: TƏNZİMLƏMƏLƏR (NO-PRINT) */}
        <div className="no-print lg:col-span-4 bg-white dark:bg-[#0c2447]/60 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm space-y-6 self-start text-sm">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Icons.Sliders className="w-4.5 h-4.5 text-amber-500" />
              <span>Çap Tənzimləmələri</span>
            </h2>
            <p className="text-xs text-slate-400 dark:text-sky-200/50 mt-0.5">Buradan kağız menyunun görünüşünü özünüzə uyğun dizayn edə bilərsiniz.</p>
          </div>

          <div className="space-y-4">
            
            {/* Kateqoriya Seçimi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-sky-200">Çap olunacaq kateqoriya</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-sky-400/20 bg-slate-50 dark:bg-[#0c2447] text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
              >
                <option value="all">Bütün Kateqoriyalar (Hər biri ayrı vərəqdə)</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>



            {/* Menyu Mövzusu (Theme) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-sky-200">Menyu Çərçivə Mövzusu</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setTheme("minimalist")}
                  className={`py-2 px-1 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                    theme === "minimalist"
                      ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400"
                      : "border-slate-200 dark:border-sky-400/15 text-slate-600 dark:text-sky-200 bg-transparent"
                  }`}
                >
                  Minimalist
                </button>
                <button
                  onClick={() => setTheme("gold")}
                  className={`py-2 px-1 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                    theme === "gold"
                      ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400"
                      : "border-slate-200 dark:border-sky-400/15 text-slate-600 dark:text-sky-200 bg-transparent"
                  }`}
                >
                  Qızılı Çərçivə
                </button>
                <button
                  onClick={() => setTheme("classic")}
                  className={`py-2 px-1 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                    theme === "classic"
                      ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400"
                      : "border-slate-200 dark:border-sky-400/15 text-slate-600 dark:text-sky-200 bg-transparent"
                  }`}
                >
                  Nazik Xətt
                </button>
              </div>
            </div>

            {/* Şrift Ölçüsü */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-sky-200">Şrift Ölçüsü (Yemək adları)</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: "Kiçik", val: "12px" },
                  { label: "Orta", val: "14px" },
                  { label: "Böyük", val: "16px" },
                  { label: "X-Böyük", val: "18px" }
                ].map(item => (
                  <button
                    key={item.val}
                    onClick={() => setFontSize(item.val)}
                    className={`py-1.5 px-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                      fontSize === item.val
                        ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400"
                        : "border-slate-200 dark:border-sky-400/15 text-slate-600 dark:text-sky-200 bg-transparent"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Kağız Kənarları (Margins) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-sky-200">Kağız Kənarları (Margins)</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Dar (1cm)", val: "1cm" },
                  { label: "Orta (1.5cm)", val: "1.5cm" },
                  { label: "Geniş (2cm)", val: "2cm" }
                ].map(item => (
                  <button
                    key={item.val}
                    onClick={() => setMarginSize(item.val)}
                    className={`py-2 px-1 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                      marginSize === item.val
                        ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400"
                        : "border-slate-200 dark:border-sky-400/15 text-slate-600 dark:text-sky-200 bg-transparent"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-slate-100 dark:border-white/10" />

            {/* Görünüş Seçimləri (Checkbox toggles) */}
            <div className="space-y-3">
              {/* Şəkilləri Göstər */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showImages}
                  onChange={(e) => setShowImages(e.target.checked)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-sky-100">Yemək şəkillərini göstər</span>
              </label>

              {/* Arxa Fon Şəklini Göstər */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-sky-100">Arxa fon şəkli (Watermark) göstər</span>
              </label>

              {showWatermark && (
                <div className="space-y-1.5 pl-6">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-sky-200">
                    <span>Şəffaflıq:</span>
                    <span>{Math.round(watermarkOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.02"
                    max="1.00"
                    step="0.01"
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              )}

              {/* Tərkibləri Göstər */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showIngredients}
                  onChange={(e) => setShowIngredients(e.target.checked)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-sky-100">Yemək tərkiblərini (təsvirlərini) göstər</span>
              </label>

              {/* Restoran Məlumatlarını Göstər */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showContactInfo}
                  onChange={(e) => setShowContactInfo(e.target.checked)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-sky-100">Restoranın əlaqə məlumatlarını göstər</span>
              </label>
            </div>

          </div>
        </div>

        {/* SAĞ TƏRƏF: VƏRƏQ ÖNİZLƏMƏSİ (PREVIEW & PRINT) */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <p className="no-print text-xs text-slate-400 dark:text-sky-200/40 mb-3 font-semibold uppercase tracking-wider">
            Kağız Görünüşü (Preview)
          </p>

          <div id="print-content" className="print-page-container w-full space-y-8">
            {getPrintSheets().map((sheet, sheetIdx) => {
              const isPageBreak = selectedCategory === "all" && sheetIdx > 0;
              const firstCat = sheet.categories[0];
              const isSacPizzaSplit = sheet.id === 'sac-pizza' && sheet.categories.length > 1;

              return (
                <div 
                  key={sheet.id} 
                  className={`preview-sheet overflow-hidden ${isPageBreak ? "page-break-before" : ""}`}
                >
                  {showWatermark && (
                    <div className={`absolute inset-0 z-0 pointer-events-none select-none flex ${isSacPizzaSplit ? 'flex-col' : 'flex-row'}`}>
                      {sheet.categories.map((cat, catIdx) => {
                        // Qazan + Suplar vərəqində yalnız birinci kateqoriyanın arxa fonunu göstəririk
                        if (sheet.id === 'qazan-suplar' && catIdx > 0) return null;
                        
                        const watermarkUrl = getCategoryWatermark(cat.id);
                        if (!watermarkUrl) return null;
                        
                        // Əgər qazan-suplar vərəqindəyiksə və ya yalnız 1 kateqoriya varsa 100% enində/hündürlüyündə olmalıdır
                        const sizePct = (sheet.id === 'qazan-suplar' || sheet.categories.length === 1) 
                          ? 100 
                          : (100 / sheet.categories.length);
                        
                        return (
                          <img 
                            key={cat.id}
                            src={watermarkUrl} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            style={{ 
                              width: isSacPizzaSplit ? '100%' : `${sizePct}%`,
                              height: isSacPizzaSplit ? `${sizePct}%` : '100%',
                              opacity: watermarkOpacity 
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                  <div className={`relative z-10 flex-1 flex flex-col ${
                    theme === "gold" ? "gold-double-border" : 
                    theme === "classic" ? "classic-border" : ""
                  }`} style={{ height: '100%' }}>
                    {isSacPizzaSplit ? (
                      <>
                        {/* ÜST HİSSƏ: Sac Yeməkləri */}
                        <div className="h-1/2 flex flex-col justify-between pb-4 border-b border-dashed border-amber-600/30">
                          {/* RESTORAN HEADER (Hər vərəqin və ya seçilmiş kateqoriyanın başında) */}
                          {(sheetIdx === 0 || selectedCategory !== "all") && (
                            <div className="text-center pb-3 border-b-2 print-border-gold border-amber-600/30 max-w-xl mx-auto space-y-1 mb-3 shrink-0">
                              <div className="flex justify-center text-amber-600">
                                <Icons.UtensilsCrossed className="w-6 h-6" />
                              </div>
                              <h2 className="font-playfair text-2xl font-extrabold tracking-wide print-text-dark text-slate-900 uppercase">
                                {settings.restaurantName}
                              </h2>
                              {settings.restaurantSubtitle && (
                                <p className="text-[10px] uppercase tracking-[0.25em] text-amber-700 font-extrabold print-text-muted">
                                  {settings.restaurantSubtitle}
                                </p>
                              )}
                              {showContactInfo && (
                                <div className="pt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-0.5 text-[10px] text-gray-500 font-medium print-text-muted">
                                  {settings.contact?.phone && (
                                    <span className="flex items-center gap-1">
                                      <Icons.Phone className="w-2.5 h-2.5 text-amber-600" />
                                      <span>{settings.contact.phone}</span>
                                    </span>
                                  )}
                                  {settings.contact?.address && (
                                    <span className="flex items-center gap-1">
                                      <Icons.MapPin className="w-2.5 h-2.5 text-amber-600" />
                                      <span>{settings.contact.address}</span>
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Sac Kateqoriyası və Yeməkləri */}
                          {sheet.categories.filter(cat => cat.id === 'sac-3032').map(cat => {
                            const categoryItems = getCategoryItems(cat.id);
                            return (
                              <div key={cat.id} className="flex-1 flex flex-col justify-center min-h-0">
                                <div className="text-center my-2 shrink-0">
                                  <h3 className="font-playfair text-lg md:text-xl font-bold tracking-[0.1em] text-amber-800 uppercase inline-block border-b border-amber-600 pb-1 px-4 print-text-dark">
                                    {cat.name}
                                  </h3>
                                </div>
                                <div className="flex-1 flex flex-col justify-center overflow-hidden">
                                  <div className="space-y-4">
                                    {categoryItems.map(item => (
                                      <div key={item.id} className="print-item-card space-y-1">
                                        <div className="flex items-baseline justify-between">
                                          <div className="flex items-center gap-3 min-w-0">
                                            {showImages && item.image && (
                                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200/80 shrink-0 bg-slate-100">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                              </div>
                                            )}
                                            <span 
                                              className="font-playfair font-bold text-slate-900 print-text-dark leading-tight" 
                                              style={{ fontSize }}
                                            >
                                              {item.name}
                                              {item.isChefSpecial && (
                                                <span className="ml-2 text-[8px] tracking-wider font-extrabold uppercase px-1.5 py-0.5 bg-amber-600 text-white rounded shrink-0">Şef</span>
                                              )}
                                            </span>
                                          </div>
                                          <div className="leader-dots print-leader-line border-slate-300"></div>
                                          <span 
                                            className="font-bold text-slate-900 print-text-dark shrink-0" 
                                            style={{ fontSize }}
                                          >
                                            {formatPrice(item.price, settings.currency)}
                                          </span>
                                        </div>
                                        {showIngredients && item.ingredients && (
                                          <p className="text-xs text-gray-500 italic pl-1 print-text-muted leading-relaxed max-w-2xl">
                                            {item.ingredients}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* ALT HİSSƏ: Pizza Yeməkləri */}
                        <div className="h-1/2 flex flex-col justify-center pt-4">
                          {sheet.categories.filter(cat => cat.id === 'pizza').map(cat => {
                            const categoryItems = getCategoryItems(cat.id);
                            return (
                              <div key={cat.id} className="flex-1 flex flex-col justify-center min-h-0">
                                <div className="text-center my-2 shrink-0">
                                  <h3 className="font-playfair text-lg md:text-xl font-bold tracking-[0.1em] text-amber-800 uppercase inline-block border-b border-amber-600 pb-1 px-4 print-text-dark">
                                    {cat.name}
                                  </h3>
                                </div>
                                <div className="flex-1 flex flex-col justify-center overflow-hidden">
                                  <div className="space-y-4">
                                    {categoryItems.map(item => (
                                      <div key={item.id} className="print-item-card space-y-1">
                                        <div className="flex items-baseline justify-between">
                                          <div className="flex items-center gap-3 min-w-0">
                                            {showImages && item.image && (
                                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200/80 shrink-0 bg-slate-100">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                              </div>
                                            )}
                                            <span 
                                              className="font-playfair font-bold text-slate-900 print-text-dark leading-tight" 
                                              style={{ fontSize }}
                                            >
                                              {item.name}
                                              {item.isChefSpecial && (
                                                <span className="ml-2 text-[8px] tracking-wider font-extrabold uppercase px-1.5 py-0.5 bg-amber-600 text-white rounded shrink-0">Şef</span>
                                              )}
                                            </span>
                                          </div>
                                          <div className="leader-dots print-leader-line border-slate-300"></div>
                                          <span 
                                            className="font-bold text-slate-900 print-text-dark shrink-0" 
                                            style={{ fontSize }}
                                          >
                                            {formatPrice(item.price, settings.currency)}
                                          </span>
                                        </div>
                                        {showIngredients && item.ingredients && (
                                          <p className="text-xs text-gray-500 italic pl-1 print-text-muted leading-relaxed max-w-2xl">
                                            {item.ingredients}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      // Digər standart vərəqlər üçün mövcud düzən
                      <>
                        {/* RESTORAN HEADER (Hər vərəqin və ya seçilmiş kateqoriyanın başında) */}
                        {(sheetIdx === 0 || selectedCategory !== "all") && (
                          <div className="text-center pb-6 border-b-2 print-border-gold border-amber-600/30 max-w-xl mx-auto space-y-2 mb-8">
                            <div className="flex justify-center text-amber-600">
                              <Icons.UtensilsCrossed className="w-8 h-8" />
                            </div>
                            <h2 className="font-playfair text-3xl font-extrabold tracking-wide print-text-dark text-slate-900 uppercase">
                              {settings.restaurantName}
                            </h2>
                            {settings.restaurantSubtitle && (
                              <p className="text-xs uppercase tracking-[0.25em] text-amber-700 font-extrabold print-text-muted">
                                {settings.restaurantSubtitle}
                              </p>
                            )}
                            
                            {showContactInfo && (
                              <div className="pt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-gray-500 font-medium print-text-muted">
                                {settings.contact?.phone && (
                                  <span className="flex items-center gap-1">
                                    <Icons.Phone className="w-3 h-3 text-amber-600" />
                                    <span>{settings.contact.phone}</span>
                                  </span>
                                )}
                                {settings.contact?.address && (
                                  <span className="flex items-center gap-1">
                                    <Icons.MapPin className="w-3 h-3 text-amber-600" />
                                    <span>{settings.contact.address}</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {sheet.categories.map((cat, catIdx) => {
                          const categoryItems = getCategoryItems(cat.id);
                          if (categoryItems.length === 0) return null;

                          return (
                            <div key={cat.id} className={catIdx > 0 ? "mt-10 pt-6 border-t border-dashed border-amber-600/30" : ""}>
                              {/* KATEQORİYA ADI */}
                              <div className="text-center my-6">
                                <h3 className="font-playfair text-xl md:text-2xl font-bold tracking-[0.1em] text-amber-800 uppercase inline-block border-b border-amber-600 pb-1.5 px-4 mb-2 print-text-dark">
                                  {cat.name}
                                </h3>
                              </div>

                              {/* YEMƏKLƏR SİYAHISI */}
                              <div className="mt-8">
                                <div className="space-y-6">
                                  {categoryItems.map(item => (
                                    <div key={item.id} className="print-item-card space-y-1">
                                      <div className="flex items-baseline justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                          {showImages && item.image && (
                                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200/80 shrink-0 bg-slate-100">
                                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                          )}
                                          <span 
                                            className="font-playfair font-bold text-slate-900 print-text-dark leading-tight" 
                                            style={{ fontSize }}
                                          >
                                            {item.name}
                                            {item.isChefSpecial && (
                                              <span className="ml-2 text-[8px] tracking-wider font-extrabold uppercase px-1.5 py-0.5 bg-amber-600 text-white rounded shrink-0">Şef</span>
                                            )}
                                          </span>
                                        </div>
                                        <div className="leader-dots print-leader-line border-slate-300"></div>
                                        <span 
                                          className="font-bold text-slate-900 print-text-dark shrink-0" 
                                          style={{ fontSize }}
                                        >
                                          {formatPrice(item.price, settings.currency)}
                                        </span>
                                      </div>
                                      {showIngredients && item.ingredients && (
                                        <p className="text-xs text-gray-500 italic pl-1 print-text-muted leading-relaxed max-w-2xl">
                                          {item.ingredients}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
