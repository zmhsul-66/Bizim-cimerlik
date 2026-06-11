'use client';

import { useState, useEffect, useRef } from "react";
import * as Icons from "lucide-react";
import menuData from "../../../public/menuData.json";

export default function AdminPanel() {
  // Giriş Vəziyyətləri (Auth States)
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Menyu Məlumatları (Data States)
  const [items, setItems] = useState([]);
  const [isDatabase, setIsDatabase] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Restoran Sazlamaları (Restaurant Settings States)
  const [settingsName, setSettingsName] = useState("Bizim çimərlik");
  const [settingsSubtitle, setSettingsSubtitle] = useState("Restaurant & Lounge");
  const [settingsPhone, setSettingsPhone] = useState("");
  const [settingsAddress, setSettingsAddress] = useState("");
  const [settingsWifi, setSettingsWifi] = useState("");
  const [settingsWifiPassword, setSettingsWifiPassword] = useState("");
  const [settingsCurrency, setSettingsCurrency] = useState("₼");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Aktiv Tab (Active Tab): "items", "settings" və ya "categories"
  const [activeTab, setActiveTab] = useState("items");

  // Kateqoriyalar Vəziyyəti (Category States)
  const [categories, setCategories] = useState(menuData.categories);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [catFormName, setCatFormName] = useState("");
  const [catFormIcon, setCatFormIcon] = useState("Utensils");
  const [catFormDescription, setCatFormDescription] = useState("");
  const [catFormWatermark, setCatFormWatermark] = useState("");
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isUploadingWatermark, setIsUploadingWatermark] = useState(false);
  const watermarkFileInputRef = useRef(null);

  // Modallar və Forma Vəziyyətləri (CRUD Modals)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Forma sahələri (Form Fields)
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formIngredients, setFormIngredients] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formChefSpecial, setFormChefSpecial] = useState(false);

  // Şəkil yükləmə vəziyyəti (Image Upload States)
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Bildirişlər (Notification Toast)
  const [toast, setToast] = useState(null);

  // QR modal states
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrLinkType, setQrLinkType] = useState("menu");

  // Mövzunu yoxla və tətbiq et (Initialize theme)
  useEffect(() => {
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
      console.error(e);
    }

    // LocalStorage-dən şifrəni yoxlayıb daxil olmaq
    const savedPassword = localStorage.getItem("deniz_admin_pass");
    if (savedPassword) {
      setPassword(savedPassword);
      testAuth(savedPassword);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Mövzu Dəyişdiricisi (Theme Toggler)
  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
      localStorage.setItem("deniz_theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
      localStorage.setItem("deniz_theme", "dark");
    }
  };

  // Toast bildiriş funksiyası
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Şifrə ilə qoşulmanı yoxlamaq
  const testAuth = async (passToTest) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/items", {
        headers: { "x-admin-password": passToTest }
      });
      
      if (res.status === 401) {
        setLoginError("Daxil etdiyiniz şifrə yanlışdır!");
        setIsLoggedIn(false);
        localStorage.removeItem("deniz_admin_pass");
      } else {
        const data = await res.json();
        setIsLoggedIn(true);
        setItems(data.items || []);
        setIsDatabase(data.isDatabase);
        localStorage.setItem("deniz_admin_pass", passToTest);
        
        // Giriş uğurludursa sazlamaları da çəkirik
        await loadSettings(passToTest);
        await loadCategories(passToTest);
      }
    } catch (e) {
      console.error(e);
      setErrorMessage("Qoşulma zamanı xəta baş verdi.");
    } finally {
      setIsLoading(false);
    }
  };

  // Sazlamaları verilənlər bazasından və ya lokal JSON-dan çəkir
  const loadSettings = async (pass = password) => {
    try {
      const res = await fetch("/api/settings", {
        headers: { "x-admin-password": pass }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettingsName(data.settings.restaurantName || "Bizim çimərlik");
          setSettingsSubtitle(data.settings.restaurantSubtitle || "Restaurant & Lounge");
          setSettingsCurrency(data.settings.currency || "₼");
          setSettingsPhone(data.settings.contact?.phone || "");
          setSettingsAddress(data.settings.contact?.address || "");
          setSettingsWifi(data.settings.contact?.wifi || "");
          setSettingsWifiPassword(data.settings.contact?.wifiPassword || "");
        }
      }
    } catch (err) {
      console.error("Settings yüklənərkən xəta:", err);
    }
  };

  // Kateqoriyaları verilənlər bazasından və ya lokal JSON-dan çəkir
  const loadCategories = async (pass = password) => {
    try {
      const res = await fetch("/api/categories", {
        headers: { "x-admin-password": pass }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.categories) {
          setCategories(data.categories);
        }
      }
    } catch (err) {
      console.error("Categories yüklənərkən xəta:", err);
    }
  };

  // Yeni kateqoriya əlavə et (Create Category)
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!catFormName.trim()) {
      showToast("Kateqoriya adı boş ola bilməz!", "error");
      return;
    }

    setIsSavingCategory(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password
        },
        body: JSON.stringify({
          name: catFormName,
          icon: catFormIcon,
          description: catFormDescription,
          watermark_url: catFormWatermark
        })
      });

      if (res.ok) {
        showToast("Yeni kateqoriya uğurla əlavə edildi!", "success");
        setIsCategoryModalOpen(false);
        setCatFormName("");
        setCatFormDescription("");
        setCatFormIcon("Utensils");
        setCatFormWatermark("");
        await loadCategories();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Xəta yarandı", "error");
      }
    } catch (err) {
      showToast("Şəbəkə xətası", "error");
    } finally {
      setIsSavingCategory(false);
    }
  };

  // Kateqoriyanı sil (Delete Category)
  const handleDeleteCategory = async (id, name) => {
    if (!confirm(`"${name}" kateqoriyası silinsin? Bu kateqoriyaya aid yeməklər silinməyəcək, lakin kateqoriyasız qala bilərlər.`)) return;

    try {
      const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "x-admin-password": password }
      });

      if (res.ok) {
        showToast("Kateqoriya uğurla silindi!", "success");
        await loadCategories();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Xəta yarandı", "error");
      }
    } catch (err) {
      showToast("Şəbəkə xətası", "error");
    }
  };

  // Kateqoriya arxa fon watermark şəklini yükləmə
  const handleWatermarkUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingWatermark(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "x-admin-password": password
        },
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setCatFormWatermark(data.url);
        showToast("Arxa fon şəkli uğurla yükləndi!", "success");
      } else {
        showToast(data.error || "Şəkil yüklənərkən xəta baş verdi", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Şəbəkə əlaqəsi xətası", "error");
    } finally {
      setIsUploadingWatermark(false);
    }
  };

  // Kateqoriya redaktə modalını aç
  const openEditCategoryModal = (cat) => {
    setSelectedCategory(cat);
    setCatFormName(cat.name || "");
    setCatFormIcon(cat.icon || "Utensils");
    setCatFormDescription(cat.description || "");
    setCatFormWatermark(cat.watermark_url || "");
    setIsEditCategoryModalOpen(true);
  };

  // Kateqoriya redaktə et (Update Category)
  const handleEditCategory = async (e) => {
    e.preventDefault();
    if (!catFormName.trim()) {
      showToast("Kateqoriya adı boş ola bilməz!", "error");
      return;
    }

    setIsSavingCategory(true);
    try {
      const res = await fetch("/api/categories", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password
        },
        body: JSON.stringify({
          id: selectedCategory.id,
          name: catFormName,
          icon: catFormIcon,
          description: catFormDescription,
          watermark_url: catFormWatermark
        })
      });

      if (res.ok) {
        showToast("Kateqoriya uğurla yeniləndi!", "success");
        setIsEditCategoryModalOpen(false);
        setCatFormName("");
        setCatFormDescription("");
        setCatFormIcon("Utensils");
        setCatFormWatermark("");
        setSelectedCategory(null);
        await loadCategories();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Xəta yarandı", "error");
        if (errData.needsWatermarkMigration) {
          alert(`Arxa fon şəklini yadda saxlamaq üçün verilənlər bazasında watermark_url sütunu yaradılmalıdır.\n\nZəhmət olmasa Supabase Dashboard-da SQL Editor bölməsinə daxil olub aşağıdakı kodu 'Run' edin:\n\nALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS watermark_url TEXT;`);
        }
      }
    } catch (err) {
      showToast("Şəbəkə xətası", "error");
    } finally {
      setIsSavingCategory(false);
    }
  };

  // Kateqoriyanı yuxarı və ya aşağı daşımaq (Reorder Category)
  const handleMoveCategory = async (index, direction) => {
    const newCategories = [...categories];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    // Mövqeləri dəyişirik
    const temp = newCategories[index];
    newCategories[index] = newCategories[targetIndex];
    newCategories[targetIndex] = temp;

    // Yeni sıralamanı təyin edirik
    const orders = newCategories.map((cat, idx) => ({
      id: cat.id,
      sort_order: idx
    }));

    // Local state-i dərhal yeniləyirik ki, sürətli olsun (Optimistik yenilənmə)
    setCategories(newCategories);

    try {
      const res = await fetch("/api/categories", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password
        },
        body: JSON.stringify({ orders })
      });

      if (!res.ok) {
        const errData = await res.json();
        showToast(errData.error || "Sıralama yadda saxlanılmadı", "error");
        await loadCategories(); // Geri qaytarırıq

        if (errData.needsMigration) {
          alert(`Sıralamanı idarə edə bilmək üçün verilənlər bazasında sort_order sütunu yaradılmalıdır.\n\nZəhmət olmasa Supabase Dashboard-da SQL Editor bölməsinə daxil olub aşağıdakı kodu 'Run' edin:\n\nALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;`);
        }
      } else {
        showToast("Sıralama uğurla yeniləndi!", "success");
      }
    } catch (err) {
      showToast("Şəbəkə xətası, sıralama yenilənmədi", "error");
      await loadCategories();
    }
  };

  // Login düyməsi sıxıldıqda
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setLoginError("Şifrə boş ola bilməz!");
      return;
    }
    testAuth(password);
  };

  // Menyu siyahısını yeniləyən GET sorğusu
  const refreshItems = async () => {
    try {
      const res = await fetch("/api/items", {
        headers: { "x-admin-password": password }
      });
      const data = await res.json();
      setItems(data.items || []);
      setIsDatabase(data.isDatabase);
    } catch (e) {
      console.error(e);
      showToast("Menyu yüklənərkən xəta yarandı", "error");
    }
  };

  // Məlumatları JSON-dan Baza Köçürmə (Migration)
  const handleMigration = async () => {
    if (!confirm("Bütün mövcud yeməkləri və restoran məlumatlarını Supabase verilənlər bazasına köçürmək istəyirsiniz?")) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/migrate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-password": password 
        }
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, "success");
        await refreshItems();
        await loadSettings();
      } else {
        showToast(data.error || "Köçürmə zamanı xəta baş verdi", "error");
      }
    } catch (e) {
      showToast("Serverlə əlaqə kəsildi", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Restoran Sazlamalarını Yadda Saxlama (Save Settings to DB)
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!settingsName.trim()) {
      showToast("Restoran adı boş ola bilməz!", "error");
      return;
    }

    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password
        },
        body: JSON.stringify({
          restaurantName: settingsName,
          restaurantSubtitle: settingsSubtitle,
          currency: settingsCurrency,
          contact: {
            phone: settingsPhone,
            address: settingsAddress,
            wifi: settingsWifi,
            wifiPassword: settingsWifiPassword
          }
        })
      });

      if (res.ok) {
        showToast("Restoran məlumatları uğurla yadda saxlanıldı!", "success");
        await loadSettings();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Dəyişikliklər qeyd edilmədi", "error");
      }
    } catch (err) {
      showToast("Şəbəkə əlaqəsi xətası", "error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // QR kod və linkləri paylaşma funksiyası
  const handleShareQR = async () => {
    const targetUrl = typeof window !== "undefined"
      ? `${window.location.origin}${qrLinkType === "admin" ? "/admin" : ""}`
      : `https://bizim-cimerlik.vercel.app${qrLinkType === "admin" ? "/admin" : ""}`;
      
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(targetUrl)}`;
    
    const shareTitle = qrLinkType === "admin" ? `${settingsName} - Admin Panel` : `${settingsName} - Rəqəmsal Menyu`;
    const shareText = qrLinkType === "admin"
      ? `Salam! Bizim çimərlik Admin Panel Girişi:\nKeçid linki: ${targetUrl}\nQR Kod şəkli: ${qrImageUrl}`
      : `Salam! Bizim çimərlik Rəqəmsal Onlayn Menyumuz:\nMenyunu açın: ${targetUrl}\nQR Kod şəkli: ${qrImageUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: targetUrl
        });
        showToast("QR Kod uğurla paylaşıldı!", "success");
      } catch (err) {
        console.warn("Paylaşım ləğv edildi:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        showToast("Menyu linki və QR kod linki kopyalandı! İstədiyiniz yerdə (WhatsApp, Telegram, SMS) paylaşa bilərsiniz.", "success");
      } catch (err) {
        showToast("Kopyalama zamanı xəta baş verdis.", "error");
      }
    }
  };

  // Çıxış etmək (Logout)
  const handleLogout = () => {
    setIsLoggedIn(false);
    setPassword("");
    localStorage.removeItem("deniz_admin_pass");
  };

  // Modal üçün formanı sıfırlayır
  const resetForm = () => {
    setFormName("");
    setFormPrice("");
    setFormCategory(categories[0]?.id || "");
    setFormIngredients("");
    setFormImage("");
    setFormTags("");
    setFormChefSpecial(false);
  };

  // Əlavə et Modalını Açır
  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  // Redaktə Modalını Açır
  const openEditModal = (item) => {
    setSelectedItem(item);
    setFormName(item.name);
    setFormPrice(item.price !== null && item.price !== undefined ? item.price.toString() : "");
    const hasCategory = categories.some(c => c.id === item.categoryId);
    setFormCategory(hasCategory ? item.categoryId : (categories[0]?.id || ""));
    setFormIngredients(item.ingredients);
    setFormImage(item.image);
    setFormTags(item.tags ? item.tags.join(", ") : "");
    setFormChefSpecial(!!item.isChefSpecial);
    setIsEditModalOpen(true);
  };

  // Birbaşa Şəkil Yükləmə Funksiyası
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "x-admin-password": password
        },
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setFormImage(data.url);
        showToast("Şəkil uğurla yükləndi!", "success");
      } else {
        showToast(data.error || "Şəkil yüklənərkən xəta baş verdi", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Şəbəkə əlaqəsi xətası", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // 1. Yeni yemək yaratma (Create)
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!formName || !formPrice) {
      showToast("Zəhmət olmasa ulduzlu (*) sahələri doldurun", "error");
      return;
    }

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password
        },
        body: JSON.stringify({
          categoryId: formCategory,
          name: formName,
          price: formPrice.trim(),
          ingredients: formIngredients || "",
          image: formImage,
          tags: formTags.split(",").map(t => t.trim()).filter(t => t !== ""),
          isChefSpecial: formChefSpecial
        })
      });

      if (res.ok) {
        showToast("Yeni yemək menyuya əlavə edildi!", "success");
        setIsAddModalOpen(false);
        refreshItems();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Xəta yarandı", "error");
      }
    } catch (err) {
      showToast("Şəbəkə xətası", "error");
    }
  };

  // 2. Yeməyi Yeniləmə (Update)
  const handleEditItem = async (e) => {
    e.preventDefault();
    if (!formName || !formPrice) {
      showToast("Zəhmət olmasa vacib sahələri doldurun", "error");
      return;
    }

    try {
      const res = await fetch("/api/items", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password
        },
        body: JSON.stringify({
          id: selectedItem.id,
          categoryId: formCategory,
          name: formName,
          price: formPrice.trim(),
          ingredients: formIngredients || "",
          image: formImage,
          tags: formTags.split(",").map(t => t.trim()).filter(t => t !== ""),
          isChefSpecial: formChefSpecial
        })
      });

      if (res.ok) {
        showToast("Yemək uğurla yeniləndi!", "success");
        setIsEditModalOpen(false);
        refreshItems();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Yenilənmə zamanı xəta yarandı", "error");
      }
    } catch (err) {
      showToast("Şəbəkə xətası", "error");
    }
  };

  // 3. Yeməyi Silmə (Delete)
  const handleDeleteItem = async (id, name) => {
    if (!confirm(`"${name}" menyudan silinsin? Bu əməliyyat geri qaytarıla bilməz!`)) return;

    try {
      const res = await fetch(`/api/items?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "x-admin-password": password }
      });

      if (res.ok) {
        showToast("Yemək menyudan silindi!", "success");
        refreshItems();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Silinmə zamanı xəta yarandı", "error");
      }
    } catch (err) {
      showToast("Şəbəkə xətası", "error");
    }
  };

  // Dinamik ikon renderi
  const renderIcon = (iconName, className = "w-5 h-5") => {
    const IconComponent = Icons[iconName];
    if (!IconComponent) return <Icons.HelpCircle className={className} />;
    return <IconComponent className={className} />;
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

  // ----------------------------------------------------
  // GÖZLƏMƏ EKRANI
  // ----------------------------------------------------
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100/50 dark:from-[#06152d] dark:to-[#081a38] text-slate-800 dark:text-white flex flex-col items-center justify-center space-y-4">
        <Icons.Sparkles className="w-12 h-12 text-teal-600 dark:text-orange-500 animate-spin" />
        <p className="text-xs font-bold tracking-widest uppercase text-slate-500 dark:text-sky-200">Admin Panel yüklənir...</p>
      </div>
    );
  }

  // ----------------------------------------------------
  // GİRİŞ EKRANI
  // ----------------------------------------------------
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-slate-50 to-teal-50 dark:from-[#06152d] dark:via-[#0c254e] dark:to-[#081a38] text-slate-800 dark:text-white overflow-hidden transition-colors duration-500">
        <button
          onClick={toggleTheme}
          className="absolute top-5 right-5 p-3 rounded-full bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-md text-slate-600 dark:text-amber-400 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          {isDarkMode ? <Icons.Sun className="w-5 h-5" /> : <Icons.Moon className="w-5 h-5 text-teal-800" />}
        </button>

        <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] bg-orange-400/10 dark:bg-orange-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] bg-teal-400/10 dark:bg-teal-500/5 rounded-full blur-3xl"></div>

        <div className="w-full max-w-md bg-white/90 dark:bg-[#0e2245]/90 border border-slate-200/80 dark:border-white/10 shadow-2xl rounded-3xl p-8 backdrop-blur-xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="brand-title-premium text-3xl bg-gradient-to-r from-teal-700 via-orange-600 to-amber-600 dark:from-teal-400 dark:via-amber-300 dark:to-orange-400 bg-clip-text text-transparent flex items-center justify-center gap-2">
              <span>{settingsName || "Bizim çimərlik"}</span>
              <Icons.Sparkles className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
            </h1>
            <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500 dark:text-sky-200 font-extrabold">Admin İdarəetmə Paneli</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-sky-200 uppercase tracking-wider block">Giriş Şifrəsi</label>
              <div className="relative">
                <Icons.Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-sky-300/60" />
                <input
                  type="password"
                  placeholder="Şifrəni daxil edin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-sky-400/25 bg-slate-50 dark:bg-[#0c2447]/80 backdrop-blur-md outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 dark:focus:ring-orange-500/20 dark:focus:border-orange-500 text-slate-800 dark:text-white transition-all font-medium placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
              {loginError && (
                <p className="text-xs font-semibold text-rose-500 dark:text-rose-400 flex items-center gap-1.5 mt-1.5">
                  <Icons.AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 dark:from-teal-500 dark:to-emerald-600 dark:hover:from-teal-600 dark:hover:to-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-teal-500/10 dark:shadow-teal-500/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <Icons.LogIn className="w-5 h-5" />
              <span>Giriş et</span>
            </button>
          </form>

          <div className="text-center text-[10px] text-slate-400 dark:text-slate-500">
            Bizim çimərlik Onlayn Rəqəmsal Menyu Admin Panel
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // İDARƏETMƏ PANELI (MAIN PANEL)
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 via-slate-50 to-orange-50/20 dark:from-[#06152d] dark:via-[#0c254e] dark:to-[#081a38] text-slate-800 dark:text-white pb-24 relative overflow-x-clip transition-colors duration-500 no-print-admin">
      
      {/* Toast Bildiriş */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in border ${
          toast.type === "error" 
            ? "bg-rose-50 dark:bg-rose-950/95 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200" 
            : "bg-emerald-50 dark:bg-emerald-950/95 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200"
        }`}>
          {toast.type === "error" ? <Icons.XCircle className="w-5 h-5 text-rose-500" /> : <Icons.CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          <span className="text-xs md:text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Üst Naviqasiya Paneli */}
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-[#06152d]/80 border-b border-slate-200/80 dark:border-white/10 backdrop-blur-md shadow-sm transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="brand-title-premium text-xl md:text-2xl bg-gradient-to-r from-teal-700 via-orange-600 to-amber-600 dark:from-teal-400 dark:via-amber-300 dark:to-orange-400 bg-clip-text text-transparent flex items-center gap-1.5">
              <span>{settingsName || "Bizim çimərlik"}</span>
              <span className="text-[9px] bg-teal-600/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">ADMIN</span>
            </h1>
            <p className="text-[8px] uppercase tracking-[0.2em] text-slate-500 dark:text-sky-200 font-extrabold mt-0.5">
              {settingsSubtitle || "Restaurant & Lounge"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-600 dark:text-amber-400 transition-colors cursor-pointer"
              title="Mövzunu dəyiş"
            >
              {isDarkMode ? <Icons.Sun className="w-4.5 h-4.5" /> : <Icons.Moon className="w-4.5 h-4.5 text-teal-800" />}
            </button>

            <button
              onClick={() => window.open("/", "_blank")}
              className="px-3.5 py-2.5 bg-sky-500/10 hover:bg-sky-500/20 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 border border-sky-200 dark:border-sky-500/20 rounded-xl text-xs font-bold transition-all text-sky-700 dark:text-sky-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Icons.ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Menyuya Bax</span>
            </button>

            <button
              onClick={() => window.open("/print", "_blank")}
              className="px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/20 rounded-xl text-xs font-bold transition-all text-amber-700 dark:text-amber-400 flex items-center gap-1.5 cursor-pointer"
            >
              <Icons.Printer className="w-4.5 h-4.5" />
              <span className="hidden sm:inline">Çap Versiyası</span>
            </button>

            <button
              onClick={() => setIsQrModalOpen(true)}
              className="px-3.5 py-2.5 bg-teal-500/10 hover:bg-teal-500/20 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 border border-teal-200 dark:border-teal-500/20 rounded-xl text-xs font-bold transition-all text-teal-700 dark:text-teal-400 flex items-center gap-1.5 cursor-pointer"
            >
              <Icons.QrCode className="w-4.5 h-4.5" />
              <span className="hidden sm:inline">QR Kodlar</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/20 rounded-xl text-xs font-bold transition-all text-rose-700 dark:text-rose-400 flex items-center gap-1.5 cursor-pointer"
            >
              <Icons.LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Çıxış</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        
        {/* BAZA KONFİQURASİYA BANNERİ */}
        {!isDatabase ? (
          <div className="bg-amber-500/5 border-2 border-amber-300 dark:border-amber-500/30 p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-fade-in">
            <div className="space-y-2 z-10 max-w-3xl">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Icons.AlertTriangle className="w-6 h-6 shrink-0 text-amber-500" />
                <h2 className="text-lg font-bold">Verilənlər Bazası Sazlanmayıb!</h2>
              </div>
              <p className="text-xs md:text-sm text-slate-600 dark:text-sky-100/80 leading-relaxed font-medium">
                Tətbiq hazırda **Lokal JSON** rejimində işləyir. Restoran adını və menyunu tam idarə edə bilmək üçün verilənlər bazasını bağlamalısınız. 
                Layihənizin `.env.local` faylına məlumatları yazın və serveri yenidən başladın.
              </p>
            </div>
            <div className="shrink-0 flex gap-2">
              <button 
                onClick={() => alert(`Sazlama Addımları:\n1. Supabase.com-da qeydiyyatdan keçin və layihə yaradın.\n2. schema.sql faylındakı kodları Supabase SQL Editor bölməsinə yapışdırıb işə salın.\n3. .env.local faylındakı URL və Anon Key sahələrini doldurun.\n4. Serveri söndürüb yenidən yandırın!`)}
                className="px-4.5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer"
              >
                Necə etməli?
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/30 p-4 px-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl shrink-0 shadow-xs">
                <Icons.Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Supabase qoşulması aktivdir! ✅</p>
                <p className="text-[11px] text-slate-500 dark:text-sky-200/60 mt-0.5 font-medium">Dəyişikliklər dərhal bulud bazasında qeyd edilir və müştərilərə göstərilir.</p>
              </div>
            </div>

            {items.length === 0 && (
              <button
                onClick={handleMigration}
                className="w-full sm:w-auto px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm animate-pulse"
              >
                <Icons.UploadCloud className="w-4.5 h-4.5" />
                <span>Köhnə məlumatları bazaya köçür (1-kliklə)</span>
              </button>
            )}
          </div>
        )}

        {/* TAB MENYUSU (TAB NAVIGATION - Dynamic Settings and Items switcher) */}
        {isDatabase && (
          <div className="flex border-b border-slate-200 dark:border-white/10 gap-6">
            <button
              onClick={() => setActiveTab("items")}
              className={`pb-3 text-sm font-bold transition-all relative cursor-pointer flex items-center gap-1.5 ${
                activeTab === "items"
                  ? "text-teal-600 dark:text-teal-400"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              <Icons.Utensils className="w-4.5 h-4.5" />
              <span>Yeməklər Menyusu</span>
              {activeTab === "items" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 dark:bg-teal-400 rounded"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`pb-3 text-sm font-bold transition-all relative cursor-pointer flex items-center gap-1.5 ${
                activeTab === "settings"
                  ? "text-teal-600 dark:text-teal-400"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              <Icons.Sliders className="w-4.5 h-4.5" />
              <span>Restoran Ümumi Məlumatları (Mentions)</span>
              {activeTab === "settings" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 dark:bg-teal-400 rounded"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`pb-3 text-sm font-bold transition-all relative cursor-pointer flex items-center gap-1.5 ${
                activeTab === "categories"
                  ? "text-teal-600 dark:text-teal-400"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              <Icons.FolderOpen className="w-4.5 h-4.5" />
              <span>Kateqoriyalar</span>
              {activeTab === "categories" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 dark:bg-teal-400 rounded"></div>
              )}
            </button>
          </div>
        )}

        {/* ----------------------------------------------------
        TAB 1: YEMƏKLƏRİN İDARƏ EDİLMƏSİ
        ---------------------------------------------------- */}
        {activeTab === "items" && (
          <>
            {/* ÜST PANEL ALƏTLƏRİ */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/60 dark:bg-[#0c2447]/40 p-5 rounded-2xl border border-slate-200/80 dark:border-white/5 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Bütün Yeməklərin Siyahısı</h3>
                <p className="text-[11px] text-slate-400 dark:text-sky-200/50 mt-0.5 font-semibold">Ümumi: {items.length} məhsul menyuda mövcuddur</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {isDatabase && (
                  <button
                    onClick={openAddModal}
                    className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-teal-600/10 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Icons.Plus className="w-4.5 h-4.5" />
                    <span>Yeni Yemək Əlavə Et</span>
                  </button>
                )}
                {!isDatabase && (
                  <span className="w-full sm:w-auto text-center px-4 py-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300/50 dark:border-amber-500/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                    <Icons.Lock className="w-3.5 h-3.5" />
                    Dəyişiklik üçün Bazanı qoşun
                  </span>
                )}
              </div>
            </div>

            {/* YEMƏKLƏRİN SİYAHISI */}
            {items.length === 0 ? (
              <div className="bg-white/80 dark:bg-[#0c2447]/40 py-16 px-6 text-center rounded-2xl border border-slate-200/60 dark:border-white/5 flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto shadow-sm">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-[#0c2447] flex items-center justify-center text-slate-400 dark:text-sky-300 border border-slate-200 dark:border-transparent">
                  <Icons.Inbox className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Heç bir təam yoxdur</h3>
                  <p className="text-xs text-slate-500 dark:text-sky-200/60 mt-1.5 max-w-xs leading-relaxed font-medium">
                    Verilənlər bazanız boşdur. Əgər hər şey sazlanıbsa, köhnə hazır menyu məlumatlarını miqrasiya düyməsi ilə 1-saniyədə bura köçürə bilərsiniz.
                  </p>
                </div>
                {isDatabase && (
                  <button 
                    onClick={handleMigration}
                    className="px-5 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-teal-500/10 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Icons.UploadCloud className="w-4.5 h-4.5" />
                    Köhnə Menyunun Məlumatlarını Yüklə
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* MOBİL RESPONSIVE SİYAHI */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {items.map((item) => (
                    <div key={item.id} className="bg-white dark:bg-[#0c2447]/60 rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 flex flex-col gap-3 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&auto=format&fit=crop&q=80"; }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-playfair font-bold text-base text-slate-800 dark:text-white flex items-center flex-wrap gap-1.5 leading-snug">
                            {item.name}
                            {item.isChefSpecial && (
                              <span className="text-[7px] font-extrabold uppercase px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded text-white shadow-2xs shrink-0">Şef</span>
                            )}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-200/40 dark:border-teal-400/10">
                              {categories.find(c => c.id === item.categoryId)?.name || item.categoryId}
                            </span>
                            <span className="price-text-premium text-orange-600 dark:text-amber-400 text-sm">
                              {formatPrice(item.price, settingsCurrency, "text-[10px]")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-sky-200/70 line-clamp-2 leading-relaxed bg-slate-50/50 dark:bg-slate-900/10 p-2 rounded-lg border border-slate-100 dark:border-transparent font-light">
                        {item.ingredients}
                      </p>

                      <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                        <div className="flex gap-1">
                          {item.tags && item.tags.slice(0, 2).map(t => (
                            <span key={t} className="tag-badge-premium text-[7px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#0c2447] text-slate-500 dark:text-sky-300 border border-slate-200 dark:border-sky-400/10 uppercase tracking-wider">{t}</span>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          {isDatabase ? (
                            <>
                              <button
                                onClick={() => openEditModal(item)}
                                className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-transparent rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Icons.Edit3 className="w-3.5 h-3.5" />
                                <span>Düzəliş</span>
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id, item.name)}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-transparent rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Icons.Trash2 className="w-3.5 h-3.5" />
                                <span>Sil</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold italic">Lokal Rejim</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DESKTOP CƏDVƏL GÖRÜNÜŞÜ */}
                <div className="hidden md:block bg-white/80 dark:bg-[#0c2447]/40 rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-x-auto shadow-md">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-[#0b1d38]/80 text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-sky-300/80 border-b border-slate-200 dark:border-white/10">
                        <th className="py-4 px-5">Şəkil & Ad</th>
                        <th className="py-4 px-5">Kateqoriya</th>
                        <th className="py-4 px-5">Qiymət</th>
                        <th className="py-4 px-5">Tərkibi</th>
                        <th className="py-4 px-5 text-right">Əməliyyatlar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm font-medium">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-[#0c2447]/20 transition-colors">
                          <td className="py-4 px-5 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 shrink-0 shadow-xs">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&auto=format&fit=crop&q=80"; }}
                              />
                            </div>
                            <div className="min-w-0 max-w-[200px] sm:max-w-[250px] md:max-w-[300px]">
                              <p className="font-playfair font-bold text-base text-slate-800 dark:text-white flex items-center flex-wrap gap-1.5 leading-snug break-words">
                                {item.name}
                                {item.isChefSpecial && (
                                  <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded text-white shrink-0 shadow-xs">Şef</span>
                                )}
                              </p>
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {item.tags && item.tags.slice(0, 2).map(t => (
                                  <span key={t} className="tag-badge-premium text-[7px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#0c2447] text-slate-500 dark:text-sky-300 border border-slate-200 dark:border-sky-400/10 uppercase tracking-wider">{t}</span>
                                ))}
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-5">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-200/50 dark:border-teal-400/10 shadow-2xs">
                              {renderIcon(categories.find(c => c.id === item.categoryId)?.icon || "HelpCircle", "w-3.5 h-3.5")}
                              <span>{categories.find(c => c.id === item.categoryId)?.name || item.categoryId}</span>
                            </span>
                          </td>

                          <td className="py-4 px-5 price-text-premium text-orange-600 dark:text-amber-400 text-base">
                            {formatPrice(item.price, settingsCurrency, "text-[10px]")}
                          </td>

                          <td className="py-4 px-5 font-light">
                            <div className="max-w-xs truncate text-xs text-slate-500 dark:text-sky-100/70">
                              {item.ingredients || <span className="italic opacity-60">Tərkibi yoxdur</span>}
                            </div>
                          </td>

                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isDatabase && (
                                <>
                                  <button
                                    onClick={() => openEditModal(item)}
                                    className="p-2 bg-teal-50 hover:bg-teal-100 dark:bg-teal-500/5 dark:hover:bg-teal-500/20 border border-teal-200 dark:border-transparent rounded-xl text-teal-600 dark:text-teal-400 transition-all cursor-pointer"
                                    title="Redaktə et"
                                  >
                                    <Icons.Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem(item.id, item.name)}
                                    className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/5 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-transparent rounded-xl text-rose-600 dark:text-rose-400 transition-all cursor-pointer"
                                    title="Sil"
                                  >
                                    <Icons.Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ----------------------------------------------------
        TAB 2: RESTORAN SAZLAMALARI (EDIT GENERAL TEXTS / MENTIONS)
        ---------------------------------------------------- */}
        {activeTab === "settings" && isDatabase && (
          <form onSubmit={handleSaveSettings} className="bg-white/80 dark:bg-[#0c2447]/40 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-white/10 shadow-md space-y-6 animate-fade-in text-sm">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Restoran Ümumi Məlumatlarının Sazlanması</h3>
              <p className="text-xs text-slate-400 dark:text-sky-200/50 mt-0.5 font-medium">Bu bölmədən menyunun yuxarı hissəsində, hero bannerdə və footer-də olan bütün brend adlarını, telefon nömrəsini, ünvanı və wi-fi məlumatlarını canlı redaktə edə bilərsiniz.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Restoran Adı */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Restoranın Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Məsələn: Bizim çimərlik"
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-sky-400/20 bg-slate-50 dark:bg-[#0c2447]/60 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 font-medium"
                />
              </div>

              {/* Alt Başlıq */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Restoranın Alt Başlığı (Subtitle)</label>
                <input
                  type="text"
                  placeholder="Məsələn: Restaurant & Lounge"
                  value={settingsSubtitle}
                  onChange={(e) => setSettingsSubtitle(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-sky-400/20 bg-slate-50 dark:bg-[#0c2447]/60 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 font-medium"
                />
              </div>

              {/* Telefon Nömrəsi */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Əlaqə Telefonu (Bir neçə dənə olduqda vergüllə ayırın)</label>
                <input
                  type="text"
                  placeholder="Məsələn: +994 (50) 123-45-67, +994 (55) 765-43-21"
                  value={settingsPhone}
                  onChange={(e) => setSettingsPhone(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-sky-400/20 bg-slate-50 dark:bg-[#0c2447]/60 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 font-medium"
                />
              </div>

              {/* Pul Nişanı */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Valyuta Simvolu (Currency)</label>
                <input
                  type="text"
                  placeholder="Məsələn: ₼, $, AZN"
                  value={settingsCurrency}
                  onChange={(e) => setSettingsCurrency(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-sky-400/20 bg-slate-50 dark:bg-[#0c2447]/60 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 font-medium"
                />
              </div>

              {/* Wi-Fi Adı */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Wi-Fi Şəbəkəsinin Adı (SSID)</label>
                <input
                  type="text"
                  placeholder="Məsələn: BizimCimerlik_Guest"
                  value={settingsWifi}
                  onChange={(e) => setSettingsWifi(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-sky-400/20 bg-slate-50 dark:bg-[#0c2447]/60 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 font-medium"
                />
              </div>

              {/* Wi-Fi Şifrəsi */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Wi-Fi Şəbəkəsinin Şifrəsi</label>
                <input
                  type="text"
                  placeholder="Məsələn: welcome2026"
                  value={settingsWifiPassword}
                  onChange={(e) => setSettingsWifiPassword(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-sky-400/20 bg-slate-50 dark:bg-[#0c2447]/60 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 font-medium"
                />
              </div>
            </div>

            {/* Ünvan (Böyük mətn sahəsi) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Restoranın Ünvanı</label>
              <textarea
                rows="2"
                placeholder="Məsələn: Bakı bulvarı, Bizim Çimərlik kompleksi, No: 1"
                value={settingsAddress}
                onChange={(e) => setSettingsAddress(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-sky-400/20 bg-slate-50 dark:bg-[#0c2447]/60 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 resize-none font-medium"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex justify-end">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-teal-500/10 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSavingSettings ? (
                  <>
                    <Icons.Sparkles className="w-4 h-4 animate-spin" />
                    <span>Saxlanılır...</span>
                  </>
                ) : (
                  <>
                    <Icons.Save className="w-4 h-4" />
                    <span>Restoran Məlumatlarını Yadda Saxla</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ----------------------------------------------------
        TAB 3: KATEQORİYALARIN İDARƏ EDİLMƏSİ (CRUD CATEGORIES)
        ---------------------------------------------------- */}
        {activeTab === "categories" && isDatabase && (
          <div className="space-y-6 animate-fade-in text-sm animate-fade-in">
            {/* ÜST PANEL ALƏTLƏRİ */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/60 dark:bg-[#0c2447]/40 p-5 rounded-2xl border border-slate-200/80 dark:border-white/5 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Bütün Kateqoriyaların Siyahısı</h3>
                <p className="text-[11px] text-slate-400 dark:text-sky-200/50 mt-0.5 font-semibold">Ümumi: {categories.length} kateqoriya menyuda mövcuddur</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setCatFormName("");
                    setCatFormDescription("");
                    setCatFormIcon("Utensils");
                    setIsCategoryModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-teal-600/10 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Icons.Plus className="w-4.5 h-4.5" />
                  <span>Yeni Kateqoriya Əlavə Et</span>
                </button>
              </div>
            </div>

            {/* KATEQORİYALARIN SİYAHISI */}
            {categories.length === 0 ? (
              <div className="bg-white/80 dark:bg-[#0c2447]/40 py-16 px-6 text-center rounded-2xl border border-slate-200/60 dark:border-white/5 flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto shadow-sm">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-[#0c2447] flex items-center justify-center text-slate-400 dark:text-sky-300 border border-slate-200 dark:border-transparent animate-pulse">
                  <Icons.FolderOpen className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Heç bir kateqoriya yoxdur</h3>
                  <p className="text-xs text-slate-500 dark:text-sky-200/60 mt-1.5 max-w-xs leading-relaxed font-medium">
                    Hazırda kateqoriya siyahısı boşdur.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* MOBİL RESPONSIVE SİYAHI */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {categories.map((cat, idx) => (
                    <div key={cat.id} className="bg-white dark:bg-[#0c2447]/60 rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 flex flex-col gap-3 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                          {renderIcon(cat.icon, "w-5 h-5")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-playfair font-bold text-base text-slate-800 dark:text-white leading-snug">
                            {cat.name}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 dark:text-sky-200/40">ID: {cat.id}</p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-sky-200/70 leading-relaxed font-medium">
                        {cat.description || "Təsvir yazılmayıb."}
                      </p>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMoveCategory(idx, "up")}
                            disabled={idx === 0}
                            className={`p-1.5 rounded-lg border transition-all ${
                              idx === 0
                                ? "opacity-30 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400"
                                : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-teal-600 dark:text-teal-400 cursor-pointer"
                            }`}
                            title="Yuxarı daşı"
                          >
                            <Icons.ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveCategory(idx, "down")}
                            disabled={idx === categories.length - 1}
                            className={`p-1.5 rounded-lg border transition-all ${
                              idx === categories.length - 1
                                ? "opacity-30 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400"
                                : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-teal-600 dark:text-teal-400 cursor-pointer"
                            }`}
                            title="Aşağı daşı"
                          >
                            <Icons.ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => openEditCategoryModal(cat)}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-transparent rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Icons.Edit3 className="w-3.5 h-3.5" />
                          <span>Redaktə</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-transparent rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Icons.Trash2 className="w-3.5 h-3.5" />
                          <span>Sil</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DESKTOP CƏDVƏL GÖRÜNÜŞÜ */}
                <div className="hidden md:block bg-white/80 dark:bg-[#0c2447]/40 rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-x-auto shadow-md">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-[#0b1d38]/80 text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-sky-300/80 border-b border-slate-200 dark:border-white/10">
                        <th className="py-4 px-5 w-20 text-center">İkon</th>
                        <th className="py-4 px-5">Kateqoriya Adı</th>
                        <th className="py-4 px-5">Sistem ID-si</th>
                        <th className="py-4 px-5">Təsviri (Açıqlaması)</th>
                        <th className="py-4 px-5 text-center w-24">Sıralama</th>
                        <th className="py-4 px-5 text-right w-24">Əməliyyat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm font-medium">
                      {categories.map((cat, idx) => (
                        <tr key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-[#0c2447]/20 transition-colors">
                          <td className="py-4 px-5 text-center">
                            <div className="w-10 h-10 mx-auto rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-2xs">
                              {renderIcon(cat.icon, "w-5 h-5")}
                            </div>
                          </td>
                          <td className="py-4 px-5 text-slate-800 dark:text-white font-bold font-playfair text-base">
                            <div className="max-w-[200px] break-words">
                              {cat.name}
                            </div>
                          </td>
                          <td className="py-4 px-5 font-mono text-xs text-slate-400 dark:text-sky-200/40">
                            {cat.id}
                          </td>
                          <td className="py-4 px-5">
                            <div className="max-w-xs truncate text-xs text-slate-500 dark:text-sky-100/70">
                              {cat.description || <span className="italic opacity-60">Yazılmayıb</span>}
                            </div>
                          </td>
                          <td className="py-4 px-5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleMoveCategory(idx, "up")}
                                disabled={idx === 0}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  idx === 0
                                    ? "opacity-30 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400"
                                    : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-teal-600 dark:text-teal-400 cursor-pointer"
                                }`}
                                title="Yuxarı daşı"
                              >
                                <Icons.ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveCategory(idx, "down")}
                                disabled={idx === categories.length - 1}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  idx === categories.length - 1
                                    ? "opacity-30 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400"
                                    : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-teal-600 dark:text-teal-400 cursor-pointer"
                                }`}
                                title="Aşağı daşı"
                              >
                                <Icons.ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end">
                              <button
                                onClick={() => openEditCategoryModal(cat)}
                                className="p-2 bg-teal-50 hover:bg-teal-100 dark:bg-teal-500/5 dark:hover:bg-teal-500/20 border border-teal-200 dark:border-transparent rounded-xl text-teal-600 dark:text-teal-400 transition-all cursor-pointer mr-1.5"
                                title="Redaktə et"
                              >
                                <Icons.Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/5 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-transparent rounded-xl text-rose-600 dark:text-rose-400 transition-all cursor-pointer"
                                title="Sil"
                              >
                                <Icons.Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ----------------------------------------------------
      YENİ YEMƏK ƏLAVƏ ETMƏ MODALI
      ---------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#0c2447] rounded-2xl border border-slate-200 dark:border-white/20 overflow-hidden flex flex-col shadow-2xl max-h-[90vh]">
            <header className="p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-[#0b1d38]/85">
              <h3 className="font-playfair text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <Icons.Plus className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>Yeni Yemək Əlavə Et</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                <Icons.X className="w-5 h-5" />
              </button>
            </header>

            <form onSubmit={handleAddItem} className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700 dark:text-slate-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Yeməyin Adı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Məsələn: Sacüstü Quzu"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-sky-400/20 bg-slate-50 dark:bg-[#0c2447]/60 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Qiyməti ({settingsCurrency}) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Məsələn: 24.50 və ya 15 / 20"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-sky-400/20 bg-slate-50 dark:bg-[#0c2447]/60 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Kateqoriyası *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-sky-400/20 bg-slate-50 dark:bg-[#0c2447]/60 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-white dark:bg-[#06152d] text-slate-800 dark:text-white">{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Yeməyin Şəkli *</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                {formImage ? (
                  <div className="relative h-44 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 group shadow-xs">
                    <img
                      src={formImage}
                      alt="Yüklənən Yemək"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 bg-white text-slate-800 text-xs font-bold rounded-xl shadow-md transition-all hover:scale-105"
                      >
                        Şəkli Dəyiş
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormImage("")}
                        className="px-3.5 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-105 hover:bg-rose-700"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full h-36 rounded-xl border-2 border-dashed border-slate-300 hover:border-teal-500 dark:border-sky-400/20 dark:hover:border-teal-500 bg-slate-50 hover:bg-slate-100/50 dark:bg-[#0c2447]/40 dark:hover:bg-[#0c2447]/60 transition-all flex flex-col items-center justify-center space-y-2 cursor-pointer shadow-2xs"
                  >
                    {isUploading ? (
                      <>
                        <Icons.Sparkles className="w-8 h-8 text-teal-600 dark:text-orange-500 animate-spin" />
                        <span className="text-xs font-bold text-slate-500 dark:text-sky-200/70">Şəkil buluda yüklənir...</span>
                      </>
                    ) : (
                      <>
                        <Icons.UploadCloud className="w-8 h-8 text-slate-400 dark:text-sky-300/60" />
                        <span className="text-xs font-bold text-slate-500 dark:text-sky-200/80">Telefondan və ya Kompüterdən Şəkil Yüklə</span>
                        <span className="text-[10px] text-slate-400 dark:text-sky-200/40">PNG, JPG, WEBP (Maks. 5MB)</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Yeməyin Tərkibi</label>
                <textarea
                  rows="3"
                  placeholder="Yeməyin inqrediyentləri, hazırlanma üsulu..."
                  value={formIngredients}
                  onChange={(e) => setFormIngredients(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-sky-400/20 bg-slate-50 dark:bg-[#0c2447]/60 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Etiketlər (Vergüllə ayırın)</label>
                  <input
                    type="text"
                    placeholder="Məsələn: Populyar, Milli"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-sky-400/20 bg-slate-50 dark:bg-[#0c2447]/60 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500"
                  />
                </div>
                <div className="flex items-center gap-2.5 h-full pt-6">
                  <input
                    type="checkbox"
                    id="add-chef"
                    checked={formChefSpecial}
                    onChange={(e) => setFormChefSpecial(e.target.checked)}
                    className="w-4.5 h-4.5 text-teal-600 border-slate-200 dark:border-sky-400/20 bg-slate-50 dark:bg-[#0c2447]/60 rounded focus:ring-4 focus:ring-teal-500/10 shrink-0 cursor-pointer"
                  />
                  <label htmlFor="add-chef" className="text-xs font-bold text-slate-600 dark:text-sky-200 select-none cursor-pointer">Şefin Seçimidir</label>
                </div>
              </div>

              <footer className="pt-5 flex gap-3 border-t border-slate-100 dark:border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-xs transition-all text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-teal-500/10 cursor-pointer"
                >
                  Əlavə Et
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
      REDAKTƏ ETMƏ MODALI
      ---------------------------------------------------- */}
      {isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#0c2447] rounded-2xl border border-slate-200 dark:border-white/20 overflow-hidden flex flex-col shadow-2xl max-h-[90vh]">
            <header className="p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-[#0b1d38]/85">
              <h3 className="font-playfair text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <Icons.Edit className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>Yeməyi Redaktə Et</span>
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                <Icons.X className="w-5 h-5" />
              </button>
            </header>

            <form onSubmit={handleEditItem} className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700 dark:text-slate-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Yeməyin Adı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Sacüstü Quzu"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-sky-400/20 bg-slate-50 dark:bg-[#0c2447]/60 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Qiyməti ({settingsCurrency}) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Məsələn: 24.50 və ya 15 / 20"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-sky-400/20 bg-slate-50 dark:bg-[#0c2447]/60 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Kateqoriyası *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-sky-400/20 bg-slate-50 dark:bg-[#0c2447]/60 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-white dark:bg-[#06152d] text-slate-800 dark:text-white">{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Yeməyin Şəkli *</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                {formImage ? (
                  <div className="relative h-44 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 group shadow-xs">
                    <img
                      src={formImage}
                      alt="Yüklənən Yemək"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 bg-white text-slate-800 text-xs font-bold rounded-xl shadow-md transition-all hover:scale-105"
                      >
                        Şəkli Dəyiş
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormImage("")}
                        className="px-3.5 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-105 hover:bg-rose-700"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full h-36 rounded-xl border-2 border-dashed border-slate-300 hover:border-teal-500 dark:border-sky-400/20 dark:hover:border-teal-500 bg-slate-50 hover:bg-slate-100/50 dark:bg-[#0c2447]/40 dark:hover:bg-[#0c2447]/60 transition-all flex flex-col items-center justify-center space-y-2 cursor-pointer shadow-2xs"
                  >
                    {isUploading ? (
                      <>
                        <Icons.Sparkles className="w-8 h-8 text-teal-600 dark:text-orange-500 animate-spin" />
                        <span className="text-xs font-bold text-slate-500 dark:text-sky-200/70">Şəkil buluda yüklənir...</span>
                      </>
                    ) : (
                      <>
                        <Icons.UploadCloud className="w-8 h-8 text-slate-400 dark:text-sky-300/60" />
                        <span className="text-xs font-bold text-slate-500 dark:text-sky-200/80">Telefondan və ya Kompüterdən Şəkil Yüklə</span>
                        <span className="text-[10px] text-slate-400 dark:text-sky-200/40">PNG, JPG, WEBP (Maks. 5MB)</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Yeməyin Tərkibi</label>
                <textarea
                  rows="3"
                  placeholder="Yeməyin inqrediyentləri, hazırlanıb təqdim olunması..."
                  value={formIngredients}
                  onChange={(e) => setFormIngredients(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-sky-400/20 bg-slate-50 dark:bg-[#0c2447]/60 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Etiketlər (Vergüllə ayırın)</label>
                  <input
                    type="text"
                    placeholder="Populyar, Şefin Seçimi"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-sky-400/20 bg-slate-50 dark:bg-[#0c2447]/60 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500"
                  />
                </div>
                <div className="flex items-center gap-2.5 h-full pt-6">
                  <input
                    type="checkbox"
                    id="edit-chef"
                    checked={formChefSpecial}
                    onChange={(e) => setFormChefSpecial(e.target.checked)}
                    className="w-4.5 h-4.5 text-teal-600 border-slate-200 dark:border-sky-400/20 bg-slate-50 dark:bg-[#0c2447]/60 rounded focus:ring-4 focus:ring-teal-500/10 shrink-0 cursor-pointer"
                  />
                  <label htmlFor="edit-chef" className="text-xs font-bold text-slate-600 dark:text-sky-200 select-none cursor-pointer">Şefin Seçimidir</label>
                </div>
              </div>

              <footer className="pt-5 flex gap-3 border-t border-slate-100 dark:border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-xs transition-all text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-teal-500/10 cursor-pointer"
                >
                  Yadda Saxla
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
      YENİ KATEQORİYA ƏLAVƏ ETMƏ MODALI (ADD CATEGORY MODAL)
      ---------------------------------------------------- */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0c2447] rounded-2xl border border-slate-200 dark:border-white/20 overflow-hidden flex flex-col shadow-2xl max-h-[90vh]">
            <header className="p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-[#0b1d38]/85">
              <h3 className="font-playfair text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <Icons.FolderPlus className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>Yeni Kateqoriya Əlavə Et</span>
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:white p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                <Icons.X className="w-5 h-5" />
              </button>
            </header>

            <form onSubmit={handleAddCategory} className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700 dark:text-slate-300">
              {/* Kateqoriya Adı */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Kateqoriya Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Məsələn: Fast Food, Salatlar"
                  value={catFormName}
                  onChange={(e) => setCatFormName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-sky-400/20 bg-slate-50 dark:bg-[#0c2447]/60 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 font-medium"
                />
              </div>

              {/* İkon Seçimi */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Uyğun İkon *</label>
                <div className="relative">
                  <select
                    value={catFormIcon}
                    onChange={(e) => setCatFormIcon(e.target.value)}
                    className="w-full p-3 pl-12 rounded-xl border border-slate-200 dark:border-sky-400/20 bg-slate-50 dark:bg-[#0c2447]/60 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 font-medium"
                  >
                    <option value="Utensils">Utensils (Çəngəl-Bıçaq - Yeməklər)</option>
                    <option value="Flame">Flame (Alov - Manqal/Kabablar)</option>
                    <option value="Salad">Salad (Salat - Soyuq Qəlyanaltılar)</option>
                    <option value="Soup">Soup (Şorba - Şorbalar)</option>
                    <option value="Coffee">Coffee (Qəhvə - İsti İçkilər/Çay)</option>
                    <option value="Cake">Cake (Tort - Şirniyyatlar)</option>
                    <option value="Pizza">Pizza (Pizza - Fast Food)</option>
                    <option value="Fish">Fish (Balıq - Balıq Yeməkləri)</option>
                    <option value="IceCream">IceCream (Dondurma - Sərin Desertlər)</option>
                    <option value="Cookie">Cookie (Çərəz / Desertlər)</option>
                    <option value="GlassWater">GlassWater (Stəkan - Soyuq İçkilər/Limonadlar)</option>
                    <option value="Wine">Wine (Şərab stəkanı - Bar)</option>
                    <option value="Apple">Apple (Alma - Sağlam qidalar)</option>
                    <option value="CookingPot">CookingPot (Qazan - Qazan Yeməkləri)</option>
                    <option value="Disc">Disc (Sac / Dairə - Sac Yeməkləri)</option>
                    <option value="ChefHat">ChefHat (Şef papağı - Tava Yeməkləri)</option>
                    <option value="Candy">Candy (Konfet - Şirniyyat / Çərəz)</option>
                  </select>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-600 dark:text-teal-400 pointer-events-none">
                    {renderIcon(catFormIcon, "w-5 h-5")}
                  </div>
                </div>
              </div>

              {/* Təsviri */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Qısa Təsviri (Description)</label>
                <textarea
                  rows="3"
                  placeholder="Müştərilərin kateqoriya altında görəcəyi qısa açıqlama..."
                  value={catFormDescription}
                  onChange={(e) => setCatFormDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-sky-400/20 bg-slate-50 dark:bg-[#0c2447]/60 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 resize-none font-medium"
                />
              </div>

              {/* Arxa Fon Şəkli (Watermark) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Çap üçün Arxa Fon Şəkli (Watermark)</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={watermarkFileInputRef}
                  onChange={handleWatermarkUpload}
                  className="hidden"
                />
                
                {catFormWatermark ? (
                  <div className="relative h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 group shadow-xs">
                    <img
                      src={catFormWatermark}
                      alt="Watermark"
                      className="w-full h-full object-contain bg-slate-100/50 dark:bg-slate-900/50 p-2"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => watermarkFileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white text-slate-800 text-xs font-bold rounded-lg shadow-md transition-all hover:scale-105"
                      >
                        Dəyiş
                      </button>
                      <button
                        type="button"
                        onClick={() => setCatFormWatermark("")}
                        className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-md transition-all hover:scale-105 hover:bg-rose-700"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => watermarkFileInputRef.current?.click()}
                    disabled={isUploadingWatermark}
                    className="w-full h-24 rounded-xl border-2 border-dashed border-slate-300 hover:border-teal-500 dark:border-sky-400/20 dark:hover:border-teal-500 bg-slate-50 hover:bg-slate-100/50 dark:bg-[#0c2447]/40 dark:hover:bg-[#0c2447]/60 transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer shadow-2xs"
                  >
                    {isUploadingWatermark ? (
                      <>
                        <Icons.Sparkles className="w-6 h-6 text-teal-600 dark:text-orange-500 animate-spin" />
                        <span className="text-xs font-bold text-slate-500 dark:text-sky-200/70">Yüklənir...</span>
                      </>
                    ) : (
                      <>
                        <Icons.UploadCloud className="w-6 h-6 text-slate-400 dark:text-sky-300/60" />
                        <span className="text-xs font-bold text-slate-500 dark:text-sky-200/80">Arxa fon şəkli yüklə</span>
                        <span className="text-[9px] text-slate-400 dark:text-sky-200/40">Çap vərəqində görünəcək loqo/şəkil</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <footer className="pt-5 flex gap-3 border-t border-slate-100 dark:border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-xs transition-all text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  disabled={isSavingCategory}
                  className="flex-1 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-teal-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSavingCategory ? (
                    <>
                      <Icons.Sparkles className="w-4 h-4 animate-spin" />
                      <span>Saxlanılır...</span>
                    </>
                  ) : (
                    <span>Kateqoriya Əlavə Et</span>
                  )}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
      KATEQORİYA REDAKTƏ MODALI (EDIT CATEGORY MODAL)
      ---------------------------------------------------- */}
      {isEditCategoryModalOpen && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0c2447] rounded-2xl border border-slate-200 dark:border-white/20 overflow-hidden flex flex-col shadow-2xl max-h-[90vh]">
            <header className="p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-[#0b1d38]/85">
              <h3 className="font-playfair text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <Icons.FolderEdit className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>Kateqoriyanı Redaktə Et</span>
              </h3>
              <button 
                onClick={() => {
                  setIsEditCategoryModalOpen(false);
                  setSelectedCategory(null);
                  setCatFormName("");
                  setCatFormDescription("");
                  setCatFormIcon("Utensils");
                  setCatFormWatermark("");
                }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:white p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </header>

            <form onSubmit={handleEditCategory} className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700 dark:text-slate-300">
              {/* Kateqoriya Adı */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Kateqoriya Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Məsələn: Fast Food, Salatlar"
                  value={catFormName}
                  onChange={(e) => setCatFormName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-sky-400/20 bg-slate-50 dark:bg-[#0c2447]/60 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 font-medium"
                />
              </div>

              {/* İkon Seçimi */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Uyğun İkon *</label>
                <div className="relative">
                  <select
                    value={catFormIcon}
                    onChange={(e) => setCatFormIcon(e.target.value)}
                    className="w-full p-3 pl-12 rounded-xl border border-slate-200 dark:border-sky-400/20 bg-slate-50 dark:bg-[#0c2447]/60 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 font-medium"
                  >
                    <option value="Utensils">Utensils (Çəngəl-Bıçaq - Yeməklər)</option>
                    <option value="Flame">Flame (Alov - Manqal/Kabablar)</option>
                    <option value="Salad">Salad (Salat - Soyuq Qəlyanaltılar)</option>
                    <option value="Soup">Soup (Şorba - Şorbalar)</option>
                    <option value="Coffee">Coffee (Qəhvə - İsti İçkilər/Çay)</option>
                    <option value="Cake">Cake (Tort - Şirniyyatlar)</option>
                    <option value="Pizza">Pizza (Pizza - Fast Food)</option>
                    <option value="Fish">Fish (Balıq - Balıq Yeməkləri)</option>
                    <option value="IceCream">IceCream (Dondurma - Sərin Desertlər)</option>
                    <option value="Cookie">Cookie (Çərəz / Desertlər)</option>
                    <option value="GlassWater">GlassWater (Stəkan - Soyuq İçkilər/Limonadlar)</option>
                    <option value="Wine">Wine (Şərab stəkanı - Bar)</option>
                    <option value="Apple">Apple (Alma - Sağlam qidalar)</option>
                    <option value="CookingPot">CookingPot (Qazan - Qazan Yeməkləri)</option>
                    <option value="Disc">Disc (Sac / Dairə - Sac Yeməkləri)</option>
                    <option value="ChefHat">ChefHat (Şef papağı - Tava Yeməkləri)</option>
                    <option value="Candy">Candy (Konfet - Şirniyyat / Çərəz)</option>
                  </select>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-600 dark:text-teal-400 pointer-events-none">
                    {renderIcon(catFormIcon, "w-5 h-5")}
                  </div>
                </div>
              </div>

              {/* Təsviri */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Qısa Təsviri (Description)</label>
                <textarea
                  rows="3"
                  placeholder="Müştərilərin kateqoriya altında görəcəyi qısa açıqlama..."
                  value={catFormDescription}
                  onChange={(e) => setCatFormDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-sky-400/20 bg-slate-50 dark:bg-[#0c2447]/60 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 resize-none font-medium"
                />
              </div>

              {/* Arxa Fon Şəkli (Watermark) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-sky-200 block">Çap üçün Arxa Fon Şəkli (Watermark)</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={watermarkFileInputRef}
                  onChange={handleWatermarkUpload}
                  className="hidden"
                />
                
                {catFormWatermark ? (
                  <div className="relative h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 group shadow-xs">
                    <img
                      src={catFormWatermark}
                      alt="Watermark"
                      className="w-full h-full object-contain bg-slate-100/50 dark:bg-slate-900/50 p-2"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => watermarkFileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white text-slate-800 text-xs font-bold rounded-lg shadow-md transition-all hover:scale-105"
                      >
                        Dəyiş
                      </button>
                      <button
                        type="button"
                        onClick={() => setCatFormWatermark("")}
                        className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-md transition-all hover:scale-105 hover:bg-rose-700"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => watermarkFileInputRef.current?.click()}
                    disabled={isUploadingWatermark}
                    className="w-full h-24 rounded-xl border-2 border-dashed border-slate-300 hover:border-teal-500 dark:border-sky-400/20 dark:hover:border-teal-500 bg-slate-50 hover:bg-slate-100/50 dark:bg-[#0c2447]/40 dark:hover:bg-[#0c2447]/60 transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer shadow-2xs"
                  >
                    {isUploadingWatermark ? (
                      <>
                        <Icons.Sparkles className="w-6 h-6 text-teal-600 dark:text-orange-500 animate-spin" />
                        <span className="text-xs font-bold text-slate-500 dark:text-sky-200/70">Yüklənir...</span>
                      </>
                    ) : (
                      <>
                        <Icons.UploadCloud className="w-6 h-6 text-slate-400 dark:text-sky-300/60" />
                        <span className="text-xs font-bold text-slate-500 dark:text-sky-200/80">Arxa fon şəkli yüklə</span>
                        <span className="text-[9px] text-slate-400 dark:text-sky-200/40">Çap vərəqində görünəcək loqo/şəkil</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <footer className="pt-5 flex gap-3 border-t border-slate-100 dark:border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditCategoryModalOpen(false);
                    setSelectedCategory(null);
                    setCatFormName("");
                    setCatFormDescription("");
                    setCatFormIcon("Utensils");
                    setCatFormWatermark("");
                  }}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-xs transition-all text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  disabled={isSavingCategory}
                  className="flex-1 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-teal-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSavingCategory ? (
                    <>
                      <Icons.Sparkles className="w-4 h-4 animate-spin" />
                      <span>Saxlanılır...</span>
                    </>
                  ) : (
                    <span>Yadda Saxla</span>
                  )}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* QR MODAL */}
      {isQrModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in no-print-admin"
          onClick={() => setIsQrModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#0e2245] border border-slate-200 dark:border-white/10 shadow-2xl rounded-3xl p-6 relative animate-fade-in text-slate-800 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
              <h3 className="font-playfair text-xl font-bold text-teal-600 dark:text-teal-400 flex items-center gap-2">
                <Icons.QrCode className="w-5 h-5 text-orange-500 animate-pulse" />
                <span>QR Kod Generatoru</span>
              </h3>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="py-6 flex flex-col items-center space-y-6">
              {/* Tabs */}
              <div className="w-full grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800">
                <button
                  onClick={() => setQrLinkType("menu")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    qrLinkType === "menu"
                      ? "bg-white dark:bg-[#0c2447] text-teal-600 dark:text-teal-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:text-sky-200/60 dark:hover:text-sky-200"
                  }`}
                >
                  Menyu QR
                </button>
                <button
                  onClick={() => setQrLinkType("admin")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    qrLinkType === "admin"
                      ? "bg-white dark:bg-[#0c2447] text-teal-600 dark:text-teal-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:text-sky-200/60 dark:hover:text-sky-200"
                  }`}
                >
                  Admin Panel QR
                </button>
              </div>

              {/* Description */}
              <p className="text-center text-xs text-slate-500 dark:text-sky-200/70 max-w-sm px-2 font-medium">
                {qrLinkType === "menu"
                  ? "Müştərilərin telefonla skan edib rəqəmsal menyuya birbaşa daxil olması üçün QR Kod."
                  : "İdarəçilərin (adminlərin) mobil telefondan birbaşa admin panelə keçid etməsi üçün QR Kodu."}
              </p>

              {/* QR Image Frame */}
              <div className="p-4 bg-white border border-slate-200 dark:border-white/10 rounded-2xl shadow-inner flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
                    typeof window !== "undefined"
                      ? `${window.location.origin}${qrLinkType === "admin" ? "/admin" : ""}`
                      : `https://bizim-cimerlik.vercel.app${qrLinkType === "admin" ? "/admin" : ""}`
                  )}`}
                  alt="QR Code"
                  className="w-40 h-40 md:w-64 md:h-64 object-contain animate-fade-in"
                />
              </div>

              {/* Target Link Info */}
              <div className="w-full bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/50 dark:border-white/5 text-center">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 block mb-0.5">Hədəf Keçid Linki</span>
                <span className="text-xs font-bold font-mono text-teal-600 dark:text-teal-400 truncate block max-w-xs mx-auto">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}${qrLinkType === "admin" ? "/admin" : ""}`
                    : `https://bizim-cimerlik.vercel.app${qrLinkType === "admin" ? "/admin" : ""}`}
                </span>
              </div>

              {/* Toplu Çap Keçidi */}
              {qrLinkType === "menu" && (
                <div className="w-full pt-4 border-t border-dashed border-slate-200 dark:border-white/10 text-center">
                  <p className="text-[10px] text-slate-500 dark:text-sky-200/60 mb-2 font-medium">Masaların üstünə qoymaq üçün A4 vərəqdə toplu QR kod çap etmək istəyirsiniz?</p>
                  <button
                    onClick={() => {
                      setIsQrModalOpen(false);
                      window.open("/qr", "_blank");
                    }}
                    className="w-full py-2.5 bg-teal-600/10 hover:bg-teal-600/20 border border-teal-200/40 dark:border-teal-500/20 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Icons.Layers className="w-4 h-4 text-orange-500" />
                    <span>A4 Ölçülü QR Çap Paneli</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex flex-wrap gap-2.5">
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="flex-1 min-w-[80px] py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-xs transition-all text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                İmtina
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 min-w-[110px] py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-1"
              >
                <Icons.Printer className="w-4 h-4" />
                <span>Çap Et (4x4 sm)</span>
              </button>
              <button
                onClick={handleShareQR}
                className="flex-1 min-w-[100px] py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-1"
              >
                <Icons.Share2 className="w-4 h-4" />
                <span>Paylaş</span>
              </button>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
                  typeof window !== "undefined"
                    ? `${window.location.origin}${qrLinkType === "admin" ? "/admin" : ""}`
                    : `https://bizim-cimerlik.vercel.app${qrLinkType === "admin" ? "/admin" : ""}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 min-w-[90px] py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-teal-500/10 cursor-pointer text-center flex items-center justify-center gap-1"
              >
                <Icons.Download className="w-4.5 h-4.5" />
                <span>Yüklə</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Zərif Qorunma Footer-i */}
      <footer className="mt-16 text-center text-xs text-slate-400 dark:text-slate-500 py-6 border-t border-slate-200/80 dark:border-white/5">
        🔒 {settingsName || "Bizim çimərlik"} Admin Paneli. Zəmanətli şifrə sistemi.
      </footer>

      {/* YALNIZ ÇAP ZAMANI GÖRÜNƏN 4x4 CM KART VƏ ÇAP STİLLƏRİ */}
      <div className="hidden print-only-card">
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
            typeof window !== "undefined"
              ? `${window.location.origin}${qrLinkType === "admin" ? "/admin" : ""}`
              : `https://bizim-cimerlik.vercel.app${qrLinkType === "admin" ? "/admin" : ""}`
          )}`}
          alt="QR Code"
          style={{ width: '3.1cm', height: '3.1cm', display: 'block' }}
        />
        <span style={{ fontSize: '7px', fontWeight: 'bold', marginTop: '1.5mm', fontFamily: 'sans-serif', color: 'black', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {settingsName} - {qrLinkType === "admin" ? "Admin" : "Menyu"}
        </span>
      </div>

      <style>{`
        @media print {
          /* Bütün digər elementləri gizlət */
          .no-print-admin {
            display: none !important;
          }
          /* Çap vərəqində yalnız 4x4 cm kartı göstər */
          .print-only-card {
            display: flex !important;
            width: 4cm !important;
            height: 4cm !important;
            border: 1px dashed #d97706 !important; /* Qızılı kəsik xətti */
            padding: 2mm !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            position: absolute !important;
            top: 1cm !important;
            left: 1cm !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
