"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import type { ProfileData, MeasurementData } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [measurements, setMeasurements] = useState<MeasurementData[]>([]);
  const [savingMeasurement, setSavingMeasurement] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [bodyWeight, setBodyWeight] = useState("");
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [biceps, setBiceps] = useState("");
  const [thigh, setThigh] = useState("");

  useEffect(() => {
    api.getProfile().then((p) => {
      setProfile(p);
      setName(p.name || "");
      setAge(p.age ? String(p.age) : "");
      setHeight(p.height ? String(p.height) : "");
      setBodyWeight(p.bodyWeight ? String(p.bodyWeight) : "");
      setChest(p.chest ? String(p.chest) : "");
      setWaist(p.waist ? String(p.waist) : "");
      setHips(p.hips ? String(p.hips) : "");
      setBiceps(p.biceps ? String(p.biceps) : "");
      setThigh(p.thigh ? String(p.thigh) : "");
      setLoading(false);
    }).catch(() => setLoading(false));
    api.getMeasurements().then(setMeasurements).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        name: name || undefined,
        age: age ? parseInt(age) : null,
        height: height ? parseFloat(height) : null,
        bodyWeight: bodyWeight ? parseFloat(bodyWeight) : null,
        chest: chest ? parseFloat(chest) : null,
        waist: waist ? parseFloat(waist) : null,
        hips: hips ? parseFloat(hips) : null,
        biceps: biceps ? parseFloat(biceps) : null,
        thigh: thigh ? parseFloat(thigh) : null,
      };
      await api.updateProfile(data);
      if (name) localStorage.setItem("userName", name);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteAccount();
      localStorage.clear();
      sessionStorage.clear();
      logout();
      router.push("/login");
    } catch {
      alert("Ошибка удаления");
      setDeleting(false);
    }
  };

  const fields = [
    { label: "Возраст", value: age, set: setAge, type: "numeric", placeholder: "Лет" },
    { label: "Рост (см)", value: height, set: setHeight, type: "numeric", placeholder: "см" },
    { label: "Вес (кг)", value: bodyWeight, set: setBodyWeight, type: "numeric", placeholder: "кг" },
    { label: "Обхват груди (см)", value: chest, set: setChest, type: "numeric", placeholder: "см" },
    { label: "Обхват талии (см)", value: waist, set: setWaist, type: "numeric", placeholder: "см" },
    { label: "Обхват бёдер (см)", value: hips, set: setHips, type: "numeric", placeholder: "см" },
    { label: "Обхват бицепса (см)", value: biceps, set: setBiceps, type: "numeric", placeholder: "см" },
    { label: "Обхват бедра (см)", value: thigh, set: setThigh, type: "numeric", placeholder: "см" },
  ];

  if (loading) {
    return <div className="text-center py-16 text-[#b89a6a]">Загрузка...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="relative rounded-xl overflow-hidden mb-6 border border-[#3a3530]/50">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/gym.png')" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1208]/90 via-[#1a1208]/70 to-transparent" />
        <div className="relative p-5">
          <p className="text-[#a83232] font-display text-lg drop-shadow">Личная Грамота</p>
          <p className="text-[#d4bc8e] text-sm mt-1 drop-shadow">{name ? `${name}, Богатырушка` : "Данные о тебе, Богатырь"}</p>
        </div>
      </div>

      {/* Email (readonly) */}
      {profile && (
        <div className="mb-4">
          <p className="text-[#9b7a4a] text-[10px] mb-1">Грамота (эл. почта)</p>
          <p className="text-[#d4bc8e] text-sm">{profile.email}</p>
        </div>
      )}

      {/* Form fields */}
      <div className="space-y-3">
        {fields.map((f) => (
          <div key={f.label}>
            <label className="text-[#9b7a4a] text-[10px] block mb-1">{f.label}</label>
            <input
              type="text"
              inputMode={f.type === "numeric" ? "numeric" : "text"}
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              placeholder={f.placeholder}
              className="w-full bg-[#1a1918]/95 border border-[#3a3530]/50 rounded-xl px-3 py-2.5 text-[#e8dcc8] text-sm focus:border-[#8b2525]/50 focus:outline-none placeholder-[#7a5c35]/50"
            />
          </div>
        ))}
      </div>

      {/* Save button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={async () => {
          setSaving(true);
          try {
            // Сохраняем профиль
            const data = {
              name: name || undefined,
              age: age ? parseInt(age) : null,
              height: height ? parseFloat(height) : null,
              bodyWeight: bodyWeight ? parseFloat(bodyWeight) : null,
              chest: chest ? parseFloat(chest) : null,
              waist: waist ? parseFloat(waist) : null,
              hips: hips ? parseFloat(hips) : null,
              biceps: biceps ? parseFloat(biceps) : null,
              thigh: thigh ? parseFloat(thigh) : null,
            };
            await api.updateProfile(data);
            if (name) localStorage.setItem("userName", name);
            // Записываем замер в историю
            const m = await api.createMeasurement({
              bodyWeight: bodyWeight ? parseFloat(bodyWeight) : null,
              chest: chest ? parseFloat(chest) : null,
              waist: waist ? parseFloat(waist) : null,
              hips: hips ? parseFloat(hips) : null,
              biceps: biceps ? parseFloat(biceps) : null,
              thigh: thigh ? parseFloat(thigh) : null,
            });
            setMeasurements((prev) => [m, ...prev]);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          } catch {
            alert("Ошибка сохранения");
          } finally {
            setSaving(false);
          }
        }}
        disabled={saving}
        className="w-full mt-6 py-3 rounded-xl font-display text-sm bg-[#3a1515] text-[#d4bc8e] border border-[#8b2525]/30 disabled:opacity-50"
      >
        {saving ? "Записываю..." : saved ? "Записано!" : "Записать замеры в историю"}
      </motion.button>

      {/* Measurement history */}
      {measurements.length > 0 && (
        <div className="mt-6 pt-4 border-t border-[#3a3530]/30">
          <h3 className="text-[#a83232] font-display text-sm mb-3">Летопись Замеров</h3>
          <div className="space-y-2">
            {measurements.map((m, idx) => {
              const prev = measurements[idx + 1];
              const date = new Date(m.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
              const diff = (val: number | null, prevVal: number | null) => {
                if (val == null || prevVal == null) return null;
                const d = val - prevVal;
                if (d === 0) return null;
                return d > 0 ? `+${d.toFixed(1)}` : d.toFixed(1);
              };
              const fields = [
                { label: "Вес", val: m.bodyWeight, prevVal: prev?.bodyWeight, unit: "кг" },
                { label: "Грудь", val: m.chest, prevVal: prev?.chest, unit: "см" },
                { label: "Талия", val: m.waist, prevVal: prev?.waist, unit: "см" },
                { label: "Бёдра", val: m.hips, prevVal: prev?.hips, unit: "см" },
                { label: "Бицепс", val: m.biceps, prevVal: prev?.biceps, unit: "см" },
                { label: "Бедро", val: m.thigh, prevVal: prev?.thigh, unit: "см" },
              ];
              return (
                <div key={m.id} className="card-wood rounded-lg p-3 border border-[#3a3530]/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[#b89a6a] text-[10px]">{date}</p>
                    <button
                      onClick={async () => {
                        try {
                          await api.deleteMeasurement(m.id);
                          setMeasurements((prev) => prev.filter((x) => x.id !== m.id));
                        } catch { alert("Ошибка удаления"); }
                      }}
                      className="text-[#8b2525]/40 hover:text-[#c54545] text-[10px] px-1"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {fields.map((f) => f.val != null && (
                      <div key={f.label} className="text-center">
                        <p className="text-[#9b7a4a] text-[8px]">{f.label}</p>
                        <p className="text-[#e8dcc8] text-xs">{f.val} {f.unit}</p>
                        {prev && diff(f.val, f.prevVal) && (
                          <p className={`text-[8px] ${Number(diff(f.val, f.prevVal)) > 0 ? "text-[#5ea352]" : "text-[#c54545]"}`}>
                            {diff(f.val, f.prevVal)} {f.unit}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legal links */}
      <div className="mt-6 pt-4 border-t border-[#3a3530]/30">
        <a href="/about" className="block text-center text-[#b89a6a] text-xs mb-2 hover:text-[#d4bc8e]">
          О приложении &middot; Соглашение &middot; Конфиденциальность
        </a>
      </div>

      {/* Delete account */}
      <div className="mt-6 pt-4 border-t border-[#3a3530]/30">
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full text-center text-[#c54545] text-xs hover:text-[#ff6666] transition-colors"
        >
          Удалить аккаунт
        </button>
        <p className="text-[#7a5c35]/40 text-[8px] text-center mt-1">
          После удаления все данные будут безвозвратно стёрты
        </p>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card-wood rounded-xl p-6 border border-[#8b2525]/30 max-w-sm w-full text-center"
          >
            <img src="/images/bear.png" alt="" className="w-20 h-20 mx-auto mb-4 object-contain" />
            <h3 className="text-[#c54545] font-display text-lg mb-2">Уверен, Богатырь?</h3>
            <p className="text-[#b89a6a] text-sm mb-6">
              Все твои тренировки, подвиги и данные будут удалены навсегда. Этого не отменить.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 rounded-xl text-sm bg-[#2a1f0f] text-[#d4bc8e] border border-[#3a3530]/50"
              >
                Остаться
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 rounded-xl text-sm bg-[#3a1515] text-[#c54545] border border-[#8b2525]/30 disabled:opacity-50"
              >
                {deleting ? "Удаляю..." : "Удалить"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
