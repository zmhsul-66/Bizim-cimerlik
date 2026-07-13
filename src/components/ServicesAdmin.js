'use client';

import { useState, useEffect } from "react";
import * as Icons from "lucide-react";

export default function ServicesAdmin({ password, showToast }) {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  
  // Form states
  const [formId, setFormId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formIcon, setFormIcon] = useState("Star");
  const [formDescription, setFormDescription] = useState("");
  const [formItems, setFormItems] = useState([]);
  const [formContacts, setFormContacts] = useState([]);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/services", {
        headers: { "x-admin-password": password }
      });
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
      }
    } catch (err) {
      console.error(err);
      showToast("Xidmətlər yüklənərkən xəta", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const saveToDatabase = async (updatedServices) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password
        },
        body: JSON.stringify({ services: updatedServices })
      });
      if (res.ok) {
        setServices(updatedServices);
        showToast("Məlumatlar yadda saxlanıldı", "success");
        setIsModalOpen(false);
      } else {
        showToast("Yadda saxlama zamanı xəta", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Serverlə əlaqə xətası", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (index) => {
    const s = services[index];
    setEditingIndex(index);
    setFormId(s.id || "");
    setFormTitle(s.title || "");
    setFormIcon(s.icon || "Star");
    setFormDescription(s.description || "");
    setFormItems(s.items ? JSON.parse(JSON.stringify(s.items)) : []);
    setFormContacts(s.contacts ? JSON.parse(JSON.stringify(s.contacts)) : []);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingIndex(null);
    setFormId(`service_${Date.now()}`);
    setFormTitle("");
    setFormIcon("Star");
    setFormDescription("");
    setFormItems([]);
    setFormContacts([]);
    setIsModalOpen(true);
  };

  const handleDelete = async (index) => {
    if (!window.confirm("Bu xidməti silmək istədiyinizə əminsiniz?")) return;
    const newServices = [...services];
    newServices.splice(index, 1);
    await saveToDatabase(newServices);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast("Başlıq daxil edilməlidir", "error");
      return;
    }

    const newService = {
      id: formId,
      title: formTitle,
      icon: formIcon,
      description: formDescription,
      items: formItems,
      contacts: formContacts
    };

    const newServices = [...services];
    if (editingIndex !== null) {
      newServices[editingIndex] = newService;
    } else {
      newServices.push(newService);
    }

    await saveToDatabase(newServices);
  };

  // Dinamik İkon göstərmək üçün köməkçi
  const renderIcon = (iconName, className) => {
    const IconComponent = Icons[iconName] || Icons.HelpCircle;
    return <IconComponent className={className} />;
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Yüklənir...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Üst Panel */}
      <div className="flex items-center justify-between bg-white/60 dark:bg-[#0c2447]/40 p-5 rounded-2xl border border-slate-200/80 dark:border-white/5 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Xidmətlərin İdarə Edilməsi</h3>
          <p className="text-[11px] text-slate-400 dark:text-sky-200/50 mt-0.5 font-semibold">
            Ümumi: {services.length} xidmət kateqoriyası
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="px-5 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
        >
          <Icons.Plus className="w-4 h-4" />
          Yeni Xidmət Əlavə Et
        </button>
      </div>

      {/* Siyahı */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, idx) => (
          <div key={idx} className="bg-white dark:bg-[#0c2447] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col relative group">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded-lg text-teal-600 dark:text-teal-400">
                {renderIcon(service.icon, "w-5 h-5")}
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white text-lg">{service.title}</h4>
            </div>
            <p className="text-sm text-slate-500 dark:text-sky-200/70 mb-4 flex-1 line-clamp-2">
              {service.description}
            </p>
            
            <div className="flex gap-2 text-xs text-slate-400 dark:text-slate-500 mb-4 font-medium bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg justify-center">
              <span>{service.items?.length || 0} alt-xidmət</span>
              <span>•</span>
              <span>{service.contacts?.length || 0} əlaqə nömrəsi</span>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={() => handleEdit(idx)}
                className="flex-1 flex justify-center items-center gap-1.5 py-2 bg-slate-50 hover:bg-teal-50 dark:bg-slate-800 hover:dark:bg-teal-900/30 text-slate-600 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400 rounded-lg text-xs font-bold transition-colors"
              >
                <Icons.Edit2 className="w-3.5 h-3.5" />
                Redaktə
              </button>
              <button
                onClick={() => handleDelete(idx)}
                className="flex-none p-2 bg-slate-50 hover:bg-red-50 dark:bg-slate-800 hover:dark:bg-red-900/30 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 rounded-lg transition-colors"
              >
                <Icons.Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-[#0c2447] w-full max-w-3xl rounded-3xl shadow-2xl my-auto">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-[#0c2447] rounded-t-3xl z-10">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                {editingIndex !== null ? <Icons.Edit className="w-5 h-5 text-teal-600" /> : <Icons.PlusCircle className="w-5 h-5 text-teal-600" />}
                {editingIndex !== null ? "Xidməti Redaktə Et" : "Yeni Xidmət Yarat"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 hover:bg-red-50 dark:bg-slate-800 hover:dark:bg-red-900/30 text-slate-400 hover:text-red-500 rounded-full transition-colors">
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 max-h-[70vh] overflow-y-auto no-scrollbar space-y-8">
              
              {/* ƏSAS MƏLUMATLAR */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-teal-600 dark:text-teal-400 border-b border-teal-100 dark:border-teal-900/30 pb-2">1. Əsas Məlumatlar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Başlıq</label>
                    <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Məs: Koteclər" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">İkon Adı (Lucide)</label>
                    <input type="text" value={formIcon} onChange={e => setFormIcon(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Məs: Home, Tent, Waves" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Təsvir</label>
                    <input type="text" value={formDescription} onChange={e => setFormDescription(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Məs: Ailəniz və dostlarınızla rahat istirahət üçün..." />
                  </div>
                </div>
              </div>

              {/* ALT XİDMƏTLƏR (ITEMS) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-teal-100 dark:border-teal-900/30 pb-2">
                  <h3 className="text-sm font-bold text-teal-600 dark:text-teal-400">2. Alt Xidmətlər və Qiymətlər (Items)</h3>
                  <button type="button" onClick={() => setFormItems([...formItems, { name: "", price: "", details: "" }])} className="text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:hover:bg-teal-800/50 dark:text-teal-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                    <Icons.Plus className="w-3.5 h-3.5" /> Əlavə Et
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formItems.length === 0 && <p className="text-xs text-slate-400 italic">Heç bir alt-xidmət əlavə edilməyib.</p>}
                  {formItems.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50 rounded-xl p-4 flex gap-3 relative">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input type="text" value={item.name} onChange={e => { const n = [...formItems]; n[idx].name = e.target.value; setFormItems(n); }} placeholder="Adı (Məs: Standart Kotec)" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 w-full" />
                        <input type="text" value={item.price} onChange={e => { const n = [...formItems]; n[idx].price = e.target.value; setFormItems(n); }} placeholder="Qiyməti (Məs: 50 ₼)" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 w-full" />
                        <input type="text" value={item.details} onChange={e => { const n = [...formItems]; n[idx].details = e.target.value; setFormItems(n); }} placeholder="Əlavə məlumat (Məs: Günlük kirayə, TV, Wi-Fi)" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 w-full md:col-span-2" />
                      </div>
                      <button type="button" onClick={() => { const n = [...formItems]; n.splice(idx, 1); setFormItems(n); }} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 p-2 rounded-lg self-start transition-colors">
                        <Icons.Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ƏLAQƏ NÖMRƏLƏRİ (CONTACTS) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-teal-100 dark:border-teal-900/30 pb-2">
                  <h3 className="text-sm font-bold text-teal-600 dark:text-teal-400">3. Əlaqə Nömrələri (Opsional)</h3>
                  <button type="button" onClick={() => setFormContacts([...formContacts, { name: "", phone: "" }])} className="text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:hover:bg-teal-800/50 dark:text-teal-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                    <Icons.Plus className="w-3.5 h-3.5" /> Əlavə Et
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formContacts.length === 0 && <p className="text-xs text-slate-400 italic">Əgər ayrıca nömrələr yoxdursa boş buraxa bilərsiniz.</p>}
                  {formContacts.map((contact, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50 rounded-xl p-4 flex gap-3 relative items-center">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input type="text" value={contact.name} onChange={e => { const n = [...formContacts]; n[idx].name = e.target.value; setFormContacts(n); }} placeholder="Bölmə adı (Məs: Rezervasiya)" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 w-full" />
                        <input type="text" value={contact.phone} onChange={e => { const n = [...formContacts]; n[idx].phone = e.target.value; setFormContacts(n); }} placeholder="Nömrə (Məs: +994 50 123 45 67)" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 w-full" />
                      </div>
                      <button type="button" onClick={() => { const n = [...formContacts]; n.splice(idx, 1); setFormContacts(n); }} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 p-2 rounded-lg transition-colors">
                        <Icons.Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </form>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 rounded-b-3xl flex justify-end gap-3 sticky bottom-0 z-10">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-white dark:bg-[#0c2447] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm">
                Ləğv et
              </button>
              <button onClick={handleFormSubmit} disabled={isSaving} className="px-8 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2 text-sm disabled:opacity-70">
                {isSaving ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.Check className="w-4 h-4" />}
                {isSaving ? "Saxlanılır..." : "Yadda Saxla"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
