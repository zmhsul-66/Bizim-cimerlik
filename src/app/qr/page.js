'use client';

import { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import menuData from "../../../public/menuData.json";

export default function BulkQRPage() {
  const [settings, setSettings] = useState({
    restaurantName: menuData.restaurantName
  });
  const [footerText, setFooterText] = useState("RƏQƏMSAL MENYU"); // label under QR
  const [stickerSize, setStickerSize] = useState("4x4"); // "4x4", "5x5", "6x6"
  const [baseUrl, setBaseUrl] = useState("https://bizim-cimerlik.vercel.app");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Load restaurant name
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
        console.warn("API settings error, fallback used:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();

    // Auto-detect base URL
    if (typeof window !== "undefined") {
      const currentHost = window.location.origin;
      if (currentHost && !currentHost.includes("localhost")) {
        setBaseUrl(currentHost);
      }
    }
  }, []);

  // Determine configuration based on selected size
  const getSizeConfig = () => {
    switch (stickerSize) {
      case "5x5":
        return {
          perPage: 15,
          columns: 3,
          width: "50mm",
          height: "50mm",
          qrSize: "40mm",
          gap: "6mm",
          label: "5x5 sm (A4-də 15 ədəd)"
        };
      case "6x6":
        return {
          perPage: 12,
          columns: 3,
          width: "60mm",
          height: "60mm",
          qrSize: "48mm",
          gap: "5mm",
          label: "6x6 sm (A4-də 12 ədəd)"
        };
      case "4x4":
      default:
        return {
          perPage: 24,
          columns: 4,
          width: "40mm",
          height: "40mm",
          qrSize: "32mm",
          gap: "6mm",
          label: "4x4 sm (A4-də 24 ədəd)"
        };
    }
  };

  const config = getSizeConfig();

  // Create exactly one A4 sheet filled with QR codes
  const getPages = () => {
    const items = [];
    const count = config.perPage;
    for (let i = 0; i < count; i++) {
      items.push({
        id: `single-${i}`,
        label: footerText,
        url: baseUrl
      });
    }

    const pages = [];
    for (let i = 0; i < items.length; i += config.perPage) {
      pages.push(items.slice(i, i + config.perPage));
    }
    return pages;
  };

  const pages = getPages();

  const handlePrint = () => {
    window.print();
  };

  const handleSavePDF = async () => {
    setIsGenerating(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const container = document.getElementById("print-content");
      if (!container) return;

      container.classList.add("generating-pdf");

      const sheets = container.querySelectorAll(".print-page");
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

      pdf.save(`bizim_cimerlik_qr_kodlar_${stickerSize}.pdf`);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center space-y-4">
        <Icons.Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
        <p className="text-xs font-bold tracking-widest uppercase text-slate-300">Toplu Çap Paneli Yüklənir...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-12 transition-colors duration-300">
      
      {/* PRINT-ONLY AND PREVIEW STYLES */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          
          /* Hide non-print elements */
          .no-print {
            display: none !important;
          }

          /* Reset html, body, and all direct containers to take full screen without any spacing */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            width: 210mm !important;
            height: 297mm !important;
            overflow: hidden !important;
          }

          /* Reset all parent div elements to prevent pushing the content */
          div {
            margin: 0 !important;
            padding: 0 !important;
            max-width: none !important;
            box-shadow: none !important;
            border: none !important;
            min-height: 0 !important;
            height: auto !important;
            display: block !important;
          }

          /* Restore flex layout ONLY for the print page container and sticker boxes */
          .print-page {
            display: flex !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
            align-content: center !important;
            width: 210mm !important;
            height: 296mm !important; /* 1mm shorter than 297mm to prevent any overflow page creation */
            background: white !important;
            box-sizing: border-box !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-after: avoid !important;
            break-inside: avoid !important;
          }

          .qr-sticker-box {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            box-sizing: border-box !important;
            background: white !important;
          }
        }

        .print-page {
          width: 210mm;
          height: 297mm;
          margin: 0 auto 15mm auto;
          background: white;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-content: center;
          box-sizing: border-box;
          position: relative;
        }

        /* PDF Generation Styles */
        .generating-pdf {
          background: transparent !important;
          padding: 0 !important;
          margin: 0 !important;
          width: 210mm !important;
        }
        .generating-pdf .print-page {
          box-shadow: none !important;
          border: none !important;
          margin: 0 !important;
          width: 210mm !important;
          height: 297mm !important;
          position: relative !important;
          page-break-after: always !important;
          break-after: page !important;
          display: flex !important;
          flex-wrap: wrap !important;
          justify-content: center !important;
          align-content: center !important;
        }

        .qr-sticker-box {
          border: 1px dashed #d97706; /* Cut lines in Gold/Amber */
          background: white;
          color: black;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
        }
      `}</style>

      {/* TOP CONFIGURATION CONTROL PANEL (NO-PRINT) */}
      <div className="no-print bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.history.back()} 
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
              title="Geri"
            >
              <Icons.ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-playfair text-lg font-bold text-amber-400 flex items-center gap-1.5">
                <Icons.Layers className="w-5 h-5 text-orange-500 animate-pulse" />
                <span>QR Çap Paneli (A4)</span>
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">A4 vərəqi tam dolduracaq şəkildə QR stikerlərin çapı</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            
            {/* Alt mətn */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 font-bold">Alt mətn:</span>
              <input 
                type="text" 
                value={footerText} 
                onChange={(e) => setFooterText(e.target.value)}
                className="w-36 bg-slate-950 border border-slate-700 text-white text-xs font-bold py-1 px-2 rounded outline-none" 
              />
            </div>

            {/* Sticker Size */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 font-bold">Ölçü:</span>
              <select
                value={stickerSize}
                onChange={(e) => setStickerSize(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white text-xs font-bold py-1 px-2 rounded outline-none cursor-pointer"
              >
                <option value="4x4">4x4 sm (A4-də 24 ədəd)</option>
                <option value="5x5">5x5 sm (A4-də 15 ədəd)</option>
                <option value="6x6">6x6 sm (A4-də 12 ədəd)</option>
              </select>
            </div>

            {/* Base URL */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 font-bold">Link:</span>
              <input 
                type="text" 
                value={baseUrl} 
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-48 bg-slate-950 border border-slate-700 text-white text-xs font-medium py-1 px-2 rounded outline-none" 
              />
            </div>

            {/* PDF Button */}
            <button
              onClick={handleSavePDF}
              disabled={isGenerating}
              className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-md active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer ${
                isGenerating 
                  ? "bg-slate-700 shadow-slate-700/20 cursor-not-allowed" 
                  : "bg-sky-600 hover:bg-sky-700 shadow-sky-600/20"
              }`}
            >
              {isGenerating ? (
                <>
                  <Icons.Loader2 className="w-4 h-4 animate-spin" />
                  <span>PDF Hazırlanır...</span>
                </>
              ) : (
                <>
                  <Icons.Download className="w-4 h-4" />
                  <span>PDF Yadda Saxla</span>
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              disabled={isGenerating}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer ml-auto md:ml-0"
            >
              <Icons.Printer className="w-4 h-4" />
              <span>Çap Et (Ctrl + P)</span>
            </button>
          </div>
        </div>
      </div>

      {/* SHEETS CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        <div className="no-print text-center mb-6 text-slate-500 text-xs font-semibold flex items-center justify-center gap-1.5">
          <Icons.Info className="w-4.5 h-4.5 text-amber-500" />
          <span>Aşağıda A4 vərəqi üzrə çap önizləməsi göstərilir. Seçilən ölçüyə görə {config.perPage} ədəd QR kod yerləşdirilib.</span>
        </div>

        <div id="print-content" className="flex flex-col items-center">
          {pages.map((pageItems, pageIdx) => (
            <div key={pageIdx} className="print-page" style={{ gap: config.gap }}>
              
              {pageItems.map((item, itemIdx) => {
                // Using clean 250x250 vector-crisp QR resolution
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(item.url)}`;
                
                return (
                  <div 
                    key={item.id || itemIdx} 
                    className="qr-sticker-box"
                    style={{ 
                      width: config.width, 
                      height: config.height,
                      padding: "1mm"
                    }}
                  >
                    {/* Header: Mini restaurant name */}
                    <span style={{ 
                      fontSize: "6px", 
                      fontWeight: "900", 
                      letterSpacing: "0.05em",
                      fontFamily: "sans-serif",
                      textTransform: "uppercase",
                      color: "#1e293b",
                      marginBottom: "1mm",
                      textAlign: "center"
                    }}>
                      {settings.restaurantName}
                    </span>

                    {/* QR Code */}
                    <img 
                      src={qrUrl} 
                      alt="QR Code" 
                      crossOrigin="anonymous"
                      style={{ 
                        width: config.qrSize, 
                        height: config.qrSize,
                        display: "block"
                      }}
                    />

                    {/* Footer: Label */}
                    <span style={{ 
                      fontSize: "7px", 
                      fontWeight: "900", 
                      fontFamily: "sans-serif",
                      letterSpacing: "0.05em",
                      color: "black",
                      marginTop: "1mm",
                      textAlign: "center",
                      textTransform: "uppercase"
                    }}>
                      {item.label}
                    </span>
                  </div>
                );
              })}

            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
