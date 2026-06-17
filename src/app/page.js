'use client';

import { useState, useEffect, useMemo } from "react";
import * as Icons from "lucide-react";
import menuData from "../../public/menuData.json";

export default function Home() {
  // Vəziyyətlər (States)
  const [items, setItems] = useState(menuData.items); // Standart olaraq sürətli JSON məlumatları yüklənir
  const [settings, setSettings] = useState({
    restaurantName: menuData.restaurantName,
    restaurantSubtitle: menuData.restaurantSubtitle,
    currency: menuData.currency,
    contact: menuData.contact
  }); // Standart olaraq JSON konfiqurasiyası
  const [categories, setCategories] = useState(menuData.categories);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false); // Set Light Mode as default for a bright, cheerful first impression!
  const [showPaymentAlert, setShowPaymentAlert] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [showWifiAlert, setShowWifiAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mövzunu ilkin olaraq sazla (Initialize theme)
  useEffect(() => {
    // Mövzunu yoxla və tətbiq et (Check and apply theme)
    try {
      const savedTheme = localStorage.getItem("deniz_theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

      if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add("dark");
        setIsDarkMode(true);
      } else {
        document.documentElement.classList.remove("dark");
        setIsDarkMode(false);
      }
    } catch (e) {
      console.error("Mövzu yüklənərkən xəta baş verdi:", e);
      // Xəta olarsa standart olaraq parlaq rejim
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    }

    // Ödəniş xəbərdarlığı modalının hər dəfə göstərilməsi
    setShowPaymentAlert(true);

    // Verilənlər bazasından dinamik yeməkləri çəkirik (Live Database Fetch)
    const fetchLiveItems = async () => {
      try {
        const res = await fetch("/api/items");
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            setItems(data.items);
          }
        }
      } catch (err) {
        console.warn("Dinamik yeməklər yüklənmədi, lokal JSON istifadə olunur:", err);
      }
    };

    // Restoran tənzimləmələrini çəkirik (Live Database Settings)
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings(data.settings);
          }
        }
      } catch (err) {
        console.warn("Sazlamalar yüklənmədi, lokal şablon istifadə olunur:", err);
      }
    };

    // Dinamik kateqoriyaları çəkirik (Live Database Categories)
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          if (data.categories && data.categories.length > 0) {
            setCategories(data.categories);
          }
        }
      } catch (err) {
        console.warn("Kateqoriyalar yüklənmədi, lokal şablon istifadə olunur:", err);
      }
    };

    const loadAllData = async () => {
      try {
        await Promise.all([
          fetchLiveItems(),
          fetchSettings(),
          fetchCategories()
        ]);
      } catch (err) {
        console.error("Məlumatlar yüklənərkən xəta:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, []);

  // Mövzu Dəyişdiricisi (Theme Toggler)
  const toggleTheme = () => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.remove("dark");
        setIsDarkMode(false);
        localStorage.setItem("deniz_theme", "light");
      } else {
        document.documentElement.classList.add("dark");
        setIsDarkMode(true);
        localStorage.setItem("deniz_theme", "dark");
      }
    } catch (e) {
      console.error("Mövzu dəyişdirilərkən xəta baş verdi:", e);
      // LocalStorage xətası olsa belə interfeysi dəyişirik
      if (isDarkMode) {
        document.documentElement.classList.remove("dark");
        setIsDarkMode(false);
      } else {
        document.documentElement.classList.add("dark");
        setIsDarkMode(true);
      }
    }
  };

  // Qiymətin formatlanması (çoxlu qiymətlərə sləş və ya defis ilə dəstək)
  const formatPrice = (price, currency, currencyClass = "text-[10px]") => {
    if (price === undefined || price === null) return "";
    const priceStr = String(price).trim();
    if (!isNaN(priceStr) && priceStr !== "") {
      return (
        <>
          {Number(priceStr).toFixed(2)} <span className={`${currencyClass} font-bold opacity-80 ml-0.5`}>{currency}</span>
        </>
      );
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

    return (
      <>
        {formatted} {!hasLetters && <span className={`${currencyClass} font-bold opacity-80 ml-0.5`}>{currency}</span>}
      </>
    );
  };

  // Filterlənmiş menyu elementləri (Filtered menu items)
  const filteredItems = useMemo(() => {
    let filtered = items.filter(item => {
      // Kateqoriya filteri (Category filter)
      const matchesCategory = selectedCategory === "all" ||
        item.categoryId === selectedCategory;

      // Axtarış sorğusu filteri (Search query filter)
      const matchesSearch = searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ingredients.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));

      return matchesCategory && matchesSearch;
    });

    // Əgər "Hamısı" seçilibsə, yeməkləri kateqoriyaların sırasına görə düzək
    if (selectedCategory === "all") {
      const categoryOrder = new Map(categories.map((cat, index) => [
        cat.id, 
        cat.sort_order !== undefined ? cat.sort_order : index
      ]));

      filtered.sort((a, b) => {
        const orderA = categoryOrder.has(a.categoryId) ? categoryOrder.get(a.categoryId) : 999;
        const orderB = categoryOrder.has(b.categoryId) ? categoryOrder.get(b.categoryId) : 999;
        return orderA - orderB;
      });
    }

    return filtered;
  }, [items, selectedCategory, searchQuery, categories]);

  // Dinamik Lucide İkonlarının Render Edilməsi (Dynamic Lucide Icon Renderer)
  const renderIcon = (iconName, className = "w-5 h-5") => {
    const IconComponent = Icons[iconName];
    if (!IconComponent) return <Icons.HelpCircle className={className} />;
    return <IconComponent className={className} />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50/60 via-orange-50/40 to-emerald-50/20 dark:from-[#06152d] dark:via-[#0c254e] dark:to-[#081a38] flex flex-col items-center justify-center space-y-4">
        <Icons.Sparkles className="w-12 h-12 text-teal-600 dark:text-orange-500 animate-spin" />
        <p className="text-xs font-bold tracking-widest uppercase text-slate-500 dark:text-sky-200">Menyu yüklənir...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-clip pb-24 transition-colors duration-500 bg-gradient-to-b from-amber-50/60 via-orange-50/40 to-emerald-50/20 dark:from-[#06152d] dark:via-[#0c254e] dark:to-[#081a38] text-slate-800 dark:text-white">

      {/* ARXA FONDAKI DEKORATİV İSTİ İŞIQLAR */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-10]">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-400/10 rounded-full blur-3xl dark:bg-orange-500/5"></div>
        <div className="absolute top-1/4 right-10 w-[400px] h-[400px] bg-teal-400/10 rounded-full blur-3xl dark:bg-teal-500/5"></div>
      </div>

      {/* ÜST GLASS PANELDƏN İBARƏT BAŞLIQ (HEADER) */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-orange-200/20 dark:border-white/10 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="brand-title-premium text-2xl md:text-3xl bg-gradient-to-r from-teal-700 via-orange-600 to-amber-600 bg-clip-text text-transparent flex items-center gap-1.5 cursor-pointer">
              <span>{settings.restaurantName}</span>
              <Icons.Sparkles className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse shrink-0" />
            </h1>
            <p className="text-[8px] md:text-[9px] uppercase tracking-[0.25em] text-slate-500 dark:text-sky-200 font-extrabold mt-0.5 opacity-90">
              {settings.restaurantSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Görünüş Rejimi Dəyişdiricisi (Şəbəkə və ya Siyahı) */}
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="p-2.5 rounded-full hover:bg-orange-100/50 dark:hover:bg-slate-800/50 text-slate-500 dark:text-slate-300 transition-colors"
              title="Görünüşü dəyiş"
            >
              {viewMode === "grid" ? (
                <Icons.List className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              ) : (
                <Icons.Grid className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              )}
            </button>

            {/* Qaranlıq Rejim Dəyişdiricisi */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full hover:bg-orange-100/50 dark:hover:bg-slate-800/50 text-orange-500 dark:text-amber-400 transition-all duration-300"
              title="Mövzunu dəyiş"
            >
              {isDarkMode ? (
                <Icons.Sun className="w-5 h-5 animate-spin-slow" />
              ) : (
                <Icons.Moon className="w-5 h-5 text-teal-800" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* HERO BÖLMƏSİ (GİRİŞ) */}
      <section className="max-w-6xl mx-auto px-4 pt-6 pb-2">
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-orange-200/20 dark:border-white/10 bg-gradient-to-r from-white/95 to-orange-50/60 dark:from-slate-900/80 dark:to-slate-900/40">
          <div className="space-y-2.5 z-10 max-w-2xl">
            <h2 className="text-2xl font-normal tracking-tight md:text-3xl font-playfair bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 bg-clip-text text-transparent dark:from-white dark:to-sky-100">
              Dəniz Qoxulu <span className="serif-italic font-normal text-teal-600 dark:text-teal-400">Möhtəşəm Ləzzətlər</span> 🌊
            </h2>
            <p className="text-xs md:text-sm leading-relaxed text-slate-500 dark:text-sky-200/90 font-light max-w-xl">
              Süfrəmizdəki hər bir təam təmiz Xəzər mehi və usta şeflərimizin sevgisi ilə hazırlanır. Hər bir tikədə zəngin Azərbaycan qonaqpərvərliyini dadın.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {settings.contact?.phone ? (
                settings.contact.phone.split(/[,;/]+/).map((num, idx) => {
                  const cleanedNum = num.trim();
                  if (!cleanedNum) return null;
                  return (
                    <a
                      key={idx}
                      href={`tel:${cleanedNum.replace(/[^+\d]/g, "")}`}
                      className="flex items-center gap-1.5 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                    >
                      <Icons.Phone className="w-4 h-4 text-orange-500" />
                      <span>{cleanedNum}</span>
                    </a>
                  );
                })
              ) : null}
              <button
                onClick={() => setShowWifiAlert(!showWifiAlert)}
                className="flex items-center gap-1.5 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
              >
                <Icons.Wifi className="w-4 h-4 text-orange-500" />
                <span>Wi-Fi Şəbəkəsi</span>
              </button>
            </div>
          </div>

          <div className="absolute right-0 bottom-0 opacity-12 dark:opacity-5 pointer-events-none translate-y-1/6 translate-x-1/6">
            <Icons.UtensilsCrossed className="w-64 h-64 text-orange-500" />
          </div>
        </div>

        {/* Wi-Fi Məlumat Paneli */}
        {showWifiAlert && (
          <div className="mt-3 animate-fade-in glass-card p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-lg">
                <Icons.Wifi className="w-5 h-5" />
              </div>
              <div className="text-xs md:text-sm">
                <p className="font-bold text-orange-700 dark:text-orange-400">Restoran Wi-Fi Qoşulması</p>
                <p className="text-slate-500 dark:text-sky-200 mt-0.5">
                  Ad: <span className="font-mono font-bold text-slate-700 dark:text-sky-100">{settings.contact.wifi}</span> | Şifrə: <span className="font-mono font-bold text-slate-700 dark:text-sky-100">{settings.contact.wifiPassword}</span>
                </p>
              </div>
            </div>
            <button onClick={() => setShowWifiAlert(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <Icons.X className="w-4 h-4" />
            </button>
          </div>
        )}
      </section>

      <section className="max-w-6xl mx-auto px-4 py-4 sticky top-[68px] md:top-[74px] z-30 bg-gradient-to-b from-amber-50/90 via-amber-50/60 to-transparent dark:from-[#06152d]/95 dark:via-[#06152d]/75 dark:to-transparent backdrop-blur-xs">
        <div className="relative max-w-3xl mx-auto">
          <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500 dark:text-slate-400" />
          <input
            type="text"
            placeholder="Yemək, kabab və ya inqrediyent axtarın..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3.5 rounded-xl border border-orange-200/50 dark:border-sky-400/20 bg-white/80 dark:bg-[#0c2447]/90 backdrop-blur-md outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 dark:focus:ring-teal-500/20 dark:focus:border-teal-400 transition-all font-medium placeholder-slate-400 text-slate-800 dark:text-white shadow-sm"
            suppressHydrationWarning
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-full"
            >
              <Icons.X className="w-4 h-4" />
            </button>
          )}
        </div>
      </section>

      {/* KATEQORİYA DÜYMƏLƏRİ (ÜFÜQİ SÜRÜŞDÜRÜCÜ) */}
      <section className="max-w-6xl mx-auto px-4 py-2">
        <div className="relative max-w-3xl mx-auto overflow-hidden rounded-full">
          {/* Sol və sağ gradient overlay-ləri - Mobil sensorlar üçün kliklənməyə mane olmayan pointer-events-none */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-amber-50 to-transparent dark:from-[#06152d] pointer-events-none z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-amber-50 to-transparent dark:from-[#06152d] pointer-events-none z-10"></div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-4 scroll-smooth">

            {/* "Hamısı" düyməsi */}
            <button
              onClick={() => setSelectedCategory("all")}
              className={`flex items-center gap-1.5 px-5 py-3 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-300 shadow-xs cursor-pointer ${selectedCategory === "all"
                ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/20 scale-105"
                : "bg-white/90 dark:bg-[#0c2447]/90 text-slate-600 dark:text-sky-100 border border-slate-200/60 dark:border-sky-400/20 hover:bg-orange-50 dark:hover:bg-[#12315c]/90"
                }`}
            >
              <Icons.LayoutGrid className="w-4 h-4 shrink-0" />
              <span>Hamısı</span>
            </button>


            {/* Dinamik kateqoriya düymələri */}
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-5 py-3 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-300 shadow-xs cursor-pointer ${selectedCategory === cat.id
                  ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/20 scale-105"
                  : "bg-white/90 dark:bg-[#0c2447]/90 text-slate-600 dark:text-sky-100 border border-slate-200/60 dark:border-sky-400/20 hover:bg-orange-50 dark:hover:bg-[#12315c]/90"
                  }`}
              >
                {renderIcon(cat.icon, "w-4 h-4 shrink-0")}
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-6">

        {filteredItems.length === 0 ? (
          /* Boş Siyahı Paneli */
          <div className="glass-card py-16 px-6 text-center rounded-2xl border border-orange-200/20 flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-slate-800 flex items-center justify-center text-orange-500 dark:text-slate-400">
              <Icons.Inbox className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Heç bir təam tapılmadı</h3>
              <p className="text-xs text-slate-500 dark:text-sky-200 mt-1 max-w-xs leading-relaxed">
                Daxil etdiyiniz axtarışa uyğun heç bir məhsul tapılmadı. Zəhmət olmasa digər açar sözləri sınayın.
              </p>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
              >
                Axtarışı təmizlə
              </button>
            )}
          </div>
        ) : (
          /* Məhsulların Konteyneri */
          <div>
            {/* Kateqoriya başlığı və məlumatları */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-sm md:text-base font-bold tracking-[0.15em] uppercase text-teal-700 dark:text-teal-400 font-playfair border-b-2 border-orange-400 pb-1 inline-block">
                  {selectedCategory === "all" ? "Bütün Menyu" :
                    categories.find(c => c.id === selectedCategory)?.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                  {filteredItems.length} məhsul təqdim olunur
                </p>
              </div>
            </div>

            {viewMode === "grid" ? (
              /* ŞƏBƏKƏ GÖRÜNÜŞÜ REJİMİ: Mobildə 1 sütun, plansetdə 2 sütun, masaüstündə 3 sütun! */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    style={{ animationDelay: `${idx * 40}ms` }}
                    className="animate-fade-in glass-card rounded-2xl overflow-hidden flex flex-col group cursor-pointer border border-slate-200/50 dark:border-sky-400/25 relative"
                  >
                    {/* Kartın Şəkil Başlığı */}
                    <div className="relative h-52 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">

                      {/* Yeməyin şəkli */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="object-cover w-full h-full group-hover:scale-108 transition-all duration-700"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&auto=format&fit=crop&q=80";
                        }}
                      />

                      {/* Etiket nişanları (məs. Premium, Şef seçimi) */}
                      {item.tags && (
                        <div className="absolute left-3 bottom-3 flex flex-wrap gap-1.5">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`tag-badge-premium text-[8px] px-2.5 py-0.5 rounded-full text-white shadow-xs backdrop-blur-md ${tag.toLowerCase().includes("şef") || tag.toLowerCase().includes("chef") || tag.toLowerCase().includes("seçimi")
                                ? "bg-gradient-to-r from-amber-500 to-orange-500 chef-badge"
                                : "bg-teal-600/80"
                                }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Kartın Gövdəsi */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="font-playfair text-lg font-bold text-slate-800 dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors leading-snug">
                            {item.name}
                          </h4>
                          <span className="price-text-premium text-base text-orange-600 dark:text-amber-400 whitespace-nowrap bg-orange-50/70 dark:bg-amber-400/5 px-2.5 py-0.5 rounded-lg border border-orange-200/50 dark:border-amber-400/10 shrink-0">
                            {formatPrice(item.price, settings.currency, "text-[10px]")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-sky-200/95 line-clamp-3 leading-relaxed font-light">
                          {item.ingredients}
                        </p>
                      </div>

                      <div className="pt-2 flex items-center justify-between text-[11px] font-bold text-teal-600 dark:text-teal-400">
                        <span className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-300 flex items-center gap-0.5">
                          Tərkibi və ətraflı <Icons.ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* SİYAHI GÖRÜNÜŞÜ REJİMİ (KOMPAKT VƏ MÜASİR SİYAHI GÖRÜNÜŞÜ) */
              <div className="space-y-3 max-w-3xl mx-auto">
                {filteredItems.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    style={{ animationDelay: `${idx * 20}ms` }}
                    className="animate-fade-in glass-card p-3 rounded-xl flex items-center gap-4 cursor-pointer border border-slate-200/50 dark:border-sky-400/25 group hover:border-orange-500/20"
                  >
                    {/* Kompakt Şəkil */}
                    <div className="relative w-18 h-18 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-all duration-300"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&auto=format&fit=crop&q=80";
                        }}
                      />
                    </div>

                    {/* Kompakt Məzmun */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-playfair font-bold text-sm md:text-base text-slate-800 dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors truncate">
                          {item.name}
                        </h4>
                        <span className="price-text-premium text-sm md:text-base text-orange-600 dark:text-amber-400 whitespace-nowrap shrink-0">
                          {formatPrice(item.price, settings.currency, "text-[10px]")}
                        </span>
                      </div>
                      <p className="text-[11px] md:text-xs text-slate-500 dark:text-sky-200/90 truncate mt-0.5 leading-relaxed font-light">
                        {item.ingredients}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1.5">
                        {item.tags && item.tags.slice(0, 1).map(tag => (
                          <span key={tag} className="tag-badge-premium text-[7px] px-2 py-0.5 bg-orange-500/10 text-orange-600 dark:bg-amber-400/10 dark:text-amber-400 border border-orange-500/10 dark:border-amber-400/10 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* İNTERAKTİV ƏTRAFLI MƏLUMAT MODAL PƏNCƏRƏSİ */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="w-full sm:max-w-lg glass-panel rounded-t-3xl sm:rounded-2xl border-t sm:border border-white/20 dark:border-sky-400/25 overflow-hidden flex flex-col shadow-2xl animate-fade-in max-h-[92vh] sm:max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Şəkil Başlığı */}
            <div className="relative h-72 w-full bg-slate-100 dark:bg-slate-800 shrink-0">
              <img
                src={selectedItem.image}
                alt={selectedItem.name}
                className="object-cover w-full h-full"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&auto=format&fit=crop&q=80";
                }}
              />

              {/* Bağla Düyməsi */}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute right-4 top-4 p-2 rounded-full glass-panel hover:bg-slate-900/60 transition-colors text-white"
              >
                <Icons.X className="w-5 h-5" />
              </button>

            </div>

            {/* Modal Gövdəsinin Məzmunu */}
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-playfair text-2xl font-bold text-slate-900 dark:text-white leading-tight">{selectedItem.name}</h3>
                  <span className="price-text-premium text-xl text-orange-600 dark:text-amber-400 bg-orange-50/70 dark:bg-amber-400/5 px-3.5 py-1 rounded-xl border border-orange-200/50 dark:border-amber-400/10 shrink-0">
                    {formatPrice(selectedItem.price, settings.currency, "text-xs")}
                  </span>
                </div>

                {/* Modaldakı etiketlər */}
                {selectedItem.tags && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedItem.tags.map((tag) => (
                      <span
                        key={tag}
                        className="tag-badge-premium text-[8px] px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:bg-amber-400/10 dark:text-amber-400 border border-orange-500/10 dark:border-amber-400/10"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Tərkib və Ətraflı Məlumatlar */}
              <div className="space-y-3.5 border-t border-slate-200/60 dark:border-slate-800 pt-5">
                <h4 className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400 dark:text-sky-300 flex items-center gap-1.5">
                  <Icons.Info className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Yeməyin Tərkibi və Hazırlanması</span>
                </h4>
                <p className="text-sm md:text-base leading-relaxed text-slate-600 dark:text-sky-100 font-light">
                  {selectedItem.ingredients}
                </p>
              </div>

              {/* Hərəkət Düymələri */}
              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-teal-500/20 active:scale-98 cursor-pointer"
                >
                  Menyuya Qayıt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ÖDƏNİŞ XƏBƏRDARLIĞI MODALI */}
      {showPaymentAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md glass-panel rounded-2xl border border-red-500/20 dark:border-red-500/30 overflow-hidden flex flex-col shadow-2xl p-6 space-y-6 relative animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 animate-pulse">
                <Icons.AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-playfair text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Diqqət!</h3>
                <p className="text-sm md:text-base leading-relaxed text-slate-700 dark:text-sky-100 font-medium">
                  Ödəniş etdikdən sonra qəbzinizi almağı unutmayın. Qəbzsiz ödənişlərlə bağlı yaranan problemlərə görə məsuliyyət daşımırıq.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPaymentAlert(false)}
              className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-red-500/20 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Icons.CheckCircle2 className="w-4 h-4" />
              <span>Anladım</span>
            </button>
          </div>
        </div>
      )}

      {/* ALT HİSSƏ (FOOTER) METADATALARI */}
      <footer className="mt-16 border-t border-orange-200/20 dark:border-white/10 py-10 text-center text-xs text-slate-400 dark:text-slate-500 space-y-3">
        <p className="font-playfair text-sm font-semibold text-slate-700 dark:text-slate-300">
          {settings.restaurantName} — <span className="serif-italic text-teal-700 dark:text-teal-400 font-normal">Hər anı ləzzət</span> 🍽️
        </p>
        <p className="max-w-xs mx-auto px-4 leading-relaxed text-slate-500 font-light">
          {settings.contact.address}
        </p>
        <p className="font-light">© 2026 {settings.restaurantName}. Bütün hüquqlar qorunur.</p>
      </footer>
    </div>
  );
}
