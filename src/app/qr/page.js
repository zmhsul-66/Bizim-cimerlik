'use client';

import { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import menuData from "../../../public/menuData.json";

export default function BulkQRPage() {
  const [settings, setSettings] = useState({
    restaurantName: menuData.restaurantName
  });
  const [startTable, setStartTable] = useState(1);
  const [endTable, setEndTable] = useState(200);
  const [stickerSize, setStickerSize] = useState("4x4"); // "4x4", "5x5", "6x6"
  const [baseUrl, setBaseUrl] = useState("https://bizim-cimerlik.vercel.app");
  const [isLoading, setIsLoading] = useState(true);

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
        console.warn("API settings error, using fallback:", err);
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
          gap: "8mm",
          label: "5x5 sm (A4-də 15 ədəd)"
        };
      case "6x6":
        return {
          perPage: 12,
          columns: 3,
          width: "60mm",
          height: "60mm",
          qrSize: "48mm",
          gap: "8mm",
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

  // Create table range chunks for A4 paging
  const getPages = () => {
    const start = Math.max(1, parseInt(startTable) || 1);
    const end = Math.max(start, parseInt(endTable) || 1);
    const tables = [];
    
    for (let i = start; i <= end; i++) {
      tables.push(i);
    }

    const pages = [];
    for (let i = 0; i < tables.length; i += config.perPage) {
      pages.push(tables.slice(i, i + config.perPage));
    }
    return pages;
  };

  const pages = getPages();

  const handlePrint = () => {
    window.print();
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
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-page {
            width: 210mm !important;
            height: 297mm !important;
            padding: 10mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: always !important;
            break-after: page !important;
            display: flex !important;
            flex-wrap: wrap !important;
            align-content: flex-start !important;
            background: white !important;
            box-sizing: border-box !important;
          }
        }

        .print-page {
          width: 210mm;
          height: 297mm;
          padding: 10mm;
          margin: 0 auto 15mm auto;
          background: white;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
          display: flex;
          flex-wrap: wrap;
          align-content: flex-start;
          box-sizing: border-box;
          position: relative;
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
                <span>Masa QR Toplu Çap Paneli</span>
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Masa etiketlərinin (stikerlərinin) A4-də toplu çapı</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Range */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 font-bold">Masa aralığı:</span>
              <input 
                type="number" 
                min="1" 
                value={startTable} 
                onChange={(e) => setStartTable(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 bg-slate-950 border border-slate-700 text-white text-center text-xs font-bold py-1 rounded" 
              />
              <span className="text-xs text-slate-400">-</span>
              <input 
                type="number" 
                min="1" 
                value={endTable} 
                onChange={(e) => setEndTable(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 bg-slate-950 border border-slate-700 text-white text-center text-xs font-bold py-1 rounded" 
              />
            </div>

            {/* Sticker Size */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 font-bold">Ölçü:</span>
              <select
                value={stickerSize}
                onChange={(e) => setStickerSize(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white text-xs font-bold py-1 px-2 rounded outline-none"
              >
                <option value="4x4">4x4 sm (A4-də 24 ədəd)</option>
                <option value="5x5">5x5 sm (A4-də 15 ədəd)</option>
                <option value="6x6">6x6 sm (A4-də 12 ədəd)</option>
              </select>
            </div>

            {/* URL */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 font-bold">Base URL:</span>
              <input 
                type="text" 
                value={baseUrl} 
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-40 bg-slate-950 border border-slate-700 text-white text-xs font-medium py-1 px-2 rounded" 
              />
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
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
          <span>Aşağıda A4 səhifələri üzrə çap önizləməsi göstərilir. Ümumi {pages.length} vərəq çap olunacaq.</span>
        </div>

        <div className="flex flex-col items-center">
          {pages.map((pageTables, pageIdx) => (
            <div key={pageIdx} className="print-page" style={{ gap: config.gap }}>
              
              {pageTables.map((tableNum) => {
                const url = `${baseUrl}?table=${tableNum}`;
                // Using resolution 200x200 for extremely clean print-ready vector-like QR
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;
                
                return (
                  <div 
                    key={tableNum} 
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
                      alt={`QR Masa ${tableNum}`} 
                      style={{ 
                        width: config.qrSize, 
                        height: config.qrSize,
                        display: "block"
                      }}
                    />

                    {/* Footer: Table label */}
                    <span style={{ 
                      fontSize: "8px", 
                      fontWeight: "900", 
                      fontFamily: "sans-serif",
                      letterSpacing: "0.05em",
                      color: "black",
                      marginTop: "1mm",
                      textAlign: "center"
                    }}>
                      MASA {tableNum}
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
