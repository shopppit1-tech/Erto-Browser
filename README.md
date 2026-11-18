# Erto Browser

**Cepat • Aman • Support Ekstensi** — Browser mobile PWA dengan dukungan ekstensi (Google Translate, uBlock Origin, Dark Reader, AdBlock), pengelola tab, mode penyamaran, riwayat, bookmark, unduhan, dan pencarian suara/QR.

## 1. Deploy Otomatis ke GitHub Pages (Gratis & PWA Siap Instal)

1. Push repositori ini ke GitHub pada branch `main`.
2. Buka **Settings → Pages** di repositori GitHub Anda.
3. Pada bagian **Build and deployment → Source**, pilih **GitHub Actions**.
4. Workflow `.github/workflows/deploy-pages.yml` akan otomatis membangun dan memublikasikan aplikasi ke `https://<username>.github.io/<nama-repo>/`.

> **Catatan**: GitHub Pages bersifat statis (tanpa server Node.js), sehingga pencarian menggunakan fallback API CORS Wikipedia + tautan langsung, sementara UI, PWA, ekstensi tampilan, bookmark, riwayat, unduhan, dan setelan berjalan penuh.

## 2. Jalankan Full-Stack di GitHub Codespaces (Semua Fitur Proxy Aktif)

1. Klik **Code → Codespaces → Create codespace on main** di repositori GitHub Anda.
2. Jalankan di terminal Codespaces:
   ```bash
   npm install
   npm run dev
   ```
3. Buka port `3000` yang diteruskan Codespaces.

## 3. Deploy Full-Stack dari GitHub (Docker / Render / Railway / Cloud Run)

Repositori sudah dilengkapi `Dockerfile` siap pakai:
```bash
docker build -t erto-browser .
docker run -p 3000:3000 erto-browser
```
Atau hubungkan repositori GitHub ke **Render / Railway / Cloud Run** menggunakan `npm install && npm run build` dan start command `npx tsx server.ts`.
