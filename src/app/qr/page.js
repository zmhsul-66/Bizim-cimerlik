'use client';

import { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import menuData from "../../../public/menuData.json";

export default function QRPage() {
  const [settings, setSettings] = useState({
    restaurantName: menuData.restaurantName,
    restaurantSubtitle: menuData.restaurantSubtitle,
    contact: menuData.contact
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // QR settings
  const [baseUrl, setBaseUrl] = useState("https://bizim-cimerlik.vercel.app");
  const [qrType, setQrType] = useState("tables"); // "single" or "tables"
  const [startTable, setStartTable] = useState(1);
  const [endTable, setEndTable] = useState(10);
  const [customText, setCustomText] = useState("RƏQƏMSAL ONLAYN MENYU");
  const [instructionText, setInstructionText] = useState("Telefonunuzun kamerasını yaxınlaşdıraraq menyumuzu açın");
  const [selectedStyle, setSelectedStyle] = useState("gold"); // "gold", "teal", "minimalist", "wood"
  const [cardsPerPage, setCardsPerPage] = useState("4"); // "1", "2", "4"
  const [showWifi, setShowWifi] = useState(true);
  const [showPhone, setShowPhone] = useState(true);

  useEffect(() => {
    // Check dark mode
    try {
      const savedTheme = localStorage.getItem("deniz_theme");
      setIsDarkMode(savedTheme === "dark");
    } catch (e) {
      console.error(e);
    }

    // Load active settings from API
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings(data.settings);
          }
        }
      } catch (err) {
        console.warn("Sazlamalar API-dən oxunmadı, lokal istifadə olunur:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Set default URL based on current window location if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentHost = window.location.origin;
      if (currentHost && !currentHost.includes("localhost")) {
        setBaseUrl(currentHost);
      }
    }
  }, []);

  // Generate the QR list
  const getQRCards = () => {
    if (qrType === "single") {
      return [
        {
          id: "main-menu",
          title: settings.restaurantName,
          subtitle: settings.restaurantSubtitle,
          label: "BÜTÜN SÜFRƏLƏR ÜÇÜN",
          url: baseUrl,
          isTable: false
        }
      ];
    }

    const cards = [];
    const start = Math.max(1, parseInt(startTable) || 1);
    const end = Math.max(start, parseInt(endTable) || 1);

    for (let i = start; i <= end; i++) {
      cards.push({
        id: `table-${i}`,
        title: settings.restaurantName,
        subtitle: settings.restaurantSubtitle,
        label: `MASA ${i}`,
        url: `${baseUrl}?table=${i}`,
        isTable: true,
        tableNum: i
      });
    }
    return cards;
  };

  const handlePrint = () => {
    window.print();
  };

  // Get style wrapper class for cards
  const getCardStyleClass = () => {
    switch (selectedStyle) {
      case "gold":
        return "border-4 double border-amber-600 bg-amber-50/10 dark:bg-slate-900/10";
      case "teal":
        return "border-4 double border-teal-600 bg-teal-50/10 dark:bg-slate-900/10";
      case "wood":
        return "border-4 border-amber-800 bg-orange-50/10 dark:bg-slate-950/10 shadow-inner";
      case "minimalist":
      default:
        return "border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900";
    }
  };

  const getBorderColorClass = () => {
    switch (selectedStyle) {
      case "gold": return "border-amber-600";
      case "teal": return "border-teal-600";
      case "wood": return "border-amber-800";
      case "minimalist":
      default:
        return "border-slate-300";
    }
  };

  const getTextColorClass = () => {
    switch (selectedStyle) {
      case "gold": return "text-amber-800 dark:text-amber-400";
      case "teal": return "text-teal-800 dark:text-teal-400";
      case "wood": return "text-amber-900 dark:text-amber-500";
      case "minimalist":
      default:
        return "text-slate-900 dark:text-white";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#06152d] flex flex-col items-center justify-center space-y-4">
        <Icons.Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
        <p className="text-xs font-bold tracking-widest uppercase text-sky-200">QR generator yüklənir...</p>
      </div>
    );
  }

  const qrCards = getQRCards();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#06152d] text-slate-800 dark:text-white pb-16 transition-colors duration-300">
      
      {/* PRINT-SPECIFIC CSS */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 1cm !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            box-shadow: none !important;
          }
          .print-grid {
            display: grid !important;
            gap: 1.5cm !important;
            background: white !important;
          }
          .print-grid-4 {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .print-grid-2 {
            grid-template-columns: 1fr !important;
            gap: 2cm !important;
          }
          .print-grid-1 {
            grid-template-columns: 1fr !important;
          }
          .print-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-shadow: none !important;
            border-color: #000000 !important;
            background: white !important;
            color: black !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 auto !important;
          }
          .print-card-1 {
            max-width: 16cm !important;
            padding: 2.5cm 2cm !important;
          }
          .print-card-2 {
            max-width: 14cm !important;
            padding: 2cm 1.5cm !important;
          }
          .print-card-4 {
            max-width: 100% !important;
            padding: 1.2cm 0.8cm !important;
          }
          .print-text {
            color: #111827 !important;
          }
          .print-text-gold {
            color: #b45309 !important;
          }
          .print-text-teal {
            color: #0f766e !important;
          }
        }

        /* Responsive preview layout */
        .preview-grid-4 {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        .preview-grid-2 {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 24px;
        }
        .preview-grid-1 {
          display: grid;
          grid-template-columns: 1fr;
          max-width: 500px;
          margin: 0 auto;
          gap: 24px;
        }
        
        .double {
          border-style: double;
        }
      `}</style>

      {/* HEADER CONTROL BAR */}
      <div className="no-print bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.history.back()} 
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
              title="Geri"
            >
              <Icons.ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-playfair text-lg font-bold text-teal-400 flex items-center gap-1.5">
                <Icons.QrCode className="w-5 h-5 text-orange-500 animate-pulse" />
                <span>QR Kod Generatoru</span>
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Masa menyu QR kartlarının hazırlanması</p>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-teal-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Icons.Printer className="w-4.5 h-4.5" />
            <span>QR Kartları Çap Et</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: SETTINGS */}
        <div className="no-print lg:col-span-4 bg-white dark:bg-[#0c2447]/60 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm space-y-6 self-start text-sm">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Icons.Sliders className="w-4.5 h-4.5 text-orange-500" />
              <span>QR Tənzimləmələri</span>
            </h2>
            <p className="text-xs text-slate-400 dark:text-sky-200/50 mt-0.5">Masa QR kartlarının məlumatlarını və görünüşünü fərdiləşdirin.</p>
          </div>

          <div className="space-y-4">
            
            {/* Menu Base URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-sky-200 flex items-center gap-1">
                <Icons.Globe className="w-3.5 h-3.5 text-teal-500" />
                <span>Menyu URL-i</span>
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://bizim-cimerlik.vercel.app"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-sky-400/25 bg-slate-50 dark:bg-[#0a1b35] text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            {/* QR Type Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-sky-200">QR Növü</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setQrType("single")}
                  className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                    qrType === "single"
                      ? "bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400"
                      : "border-slate-200 dark:border-sky-400/15 text-slate-600 dark:text-sky-200 bg-transparent"
                  }`}
                >
                  Tək QR (Ümumi Menyu)
                </button>
                <button
                  onClick={() => setQrType("tables")}
                  className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                    qrType === "tables"
                      ? "bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400"
                      : "border-slate-200 dark:border-sky-400/15 text-slate-600 dark:text-sky-200 bg-transparent"
                  }`}
                >
                  Masa QR (Hər masaya özəl)
                </button>
              </div>
            </div>

            {/* Table range input */}
            {qrType === "tables" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-sky-200">Başlanğıc Masa</label>
                  <input
                    type="number"
                    min="1"
                    value={startTable}
                    onChange={(e) => setStartTable(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-sky-400/25 bg-slate-50 dark:bg-[#0a1b35] text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20 text-center font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-sky-200">Sonuncu Masa</label>
                  <input
                    type="number"
                    min="1"
                    value={endTable}
                    onChange={(e) => setEndTable(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-sky-400/25 bg-slate-50 dark:bg-[#0a1b35] text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20 text-center font-bold"
                  />
                </div>
              </div>
            )}

            <hr className="border-slate-100 dark:border-white/10" />

            {/* Customize texts */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-sky-200">Başlıq mətni</label>
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-sky-400/25 bg-slate-50 dark:bg-[#0a1b35] text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-sky-200">Təlimat mətni</label>
              <textarea
                rows="2"
                value={instructionText}
                onChange={(e) => setInstructionText(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-sky-400/25 bg-slate-50 dark:bg-[#0a1b35] text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20 text-xs"
              />
            </div>

            {/* Design styles */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-sky-200 flex items-center gap-1">
                <Icons.Palette className="w-3.5 h-3.5 text-teal-500" />
                <span>Çərçivə mövzusu</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Qızılı Çərçivə", val: "gold" },
                  { label: "Firuzəyi (Teal)", val: "teal" },
                  { label: "Premium Taxta", val: "wood" },
                  { label: "Minimalist", val: "minimalist" }
                ].map(style => (
                  <button
                    key={style.val}
                    onClick={() => setSelectedStyle(style.val)}
                    className={`py-2 px-1 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                      selectedStyle === style.val
                        ? "bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400"
                        : "border-slate-200 dark:border-sky-400/15 text-slate-600 dark:text-sky-200 bg-transparent"
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout options */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-sky-200 flex items-center gap-1">
                <Icons.LayoutGrid className="w-3.5 h-3.5 text-teal-500" />
                <span>Vərəqdə kart sayı</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "1 ədəd (Geniş)", val: "1" },
                  { label: "2 ədəd (Orta)", val: "2" },
                  { label: "4 ədəd (2x2)", val: "4" }
                ].map(layout => (
                  <button
                    key={layout.val}
                    onClick={() => setCardsPerPage(layout.val)}
                    className={`py-2 px-1 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                      cardsPerPage === layout.val
                        ? "bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400"
                        : "border-slate-200 dark:border-sky-400/15 text-slate-600 dark:text-sky-200 bg-transparent"
                    }`}
                  >
                    {layout.label}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-slate-100 dark:border-white/10" />

            {/* Additional parameters */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showWifi}
                  onChange={(e) => setShowWifi(e.target.checked)}
                  className="rounded border-slate-300 text-teal-500 focus:ring-teal-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-sky-100">Wi-Fi məlumatlarını göstər</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPhone}
                  onChange={(e) => setShowPhone(e.target.checked)}
                  className="rounded border-slate-300 text-teal-500 focus:ring-teal-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-sky-100">Əlaqə telefonunu göstər</span>
              </label>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: CARDS PREVIEW */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <p className="no-print text-xs text-slate-400 dark:text-sky-200/40 mb-3 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Icons.Maximize2 className="w-3.5 h-3.5" />
            <span>Kağız Görünüşü (A4 Önizləmə)</span>
          </p>

          <div className="print-container w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
            <div className={`print-grid print-grid-${cardsPerPage} ${
              cardsPerPage === "4" ? "preview-grid-4" :
              cardsPerPage === "2" ? "preview-grid-2" : "preview-grid-1"
            }`}>
              
              {qrCards.map((card) => {
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(card.url)}`;
                
                return (
                  <div
                    key={card.id}
                    className={`print-card print-card-${cardsPerPage} rounded-2xl p-6 text-center flex flex-col justify-between items-center relative overflow-hidden transition-all duration-300 border bg-white text-slate-900 shadow-sm ${getCardStyleClass()}`}
                    style={{ minHeight: cardsPerPage === "1" ? "420px" : "320px" }}
                  >
                    {/* Background decorations for specific premium designs */}
                    {selectedStyle === "wood" && (
                      <div className="absolute inset-0 pointer-events-none border-[12px] border-amber-950 opacity-10"></div>
                    )}

                    {/* Card Header */}
                    <div className="space-y-1.5 w-full">
                      <div className="flex justify-center text-teal-600 dark:text-teal-400">
                        <Icons.UtensilsCrossed className={`w-6 h-6 ${
                          selectedStyle === "gold" ? "text-amber-600 print-text-gold" :
                          selectedStyle === "teal" ? "text-teal-600 print-text-teal" :
                          selectedStyle === "wood" ? "text-amber-800" : "text-slate-500"
                        }`} />
                      </div>
                      <h3 className="font-playfair text-xl font-extrabold tracking-wide print-text uppercase">
                        {card.title}
                      </h3>
                      {card.subtitle && (
                        <p className="text-[9px] uppercase tracking-[0.2em] font-extrabold opacity-70 print-text leading-none">
                          {card.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Table label */}
                    <div className="my-3 py-1 px-4 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 inline-block">
                      <span className={`text-xs font-black tracking-widest ${getTextColorClass()}`}>
                        {card.label}
                      </span>
                    </div>

                    {/* QR Code Container */}
                    <div className={`p-3 bg-white border-2 rounded-xl inline-block shadow-sm ${getBorderColorClass()}`}>
                      <img
                        src={qrUrl}
                        alt={`QR Code for ${card.label}`}
                        className="w-32 h-32 md:w-36 md:h-36 object-contain"
                        loading="lazy"
                      />
                    </div>

                    {/* Footer text and instructions */}
                    <div className="w-full space-y-3 mt-3">
                      <div className="space-y-1">
                        <p className={`text-[10px] font-black tracking-wider print-text-dark uppercase ${getTextColorClass()}`}>
                          {customText}
                        </p>
                        <p className="text-[8px] font-semibold text-slate-500 print-text leading-tight max-w-[200px] mx-auto">
                          {instructionText}
                        </p>
                      </div>

                      {/* Optional metadata (Wifi, Contact) */}
                      {(showWifi || (showPhone && settings.contact?.phone)) && (
                        <div className="pt-2.5 border-t border-dashed border-slate-200/80 dark:border-slate-800 w-full flex flex-col gap-1 items-center justify-center text-[8px] font-bold text-slate-500 print-text">
                          
                          {showWifi && settings.contact?.wifi && (
                            <span className="flex items-center gap-1 text-[8px]">
                              <Icons.Wifi className="w-3 h-3 text-slate-400 print-text" />
                              <span>Wi-Fi: <span className="font-mono">{settings.contact.wifi}</span> | Şifrə: <span className="font-mono">{settings.contact.wifiPassword}</span></span>
                            </span>
                          )}

                          {showPhone && settings.contact?.phone && (
                            <span className="flex items-center gap-1 text-[8px]">
                              <Icons.Phone className="w-3 h-3 text-slate-400 print-text" />
                              <span>Əlaqə: {settings.contact.phone.split(/[,;/]+/)[0]?.trim()}</span>
                            </span>
                          )}

                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
