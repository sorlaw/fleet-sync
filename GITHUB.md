# FleetSync - Push ke GitHub

## Persiapan

### 1. Buat Repository di GitHub

1. Buka [github.com/new](https://github.com/new)
2. Isi nama repository: `fleetsync`
3. Pilih **Private** (recommended)
4. Jangan centang "Add a README" (sudah ada)
5. Klik **Create repository**

### 2. Update `.gitignore`

Pastikan file `.gitignore` sudah benar:

```gitignore
# dependencies
node_modules/
.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# environment variables
.env
.env.local
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# uploads (user-generated content)
public/uploads/
uploads/

# wa-bot session
wa-bot/.wwebjs_auth/
wa-bot/.wwebjs_cache/
wa-bot/node_modules/
wa-bot/dist/
wa-bot/.env.local
```

### 3. Buat `.env.example`

Buat file template untuk environment variables:

```bash
# Database
DATABASE_URL=postgresql://fleetsync:password@localhost:5432/fleetsync

# Auth
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
TOKEN_SECRET=your-hmac-secret-for-magic-links

# Bot
BOT_URL=http://localhost:3001
BOT_SECRET=your-bot-secret

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Buat `wa-bot/.env.example`

```bash
DATABASE_URL=postgresql://fleetsync:password@localhost:5432/fleetsync
BOT_PORT=3001
BOT_SECRET=your-bot-secret
NEXTJS_APP_URL=http://localhost:3000
```

---

## Push ke GitHub

### Command Git

```bash
# Inisialisasi git (jika belum)
cd /home/sorlawjk/Pictures/fleet-sync
git init

# Tambah semua file
git add .

# Commit pertama
git commit -m "Initial commit: FleetSync v2"

# Tambah remote repository
git remote add origin https://github.com/username/fleetsync.git

# Push ke GitHub
git branch -M main
git push -u origin main
```

### Jika Sudah Ada Repository

```bash
# Pull dulu jika ada perubahan
git pull origin main --allow-unrelated-histories

# Resolve conflict jika ada
# Lalu push
git push origin main
```

---

## Struktur Repository

```
fleetsync/
├── .env.example              ← Template environment
├── .gitignore                ← Git ignore rules
├── README.md                 ← Deskripsi project
├── PRD.md                    ← Product Requirements Document
├── GITHUB.md                 ← Guide ini
├── DEPLOYMENT.md             ← Guide deploy ke VPS
│
├── package.json              ← Dependencies Next.js
├── bun.lock                  ← Lock file
├── tsconfig.json             ← TypeScript config
├── drizzle.config.ts         ← Drizzle ORM config
├── next.config.ts            ← Next.js config
│
├── src/                      ← Source code Next.js
│   ├── app/                  ← App Router
│   ├── components/           ← React components
│   ├── lib/                  ← Utilities
│   └── middleware.ts         ← Auth middleware
│
├── public/                   ← Static files
│   └── uploads/              ← (di-gitignore)
│
└── wa-bot/                   ← WhatsApp Bot
    ├── .env.example          ← Template environment bot
    ├── .gitignore            ← Git ignore rules bot
    ├── package.json          ← Dependencies bot
    ├── index.ts              ← Entry point
    ├── server.ts             ← Express server
    ├── router.ts             ← HTTP routes
    ├── db.ts                 ← Database connection
    ├── utils.ts              ← Utilities
    ├── utils-jid.ts          ← JID resolver
    ├── templates.ts          ← Message templates
    └── handlers/             ← Command handlers
```

---

## Files yang Tidak di-Commit

| File/Folder | Alasan |
|-------------|--------|
| `node_modules/` | Dependencies, install ulang di server |
| `.next/` | Build output, build ulang di server |
| `.env` | Berisi secrets/password |
| `.env.local` | Berisi secrets/password |
| `public/uploads/` | User-generated content, bisa besar |
| `wa-bot/.wwebjs_auth/` | Session WhatsApp, sensitif |
| `wa-bot/.wwebjs_cache/` | Cache WhatsApp |
| `wa-bot/node_modules/` | Dependencies bot |
| `wa-bot/.env.local` | Berisi secrets/password |

---

## Update Repository

### Perubahan Biasa

```bash
git add .
git commit -m "feat: tambah fitur X"
git push origin main
```

### Perubahan pada wa-bot

```bash
git add wa-bot/
git commit -m "feat(wa-bot): tambah command X"
git push origin main
```

### Perubahan pada Database Schema

```bash
git add src/lib/db/schema.ts
git commit -m "feat(db): tambah tabel X"
git push origin main
```

---

## Clone Repository di Server

```bash
cd /var/www
git clone https://github.com/username/fleetsync.git
cd fleetsync

# Install dependencies
bun install
cd wa-bot && bun install && cd ..

# Setup environment
cp .env.example .env
cp wa-bot/.env.example wa-bot/.env.local
nano .env
nano wa-bot/.env.local

# Run migrations
bun run db:push
bun run db:seed

# Build
bun run build
```

---

## Tips

1. **Jangan commit secrets** - Gunakan `.env.example` sebagai template
2. **Gunakan branch** - Buat branch untuk fitur baru, merge ke main
3. **Write meaningful commits** - Jelasin apa yang diubah
4. **Pull sebelum push** - Hindari conflict dengan `git pull --rebase`
5. **Tag releases** - `git tag v1.0.0` untuk versi stabil
