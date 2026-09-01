# PRD: FleetSync v2 — Self-Hosted Fleet Management System

## 1. Overview

**FleetSync v2** adalah sistem manajemen armada kendaraan perusahaan yang di-deploy sepenuhnya di VPS sendiri (self-hosted), tanpa dependency ke layanan BaaS pihak ketiga seperti Supabase.

**Tujuan migrasi:**
- Full kontrol atas database, auth, dan file storage
- Tidak tergantung layanan eksternal (Supabase)
- Semua berjalan di satu VPS: Next.js, PostgreSQL, WA Bot

---

## 2. Tech Stack

| Layer | Technology | Alasan |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Sama seperti project asli |
| **Language** | TypeScript | Type safety |
| **Database** | PostgreSQL 16 (self-hosted di VPS) | Relational, robust, gratis |
| **ORM** | Drizzle ORM | Ringan, type-safe, SQL-like syntax |
| **Auth** | Custom JWT + bcrypt | Simpel, cocok untuk 2 role (admin/driver), admin buat akun driver |
| **Session** | HTTP-only cookies | Secure, SSR-friendly |
| **File Storage** | Local filesystem (VPS) | Simpel, serve via Next.js `/public` atau route handler |
| **WA Bot** | whatsapp-web.js + Express | Sama seperti project asli |
| **Process Manager** | PM2 | Auto-restart, boot startup |
| **Reverse Proxy** | Nginx | SSL termination, proxy ke Next.js & WA Bot |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      VPS (Ubuntu)                        │
│                                                          │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐ │
│  │   Nginx      │   │  Next.js     │   │  WA Bot      │ │
│  │   :80/:443   │──▶│  :3000       │   │  :3001       │ │
│  │   (reverse   │   │  (PM2)       │   │  (PM2)       │ │
│  │    proxy)    │   │              │   │              │ │
│  └──────────────┘   └──────┬───────┘   └──────┬───────┘ │
│                            │                   │         │
│                            ▼                   ▼         │
│                     ┌──────────────┐                    │
│                     │  PostgreSQL  │                    │
│                     │  :5432       │                    │
│                     │  (local)     │                    │
│                     └──────────────┘                    │
│                                                          │
│  ┌──────────────┐                                       │
│  │  /uploads    │  ← Local file storage                 │
│  │  (photos)    │                                       │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Features (Fitur Inti)

### 4.1 Authentication & Authorization
- **Login**: Email + password (bcrypt hashed)
- **Roles**: `admin` dan `driver`
- **Admin** bisa buat/hapus akun driver
- **Driver** tidak bisa registrasi sendiri
- **Session**: JWT disimpan di HTTP-only cookie, expire 7 hari
- **Middleware**: Protect semua route `/app/*`, redirect ke `/login` jika belum login
- **Role-based access**: Admin lihat semua, driver hanya data miliknya

### 4.2 Dashboard
- **Admin view**: Statistik (total kendaraan, kendaraan aktif, maintenance, trip aktif), chart penggunaan kendaraan, tabel trip terbaru
- **Driver view**: Trip miliknya sendiri, status trip

### 4.3 Vehicle Management (Admin only)
- CRUD kendaraan (license plate, make/model, status, foto, odometer)
- Status: `available`, `in_use`, `maintenance`
- Upload foto kendaraan (simpan di local filesystem)

### 4.4 Trip Management
- **Create trip**: Admin buat trip, atau driver booking via WhatsApp
- **Trip flow**: `pending` → `approved` → `in_progress` → `returned` → `completed`
- **Reject**: Admin bisa reject trip `pending`
- **Start trip**: Driver foto inspeksi 4 sisi (depan, belakang, kiri, kanan), submit → status jadi `in_progress`
- **Return trip**: Driver foto inspeksi akhir 4 sisi, isi odometer akhir → status jadi `returned`
- **Complete**: Admin finalize trip

### 4.5 Dispatch Pages (Public, tanpa auth)
- **Start trip page**: Diakses via magic link dari WhatsApp, driver foto 4 sisi kendaraan sebelum berangkat
- **Return trip page**: Diakses via magic link, driver foto 4 sisi kendaraan setelah kembali
- **Token**: HMAC-based, expire 24 jam, single-use
- **Foto**: Upload ke local filesystem, compress client-side sebelum upload

### 4.6 WhatsApp Bot
- **Commands**:
  - `booking [kendaraan] [waktu] ke [tujuan]` → buat trip pending
  - `available` / `mobil` → list kendaraan tersedia
  - `help` / `menu` → tampilkan bantuan
- **Outbound**: Next.js server action → HTTP POST ke bot `/send`
- **Auth**: Shared secret (`x-bot-secret` header)
- **Notify admin**: Kirim WA ke semua admin saat ada booking baru

---

## 5. Database Schema (Drizzle ORM)

### Tables

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'driver')),
  phone_number VARCHAR(20),
  avatar_url TEXT,
  license_number VARCHAR(50),
  address TEXT,
  status VARCHAR(20) DEFAULT 'available',  -- available, busy
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `vehicles`
```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate VARCHAR(20) UNIQUE NOT NULL,
  make_model VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'available',  -- available, in_use, maintenance
  image_url TEXT,
  current_odometer INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `trips`
```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES users(id),
  vehicle_id UUID REFERENCES vehicles(id),
  purpose TEXT,
  status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, in_progress, returned, completed, rejected
  dispatch_notes TEXT,
  image_url JSONB,  -- { front, rear, left, right } for start trip
  start_mileage INTEGER,
  end_mileage INTEGER,
  return_image_url JSONB,  -- { front, rear, left, right } for return trip
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `inspections`
```sql
CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id),
  inspection_type VARCHAR(20) NOT NULL,  -- pickup, return
  front_photo_url TEXT,
  rear_photo_url TEXT,
  left_photo_url TEXT,
  right_photo_url TEXT,
  driver_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 6. Auth System Detail

### Flow Login
```
1. User submit email + password di /login
2. Server action: query user by email dari DB
3. bcrypt.compare(password, user.password_hash)
4. Jika match: generate JWT { userId, email, role, exp }
5. Set HTTP-only cookie: session_token=<jwt>
6. Redirect ke /dashboard
```

### Flow Logout
```
1. User klik logout
2. Delete cookie session_token
3. Redirect ke /login
```

### Flow Protect Route (Middleware)
```
1. Setiap request ke /app/* cek cookie session_token
2. Jika tidak ada / expired → redirect /login
3. Jika ada: verify JWT, inject userId & role ke request context
4. Lanjut ke page
```

### JWT Payload
```typescript
{
  userId: string;    // UUID user
  email: string;
  role: 'admin' | 'driver';
  exp: number;       // Unix timestamp, 7 hari dari login
}
```

### Admin Create Driver Flow
```
1. Admin buka halaman /app/users (khusus admin)
2. Isi form: email, password, full_name, phone_number
3. Server action: bcrypt.hash(password), INSERT ke users table
4. Driver bisa langsung login dengan email & password tersebut
```

---

## 7. File Storage

### Struktur Folder
```
/uploads/
  /vehicles/          ← Foto kendaraan
    {timestamp}-{uuid}.webp
  /inspections/       ← Foto inspeksi trip
    trip-{tripId}-before-{side}-{timestamp}.webp
    trip-{tripId}-after-{side}-{timestamp}.webp
```

### Upload Flow
```
1. Client-side: compress image (max 1200px, quality 0.8) → WebP
2. FormData upload ke server action / API route
3. Server: simpan ke /uploads/{category}/
4. Simpan path relatif ke database (bukan full URL)
5. Serve via Nginx: /uploads/ → /var/www/fleetsync/uploads/
```

### Nginx Config untuk Static Files
```nginx
location /uploads/ {
    alias /var/www/fleetsync/uploads/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

---

## 8. WA Bot Changes

### Perubahan dari Supabase ke PostgreSQL
- Ganti `@supabase/supabase-js` dengan `pg` (node-postgres)
- Query langsung ke PostgreSQL (koneksi lokal)
- Tidak perlu service role key lagi (langsung akses DB)

### Koneksi
```typescript
import { Pool } from 'pg';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL  // postgresql://user:pass@localhost:5432/fleetsync
});
```

### Env Variables WA Bot
```env
DATABASE_URL=postgresql://fleetsync:password@localhost:5432/fleetsync
BOT_PORT=3001
BOT_SECRET=your-bot-secret
NEXTJS_APP_URL=https://your-domain.com
WA_ADMIN_NUMBER=628123456789@c.us
```

---

## 9. Environment Variables

### Next.js App (.env)
```env
# Database
DATABASE_URL=postgresql://fleetsync:password@localhost:5432/fleetsync

# Auth
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
TOKEN_SECRET=your-hmac-secret-for-magic-links

# Bot
BOT_URL=http://localhost:3001
BOT_SECRET=your-bot-secret

# App
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### WA Bot (.env.local)
```env
DATABASE_URL=postgresql://fleetsync:password@localhost:5432/fleetsync
BOT_PORT=3001
BOT_SECRET=your-bot-secret
NEXTJS_APP_URL=https://your-domain.com
WA_ADMIN_NUMBER=628123456789@c.us
```

---

## 10. Project Structure

```
/fleetsync-v2/
├── package.json
├── drizzle.config.ts
├── .env
├── nginx.conf                    ← Nginx config template
├── ecosystem.config.js           ← PM2 config
│
├── drizzle/
│   └── migrations/               ← Auto-generated migrations
│
├── src/
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts          ← Drizzle client
│   │   │   ├── schema.ts         ← Drizzle schema (all tables)
│   │   │   └── seed.ts           ← Seed data (admin user)
│   │   ├── auth/
│   │   │   ├── jwt.ts            ← JWT sign/verify
│   │   │   ├── password.ts       ← bcrypt hash/compare
│   │   │   └── session.ts        ← Cookie get/set/delete
│   │   ├── crypto.ts             ← HMAC magic link tokens
│   │   ├── upload.ts             ← File upload handler
│   │   └── whatsapp.ts           ← HTTP client ke WA Bot
│   │
│   ├── middleware.ts             ← Auth middleware (protect routes)
│   │
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              ← Redirect ke /dashboard
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── dispatch/
│   │   │   ├── actions.ts
│   │   │   ├── [token]/
│   │   │   │   └── page.tsx      ← Start trip photo page
│   │   │   └── return/[token]/
│   │   │       └── page.tsx      ← Return trip photo page
│   │   └── (app)/
│   │       ├── layout.tsx        ← Auth guard + sidebar
│   │       ├── ClientLayout.tsx
│   │       ├── dashboard/
│   │       │   └── page.tsx
│   │       ├── vehicles/
│   │       │   ├── page.tsx
│   │       │   ├── actions.ts
│   │       │   └── components/
│   │       ├── trips/
│   │       │   ├── page.tsx
│   │       │   ├── actions.ts
│   │       │   └── components/
│   │       └── users/            ← Admin only: manage drivers
│   │           ├── page.tsx
│   │           ├── actions.ts
│   │           └── components/
│   │
│   └── api/
│       └── upload/
│           └── route.ts          ← API route untuk file upload
│
├── uploads/                      ← Local file storage (gitignored)
│   ├── vehicles/
│   └── inspections/
│
└── wa-bot/
    ├── package.json
    ├── index.ts
    ├── server.ts
    ├── router.ts
    ├── db.ts                     ← PostgreSQL connection (pg)
    ├── templates.ts
    ├── utils.ts
    └── handlers/
        ├── booking.ts
        ├── available.ts
        └── help.ts
```

---

## 11. Deployment Steps (VPS)

### 11.1 Server Setup
```bash
# Install dependencies
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx postgresql postgresql-contrib git

# Install Puppeteer dependencies (untuk WA Bot)
sudo apt install -y libxshmfence-dev libgbm-dev wget unzip fontconfig locales \
  gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \
  libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 \
  libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 \
  libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 \
  libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation \
  libappindicator1 libnss3 lsb-release xdg-utils
```

### 11.2 PostgreSQL Setup
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql

sudo -u postgres psql
CREATE DATABASE fleetsync;
CREATE USER fleetsync WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE fleetsync TO fleetsync;
\q
```

### 11.3 Deploy App
```bash
cd /var/www
git clone https://github.com/your-repo/fleetsync-v2.git
cd fleetsync-v2

# Install dependencies
npm install
cd wa-bot && npm install && cd ..

# Setup .env
cp .env.example .env
nano .env  # isi semua env variables

# Run migrations
npx drizzle-kit push

# Seed admin user
npx tsx src/lib/db/seed.ts

# Build Next.js
npm run build
```

### 11.4 PM2 Setup
```bash
sudo npm install -g pm2

# Start Next.js
pm2 start ecosystem.config.js

# Start WA Bot
cd wa-bot
pm2 start "npx ts-node index.ts" --name wa-bot
cd ..

# Auto-start on boot
pm2 save
pm2 startup
```

### 11.5 Nginx Config
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WA Bot (hanya untuk internal, bisa di-secure dengan secret)
    location /bot/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Static file uploads
    location /uploads/ {
        alias /var/www/fleetsync-v2/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 11.6 SSL (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 12. Migration Checklist (dari fleet-sync v1)

| # | Task | Status |
|---|---|---|
| 1 | Setup PostgreSQL di VPS, buat database & user | ⬜ |
| 2 | Buat Drizzle schema (users, vehicles, trips, inspections) | ⬜ |
| 3 | Implement auth system (JWT + bcrypt + middleware) | ⬜ |
| 4 | Implement file upload (local filesystem) | ⬜ |
| 5 | Migrate dashboard page (ganti Supabase query → Drizzle) | ⬜ |
| 6 | Migrate vehicles CRUD (ganti Supabase → Drizzle) | ⬜ |
| 7 | Migrate trips management (ganti Supabase → Drizzle) | ⬜ |
| 8 | Migrate dispatch pages (ganti Supabase → Drizzle + local upload) | ⬜ |
| 9 | Migrate WA Bot (ganti Supabase client → pg) | ⬜ |
| 10 | Setup Nginx reverse proxy + SSL | ⬜ |
| 11 | Setup PM2 untuk auto-restart | ⬜ |
| 12 | Testing end-to-end semua flow | ⬜ |
| 13 | Seed data (admin user pertama) | ⬜ |

---

## 13. Key Differences dari v1

| Aspect | v1 (Supabase) | v2 (Self-hosted) |
|---|---|---|
| Database | Supabase (cloud) | PostgreSQL di VPS |
| Auth | Supabase Auth | Custom JWT + bcrypt |
| File Storage | Supabase Storage | Local filesystem |
| ORM/Query | Supabase client | Drizzle ORM |
| RLS | Supabase RLS | Application-level auth check |
| Session | Supabase cookie | HTTP-only JWT cookie |
| WA Bot DB | Supabase client | node-postgres (pg) |
| Hosting | Vercel + VPS | Semua di VPS |
