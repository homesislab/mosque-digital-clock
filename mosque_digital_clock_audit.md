# Dokumen Audit & Arsitektur Sistem: Mosque Digital Clock

---

## 1. EXECUTIVE SUMMARY & ARCHITECTURE

**Peran Sistem:**
Repisotori `mosque-digital-clock` merupakan sistem **Digital Signage Masjid Modern** (Smart Mosque) berbasis monorepo (Next.js) yang memfasilitasi dua sisi utama:
1. **Web Client (`apps/web-client`)**: Aplikasi display mandiri yang berjalan di Smart TV atau layar proyektor masjid. Menampilkan informasi real-time seperti Jam, Jadwal Sholat Kemenag, Hitung Mundur Iqamah, Running Text, Slider Pengumuman, dan pemutar audio otomatis (Murottal/Adzan).
2. **Web Admin (`apps/web-admin`)**: Dashboard kontrol terpusat bagi pengurus masjid untuk mengatur konfigurasi tampilan, jadwal otomatisasi, perangkat yang terkoneksi, integrasi WhatsApp (Wabot), serta memonitor status pemutaran audio di client secara *live*.

**High-Level Flow Architecture:**
- **Frontend/Display:** Dibangun dengan Next.js App Router. Perangkat (TV) akan melakukan *polling* konfigurasi ke server setiap 5 detik untuk memastikan tampilan dan jadwal murottal selalu *up-to-date*.
- **Backend & API:** Dikelola pada `/api/*` di `web-admin`. Menyediakan antarmuka REST untuk CRUD konfigurasi JSON, manajemen perangkat, pengunggahan media, dan status *health*.
- **WhatsApp Integration (Wabot):** 
  Sistem ini mengimplementasikan skema **Hibrida**:
  - **Native WA Service:** Menggunakan pustaka `@whiskeysockets/baileys` yang terintegrasi secara internal pada Node.js untuk melakukan *pairing* (QR code) dan mengirimkan notifikasi/pesan *outbound*.
  - **External Wabot API:** Untuk fitur percakapan AI/Chat, sistem melakukan fungsi *Proxy* (`/api/wabot/chat`) ke URL eksternal bot WhatsApp yang (sebelumnya) disiapkan melalui ekosistem n8n/Laravel.
- **Database:** Memanfaatkan **MySQL** (`mysql2`) secara native untuk penyimpanan *state*, *credential* admin, kunci sinkronisasi masjid (*mosque keys*), dan metadata perangkat. Konfigurasi utama masjid direkam dalam payload *JSON Blob* besar di dalam sebuah kolom tabel.

---

## 2. EXISTING FEATURE MATRIX (Daftar Fitur)

### Fitur Fokus Client (Display TV)
| Fitur Utama | Trigger / Penjadwalan | Expected Response / Output Visual | Modul / Komponen Terkait |
| --- | --- | --- | --- |
| **Real-time Clock & Date** | Berjalan terus menerus (*Tick* 1 detik) | Jam digital akurat (dengan *time offset*), tanggal Masehi, Hijriah, dan Pasaran Jawa. | `TimeDisplay.tsx`, `logic.ts` |
| **Auto Prayer Times Grid** | Konfigurasi koordinat / API Kemenag | Kotak informasi Subuh, Dzuhur, dsb., dengan sorotan (*highlight*) waktu sholat berikutnya. | `PrayerTimes.tsx` |
| **Automated Murottal Player** | Sesuai konfigurasi *playlist* & Waktu Sholat Terdekat | Pemutaran playlist MP3 di *background* dengan indikator visual *Live Client Playback*. | `AudioPlayer.tsx`, `music` |
| **Iqamah & Adzan Countdown** | Memasuki rentang waktu transisi sholat | *Overlay* layar penuh (*blank screen* dengan detail Waktu Adzan / Iqamah dalam detikan mundur). | `IqamahOverlay.tsx`, `AdzanOverlay.tsx` |
| **Running Text** | Terus menerus (Berulang) | Menarik *array* pesan dari config, ditampilkan bergerak di *footer*. | `RunningText.tsx` |
| **Information Slider** | Terus menerus (Di latar belakang) | Karosel responsif memutar daftar URL gambar dari konfigurasi. | `InfoSlider.tsx` |

### Fitur Fokus Admin (Dashboard Web)
| Fitur Utama | Modul / View Terkait | Fungsi |
| --- | --- | --- |
| **Live Remote Control** | `DashboardOverview` | Mengawasi dan memutus/memutar (*play/pause*) audio di Client secara *Real-Time*. |
| **Identity & Configurator** | `IdentitySection` | Penyetelan alamat, nama, dan laporan Saldo Kas Ringkas (Pemasukan/Pengeluaran). |
| **Media & File Manager** | `MediaPickerModal`, `Playlist` | Mengunggah dan memilih Audio Adzan, Murottal, serta aset visual Slider (*Local Media*). |
| **Device Manager** | `DevicesSection` | Memantau TV mana saja yang sedang terhubung (*Online/Offline*) & *Last Seen*. |

---

## 3. API & WEBHOOK ENDPOINT DIRECTORY

Daftar *endpoint* krusial yang digunakan oleh sistem (utamanya terpusat pada aplikasi `web-admin`):

### Wabot & Integrasi Eksternal
| Method | Path | Kegunaan | Required Params / Payload |
| --- | --- | --- | --- |
| **POST** | `/api/wabot/chat` | Proxy komunikasi ke *Engine AI* (N8N/Laravel) atau Wabot eksternal. | `JSON: { apiUrl, token, message, systemInstruction }` |
| **POST** | `/api/wa/reset` | Mereset dan menghapus folder session *(Logout Baileys)* Wabot. | `Query: ?key={mosqueKey}` |
| **GET** | `/api/wa/status` | Mengecek status koneksi native Bot WhatsApp dan *fetching* kode QR. | `Query: ?key={mosqueKey}` |
| **GET** | `/api/wabot/auth/groups`| Mengambil daftar Group WhatsApp yang diikuti Bot via Baileys. | `Query: ?key={mosqueKey}` |

### Konfigurasi & Manajerial Display
| Method | Path | Kegunaan | Required Params / Payload |
| --- | --- | --- | --- |
| **GET** | `/api/config` | *Polling* konfigurasi UI, Jadwal, Media untuk TV. | `Query: ?key={mosqueKey}` |
| **POST** | `/api/config` | Menyimpan perubahan konfigurasi dari Dashboard. | `Body JSON: { MosqueConfig }` |
| **GET** | `/api/audio/active-status`| *Polling* *Remote Control* melihat durasi & track MP3 di TV. | `Query: ?key={mosqueKey}` |
| **POST** | `/api/upload` | Titik unggah (*multipart/form-data*) aset untuk Banner Slider & MP3. | `FormData: { file: File }` |
| **POST** | `/api/devices` | Pendaftaran dan *Ping Heartbeat* status Smart TV ('active'). | `JSON: { action: 'ping/register', device_name... }` |

---

## 4. DATABASE INTERACTION & DEPENDENCIES

Sistem ini berinteraksi langsung menggunakan **Kueri Teks Netral MySQL** (melalui layer `mysql2` pada `lib/db.ts`) ke skema database bernomenklatur `mosque-digitaldb`. 

**Daftar Tabel (Berdasarkan `schema.sql`):**
1. **`users`**: Tabel admin pengelola.
2. **`mosque_keys`**: Tabel *Mapping*, berelasi ke `users`. Menyimpan kunci sinkronisasi rahasia (misal: *'default'*).
3. **`mosque_configs`**: **Tabel Paling Sentral!** Kolom `config_json` bertipe `LONGTEXT` menyimpan keseluruhan denah aplikasi masjid. (Ini termasuk info kas, jadwal mp3, offset iqamah, pengaturan running text, url slider — *semuanya direpresentasikan sebagai BLOB document*).
4. **`devices`**: Untuk manajemen dan keamanan akses perangkat penerima (Display TV).

---

## 5. FUTURE-PROOFING & MAINTENANCE NOTES

Timely audit terhadap arsitektur menemukan beberapa wilayah kunci (Technical Debt & Saran Skalabilitas) untuk pemeliharaan sistem di masa mendatang:

**1. Potensi Bottleneck pada arsitektur Polling & JSON Blob:**
- **Masalah:** TV (Client) rutin melakukan HTTP Polling `/api/config` dan `/api/audio/...` setiap **5 Detik** (`setInterval` murni). Seiring bertambahnya jumlah cabang masjid atau *device TV*, trafik HTTP dan kueri koneksi ke MySQL untuk membaca record *LONGTEXT BLOB* akan meroket secara masif dan berpotensi menghabiskan sumber daya koneksi DB.
- **Solusi/Saran:** Segera migrasi mekanisme *fetching* *client-config* menggunakan **WebSocket** (Socket.io) atau **Server-Sent Events (SSE)** agar perubahan dipancarkan secara *Push* hanya saat admin menyimpan, bukan dihujani permintaan setiap 5 detik. Atau minimal distribusikan via Layer Cache seperti Redis.

**2. Infrastruktur Baileys / Wabot Hibrida:**
- **Masalah:** Modul `wa-service.ts` dideklarasikan internal menggunakan instance *Global Memory Object* Node.js, rentan terbunuh atau termutlisetup dalam fase deployment Next.js pada platform *serverless/Edge* (seperti Vercel atau AWS Lambda) atau bila di *scale/cluster* di PM2.
- **Solusi/Saran:** Segmentsikan layanan *WhatsApp/Cron Notification Worker* menjadi *microservice docker* berbasis Express.js terpisah yang melakukan sinkronisasi dengan database secara mandiri dan konstan, tidak disatukan di dalam antarmuka Next.js API Routes.

**3. Skema Data Relasional vs NoSQL Anti-Pattern:**
- Menyimpan struktur data masif seperti "Laporan Keuangan/Ledger", "Daftar MP3 Playlist", dan "Jadwal Lengkap Adzan" di dalam **satu gumpalan teks String JSON** (`mosque_configs`) adalah *anti-pattern* pada RDMS MySQL. Sebaiknya: pecahan struktur kas *Finance Tracking* dan *Device Playlist Murottal* dibentuk di tabel relasional mandiri guna kehandalan *indexing* dan filter tanggal.

**4. Standarisasi Penamaan (*Naming Convention*):**
- Agar seragam, kedepannya rutr integrasi API eksternal disarankan mengikuti `api/integrations/whatsapp` daripada terpecah antara `api/wa/` (Baileys) dan `api/wabot/` (Proxy Chat).
