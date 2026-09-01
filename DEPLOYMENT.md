# FleetSync - Deploy ke VPS

## Server Requirements

| Komponen | Minimum | Recommended |
|----------|---------|-------------|
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 GB | 2 GB |
| Storage | 20 GB | 50 GB |
| Port | 80, 443 | 80, 443 |

---

## Step 1: Install Dependencies

### Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

### Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Install PM2

```bash
sudo npm install -g pm2
```

### Install Git

```bash
sudo apt install -y git
```

---

## Step 2: Setup PostgreSQL

### Buat Database dan User

```bash
sudo -u postgres psql
```

Di dalam PostgreSQL shell:

```sql
CREATE DATABASE fleetsync;
CREATE USER fleetsync WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE fleetsync TO fleetsync;
\q
```

### Test Koneksi

```bash
PGPASSWORD=your_secure_password_here psql -U fleetsync -d fleetsync -h localhost -c "SELECT 1;"
```

---

## Step 3: Deploy Application

### Clone Repository

```bash
cd /var/www
sudo mkdir -p fleetsync
sudo chown $USER:$USER fleetsync
git clone https://github.com/username/fleetsync.git .
```

### Install Dependencies

```bash
# Install dependencies Next.js
bun install

# Install dependencies WA Bot
cd wa-bot && bun install && cd ..
```

### Setup Environment Variables

```bash
# Copy template
cp .env.example .env
cp wa-bot/.env.example wa-bot/.env.local

# Edit file .env
nano .env
```

Isi `.env`:

```env
# Database
DATABASE_URL=postgresql://fleetsync:your_secure_password_here@localhost:5432/fleetsync

# Auth (generate random string minimal 32 karakter)
JWT_SECRET=your_random_secret_key_here_min_32_chars
TOKEN_SECRET=your_hmac_secret_here

# Bot
BOT_URL=http://localhost:3001
BOT_SECRET=your_bot_secret_here

# App (gunakan IP VPS)
NEXT_PUBLIC_SITE_URL=http://YOUR_VPS_IP
```

Isi `wa-bot/.env.local`:

```env
DATABASE_URL=postgresql://fleetsync:your_secure_password_here@localhost:5432/fleetsync
BOT_PORT=3001
BOT_SECRET=your_bot_secret_here
NEXTJS_APP_URL=http://YOUR_VPS_IP
```

### Generate Secrets

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate TOKEN_SECRET
openssl rand -base64 32

# Generate BOT_SECRET
openssl rand -base64 16
```

### Run Database Migrations

```bash
bun run db:push
```

### Seed Admin User

```bash
bun run db:seed
```

Output:
```
Admin user created:
  Email: admin@fleetsync.com
  Password: admin123
  Role: admin
```

### Build Application

```bash
bun run build
```

---

## Step 4: Setup PM2

### Buat `ecosystem.config.js`

```bash
nano ecosystem.config.js
```

Isi:

```javascript
module.exports = {
  apps: [
    {
      name: 'fleetsync',
      script: 'bun',
      args: 'run start',
      cwd: '/var/www/fleetsync',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
    {
      name: 'wa-bot',
      script: 'bun',
      args: 'run index.ts',
      cwd: '/var/www/fleetsync/wa-bot',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
    },
  ],
};
```

### Start dengan PM2

```bash
pm2 start ecosystem.config.js
```

### Save dan Auto-Start

```bash
pm2 save
pm2 startup
```

### Cek Status

```bash
pm2 status
pm2 logs
```

---

## Step 5: Setup Nginx

### Buat Config

```bash
sudo nano /etc/nginx/sites-available/fleetsync
```

Isi:

```nginx
server {
    listen 80;
    server_name YOUR_VPS_IP;

    # Next.js App
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WA Bot API (internal only)
    location /bot/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static uploads
    location /uploads/ {
        alias /var/www/fleetsync/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Increase upload size limit
    client_max_body_size 50M;
}
```

### Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/fleetsync /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
```

### Test dan Restart Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 6: Setup Firewall

```bash
# Allow SSH
sudo ufw allow ssh

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS (jika pakai SSL)
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

---

## Step 7: WhatsApp Bot Setup

### Scan QR Code

```bash
# Cek log bot untuk QR code
pm2 logs wa-bot
```

Akan muncul:
```
=== SCAN QR CODE DI BAWAH INI ===

[qrcode]

==================================
```

1. Buka WhatsApp di HP
2. Menu → Linked Devices → Link a Device
3. Scan QR code dari terminal

### Verifikasi

```bash
# Cek health check
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "whatsapp": "connected"
}
```

---

## Step 8: Upload Folder Setup

### Buat Folder Uploads

```bash
mkdir -p /var/www/fleetsync/public/uploads/vehicles
mkdir -p /var/www/fleetsync/public/uploads/inspections
```

### Set Permissions

```bash
sudo chown -R www-data:www-data /var/www/fleetsync/public/uploads
sudo chmod -R 755 /var/www/fleetsync/public/uploads
```

---

## Monitoring

### Cek Status Semua Service

```bash
# PM2 status
pm2 status

# Nginx status
sudo systemctl status nginx

# PostgreSQL status
sudo systemctl status postgresql
```

### Cek Logs

```bash
# Logs Next.js
pm2 logs fleetsync

# Logs WA Bot
pm2 logs wa-bot

# Logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Services

```bash
# Restart semua
pm2 restart all

# Restart Next.js saja
pm2 restart fleetsync

# Restart WA Bot saja
pm2 restart wa-bot

# Restart Nginx
sudo systemctl restart nginx
```

---

## Troubleshooting

### Port 3000/3001 tidak bisa diakses

```bash
# Cek apakah service berjalan
pm2 status

# Cek port
sudo lsof -i :3000
sudo lsof -i :3001

# Cek firewall
sudo ufw status
```

### Database connection error

```bash
# Cek PostgreSQL
sudo systemctl status postgresql

# Test koneksi
PGPASSWORD=your_password psql -U fleetsync -d fleetsync -h localhost -c "SELECT 1;"
```

### WA Bot tidak connect

```bash
# Cek log
pm2 logs wa-bot

# Restart bot
pm2 restart wa-bot

# Hapus session dan scan ulang
rm -rf /var/www/fleetsync/wa-bot/.wwebjs_auth
pm2 restart wa-bot
```

### Upload gambar tidak tampil

```bash
# Cek permissions
ls -la /var/www/fleetsync/public/uploads/

# Fix permissions
sudo chown -R www-data:www-data /var/www/fleetsync/public/uploads
sudo chmod -R 755 /var/www/fleetsync/public/uploads
```

### Memory usage tinggi

```bash
# Cek memory
pm2 monit

# Restart jika perlu
pm2 restart all
```

---

## Update Aplikasi

### Pull Update dari GitHub

```bash
cd /var/www/fleetsync
git pull origin main
```

### Install Dependencies Baru

```bash
bun install
cd wa-bot && bun install && cd ..
```

### Run Migrations (jika ada)

```bash
bun run db:push
```

### Rebuild dan Restart

```bash
bun run build
pm2 restart all
```

---

## Backup Database

### Backup

```bash
pg_dump -U fleetsync -d fleetsync > backup_$(date +%Y%m%d).sql
```

### Restore

```bash
psql -U fleetsync -d fleetsync < backup_20260101.sql
```

### Auto Backup (Cron Job)

```bash
# Edit crontab
crontab -e

# Tambahkan (backup setiap jam 2 pagi)
0 2 * * * pg_dump -U fleetsync -d fleetsync > /var/backups/fleetsync_$(date +\%Y\%m\%d).sql
```

---

## Akses Aplikasi

Setelah semua setup selesai:

| Service | URL |
|---------|-----|
| Web App | `http://YOUR_VPS_IP` |
| Login | `http://YOUR_VPS_IP/login` |
| WA Bot Health | `http://YOUR_VPS_IP/bot/health` |

### Login Default

| Field | Value |
|-------|-------|
| Email | `admin@fleetsync.com` |
| Password | `admin123` |

**⚠️ Ganti password default setelah login pertama kali!**

---

## Tips Keamanan

1. **Ganti password default** admin setelah login pertama
2. **Gunakan HTTPS** jika memungkinkan (Let's Encrypt)
3. **Backup database** secara berkala
4. **Monitor logs** untuk aktivitas mencurigakan
5. **Update dependencies** secara berkala
6. **Restrict akses** ke port 3001 (hanya dari localhost)
