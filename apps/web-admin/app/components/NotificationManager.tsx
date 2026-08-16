'use client';

import { Bell, Clock3, MessageSquareText, Pencil, Plus, Trash2, X, WandSparkles } from 'lucide-react';
import { MosqueConfig } from '@mosque-digital-clock/shared-types';

type CustomNotification = NonNullable<NonNullable<MosqueConfig['wabot']>['customNotifications']>[number];

type Props = {
  config: MosqueConfig;
  setConfig: (config: MosqueConfig) => void;
  targets?: { id: string; name: string }[];
};

const prayerLabels: Record<string, string> = {
  subuh: 'Subuh', dzuhur: 'Dzuhur', ashar: 'Ashar',
  maghrib: 'Maghrib', isya: 'Isya', jumat: 'Jumat',
};
const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const templates: [string, string, string][] = [
  ['adzan', 'Adzan', 'Waktu {sholat} telah tiba. Mari laksanakan sholat berjamaah.'],
  ['reminder', 'Reminder', 'Pengingat: waktu {sholat} akan tiba pukul {jam}. Mari bersiap.'],
  ['kajian', 'Kajian', 'Kajian akan dimulai pukul {jam}. Mari hadir dan semoga bermanfaat.'],
  ['jumat', 'Jumat', 'Mari persiapkan diri untuk Sholat Jumat. Khutbah dimulai pukul {jam}.'],
];

type Schedule = NonNullable<CustomNotification['schedules']>[number];

// Normalize legacy single-schedule notifications into schedules[]
const getSchedules = (item: CustomNotification): Schedule[] => {
  if (item.schedules && item.schedules.length > 0) return item.schedules;
  return [{ type: item.type || 'fixed', time: item.time, prayer: item.prayer, offsetMinutes: item.offsetMinutes }];
};

const describeSchedule = (s: Schedule): string =>
  s.type === 'fixed'
    ? `Pukul ${s.time || '--:--'}`
    : `${prayerLabels[s.prayer || 'subuh'] || 'Sholat'} ${s.offsetMinutes && s.offsetMinutes > 0 ? '+' : ''}${s.offsetMinutes || 0}m`;

const createNotification = (): CustomNotification => ({
  id: `notif_${Date.now()}`,
  enabled: true,
  message: '',
  type: 'fixed',
  time: '08:00',
  days: [0, 1, 2, 3, 4, 5, 6],
  schedules: [{ type: 'fixed', time: '08:00' }],
});

export default function NotificationManager({ config, setConfig, targets = [] }: Props) {
  const notifications = config.wabot?.customNotifications || [];
  const update = (next: CustomNotification[]) => setConfig({ ...config, wabot: { ...(config.wabot || { enabled: false, targetNumber: '' }), customNotifications: next } });
  const patch = (index: number, values: Partial<CustomNotification>) => update(notifications.map((item, i) => i === index ? { ...item, ...values } : item));
  const add = () => update([...notifications, createNotification()]);

  return (
    <section className="border-t border-slate-100 pt-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 text-slate-800">
            <Bell size={17} className="text-indigo-500" />
            <h5 className="text-sm font-bold">Daftar Notifikasi</h5>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">{notifications.length}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Setiap notifikasi bisa memiliki beberapa jadwal sekaligus.</p>
        </div>
        <button onClick={add} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700">
          <Plus size={15} /> Tambah
        </button>
      </div>

      {notifications.length === 0 ? (
        <button onClick={add} className="w-full rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 p-8 text-center transition hover:bg-indigo-50">
          <Bell size={24} className="mx-auto mb-2 text-indigo-400" />
          <p className="text-xs font-bold text-slate-700">Belum ada notifikasi</p>
          <p className="mt-1 text-[10px] text-slate-500">Klik untuk membuat notifikasi pertama.</p>
        </button>
      ) : (
        <div className="space-y-2">
          {notifications.map((item, index) => <NotificationRow key={item.id || index} item={item} index={index} targets={targets} fallbackTarget={config.wabot?.targetNumber || ''} patch={patch} remove={() => update(notifications.filter((_, i) => i !== index))} />)}
        </div>
      )}
    </section>
  );
}

function NotificationRow({ item, index, targets, fallbackTarget, patch, remove }: {
  item: CustomNotification;
  index: number;
  targets: { id: string; name: string }[];
  fallbackTarget: string;
  patch: (index: number, values: Partial<CustomNotification>) => void;
  remove: () => void;
}) {
  const schedules = getSchedules(item);
  const setSchedules = (next: Schedule[]) => patch(index, { schedules: next });
  const patchSchedule = (i: number, values: Partial<Schedule>) => setSchedules(schedules.map((s, si) => si === i ? { ...s, ...values } : s));
  const addSchedule = () => setSchedules([...schedules, { type: 'fixed', time: '08:00' }]);
  const removeSchedule = (i: number) => setSchedules(schedules.filter((_, si) => si !== i));

  const summary = schedules.map(describeSchedule).join(' • ');

  return (
    <details className={`group rounded-xl border transition ${item.enabled ? 'border-indigo-200 bg-white' : 'border-slate-200 bg-slate-50'}`}>
      <summary className="flex cursor-pointer list-none items-center gap-3 p-3 [&::-webkit-details-marker]:hidden">
        <span className={`h-2.5 w-2.5 rounded-full ${item.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        <div className="min-w-0 flex-1">
          <p className={`truncate text-xs font-bold ${item.enabled ? 'text-slate-800' : 'text-slate-400'}`}>{item.message || 'Notifikasi baru'}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-slate-500"><Clock3 size={11} /> {summary}</p>
        </div>
        <span className="hidden text-[10px] font-bold uppercase tracking-wider text-indigo-500 group-open:inline">Edit</span>
        <Pencil size={14} className="text-slate-400 group-open:hidden" />
        <button type="button" onClick={(event) => { event.preventDefault(); remove(); }} className="rounded-md p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500" title="Hapus"><Trash2 size={15} /></button>
      </summary>

      <div className="space-y-4 border-t border-indigo-100 bg-indigo-50/30 p-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <input type="checkbox" checked={item.enabled} onChange={(e) => patch(index, { enabled: e.target.checked })} className="h-4 w-4 accent-indigo-600" /> Aktifkan notifikasi
          </label>
          <span className="text-[10px] text-slate-400">Tersimpan saat klik Simpan Konfigurasi</span>
        </div>

        <label className="block">
          <span className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500"><MessageSquareText size={12} /> Pesan notifikasi</span>
          <textarea value={item.message} onChange={(e) => patch(index, { message: e.target.value })} placeholder="Tulis pesan atau gunakan generator template" className="min-h-[76px] w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
        </label>

        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-indigo-100 bg-white p-2">
          <WandSparkles size={14} className="text-indigo-500" />
          <span className="text-[10px] font-bold text-slate-500">Generate template:</span>
          {templates.map(([key, label, text]) => (
            <button key={key} type="button" onClick={() => patch(index, { message: text })} className="rounded-md bg-indigo-50 px-2 py-1.5 text-[10px] font-semibold text-indigo-600 transition hover:bg-indigo-100">{label}</button>
          ))}
        </div>

        <label className="block">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">WhatsApp tujuan</span>
          <select value={item.targetNumber || fallbackTarget} onChange={(e) => patch(index, { targetNumber: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-400">
            <option value="">Pilih nomor atau grup</option>
            {fallbackTarget && !targets.some((target) => target.id === fallbackTarget) && <option value={fallbackTarget}>Target saat ini ({fallbackTarget})</option>}
            {targets.map((target) => <option key={target.id} value={target.id}>{target.name} — {target.id}</option>)}
          </select>
          {!targets.length && <span className="mt-1 block text-[10px] text-amber-600">Hubungkan WhatsApp untuk memuat daftar grup.</span>}
        </label>

        {/* ── Multi Schedule ── */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Jadwal ({schedules.length})</span>
            <button type="button" onClick={addSchedule} className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-[10px] font-bold text-white transition hover:bg-indigo-700"><Plus size={12} /> Tambah Jadwal</button>
          </div>
          <div className="space-y-2">
            {schedules.map((sched, si) => (
              <div key={si} className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-2.5">
                <label className="flex-1 min-w-[110px]">
                  <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-400">Tipe</span>
                  <select value={sched.type} onChange={(e) => patchSchedule(si, { type: e.target.value as Schedule['type'] })} className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] outline-none focus:border-indigo-400">
                    <option value="fixed">Jam tetap</option>
                    <option value="prayer_relative">Relatif sholat</option>
                  </select>
                </label>
                {sched.type === 'fixed' ? (
                  <label className="flex-1 min-w-[100px]">
                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-400">Waktu</span>
                    <input type="time" value={sched.time || ''} onChange={(e) => patchSchedule(si, { time: e.target.value })} className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] outline-none focus:border-indigo-400" />
                  </label>
                ) : (
                  <>
                    <label className="flex-1 min-w-[90px]">
                      <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-400">Sholat</span>
                      <select value={sched.prayer || 'subuh'} onChange={(e) => patchSchedule(si, { prayer: e.target.value })} className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] outline-none focus:border-indigo-400">
                        {Object.entries(prayerLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                    <label className="w-20">
                      <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-400">Offset</span>
                      <input type="number" value={sched.offsetMinutes ?? 0} onChange={(e) => patchSchedule(si, { offsetMinutes: Number(e.target.value) || 0 })} className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] outline-none focus:border-indigo-400" />
                    </label>
                  </>
                )}
                <button type="button" onClick={() => removeSchedule(si)} disabled={schedules.length <= 1} className="rounded-md p-2 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-300" title="Hapus jadwal"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Hari aktif</span>
          <div className="flex flex-wrap gap-2">
            {days.map((day, dayIndex) => (
              <label key={day} className="flex cursor-pointer items-center gap-1 rounded-md bg-white px-2 py-1.5 text-[10px] text-slate-600">
                <input type="checkbox" checked={!item.days || item.days.includes(dayIndex)} onChange={(e) => {
                  const current = item.days ? [...item.days] : [0, 1, 2, 3, 4, 5, 6];
                  patch(index, { days: e.target.checked ? [...new Set([...current, dayIndex])] : current.filter((value) => value !== dayIndex) });
                }} className="h-3 w-3 accent-indigo-600" />
                {day}
              </label>
            ))}
          </div>
        </div>

        <button type="button" onClick={remove} className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:text-rose-700"><X size={13} /> Hapus notifikasi ini</button>
      </div>
    </details>
  );
}
