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
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.15); // Default 15% opacity

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

  const getCategoryItems = (catId) => {
    return items.filter(item => item.categoryId === catId);
  };

  // Çap dialoqunu açır
  const handlePrint = () => {
    window.print();
  };

  // İkonu render etmək
  const renderIcon = (iconName, className = "w-5 h-5") => {
    const IconComponent = Icons[iconName];
    if (!IconComponent) return <Icons.HelpCircle className={className} />;
    return <IconComponent className={className} />;
  };

  const getCategoryWatermark = (catId) => {
    switch (catId) {
      case 'alkoqolsuzikilr-1595':
      case 'drinks':
        return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=1000&auto=format&fit=crop&q=40'; // Təzə soyuq içki/limonad
      case 'alkoqolluikilr-0561':
        return 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1000&auto=format&fit=crop&q=40'; // Premium şərab qədəhləri
      case 'rzlr-6753':
      case 'desserts':
        return 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=1000&auto=format&fit=crop&q=40'; // Zəngin çərəz assortisi
      case 'kabablar-3265':
      case 'grill':
        return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1000&auto=format&fit=crop&q=40'; // Köz üstündə kabab şişləri
      case 'tavayemklri-1427':
      case 'mains':
        return 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1000&auto=format&fit=crop&q=40'; // İsti tava yeməkləri / Tabaka
      case 'sac-3032':
        return 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=1000&auto=format&fit=crop&q=40'; // Sac üzərində qızmar təamlar
      case 'qazanyemklri-3951':
        return 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=1000&auto=format&fit=crop&q=40'; // Ənənəvi qazan yeməyi / Dolma
      case 'suplar-2026':
      case 'soups':
        return 'https://images.unsplash.com/photo-1547592165-e1d17fed6006?w=1000&auto=format&fit=crop&q=40'; // İsti buxarlanan şorba piyaləsi
      case 'starters':
        return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1000&auto=format&fit=crop&q=40'; // Soyuq qəlyanaltılar / Təzə salat
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
            size: A4;
            margin: ${marginSize} !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-page-container {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
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
          padding: ${marginSize};
          margin: 0 auto;
          position: relative;
          border-radius: 8px;
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
              onClick={handlePrint}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
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
                    max="0.30"
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

          <div className="print-page-container w-full space-y-8">
            {getFilteredCategories().map((cat, catIdx) => {
              const categoryItems = getCategoryItems(cat.id);
              if (categoryItems.length === 0) return null;

              // Birinci kateqoriyadan sonrakılar üçün və əgər 'all' seçilibsə, çapda səhifə qırılması (page break) veririk
              const isPageBreak = selectedCategory === "all" && catIdx > 0;

              return (
                <div 
                  key={cat.id} 
                  className={`preview-sheet overflow-hidden ${isPageBreak ? "page-break-before" : ""}`}
                >
                  {showWatermark && (
                    <img 
                      src={getCategoryWatermark(cat.id)} 
                      alt="" 
                      className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none z-0 mix-blend-multiply" 
                      style={{ opacity: watermarkOpacity }}
                    />
                  )}
                  <div className={`relative z-10 ${
                    theme === "gold" ? "gold-double-border" : 
                    theme === "classic" ? "classic-border" : ""
                  }`}>
                    {/* RESTORAN HEADER (Hər vərəqin və ya seçilmiş kateqoriyanın başında) */}
                    {(catIdx === 0 || selectedCategory !== "all") && (
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

                    {/* KATEQORİYA ADI */}
                    <div className="text-center my-6">
                      <h3 className="font-playfair text-xl md:text-2xl font-bold tracking-[0.1em] text-amber-800 uppercase inline-block border-b border-amber-600 pb-1.5 px-4 mb-2 print-text-dark">
                        {cat.name}
                      </h3>
                      {cat.description && (
                        <p className="text-[11px] text-gray-500 italic max-w-md mx-auto print-text-muted">
                          {cat.description}
                        </p>
                      )}
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
                                {Number(item.price).toFixed(2)} {settings.currency}
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
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
