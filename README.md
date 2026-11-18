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

## 4. Build & Rilis Android APK Otomatis di GitHub Releases

Repositori sudah dilengkapi proyek Android (`android/` via Capacitor) dan workflow `.github/workflows/release-apk.yml`.

1. Push repositori ini ke GitHub pada branch `main` (atau buat tag versi baru, misal `git tag v1.0.0 && git push origin v1.0.0`).
2. Anda juga bisa memicu build manual melalui tab **Actions → Build & Release Android APK → Run workflow**.
3. Setelah workflow selesai (~2 menit), file **`Erto-Browser-v*.apk`** yang sudah ditandatangani (signed release APK) otomatis tersedia di halaman **Releases** GitHub Anda dan siap diunduh serta diinstal di Android.
4. *(Opsional)* Jika Anda men-deploy server backend (`Dockerfile`), tambahkan GitHub Repository Variable bernama `ERTO_SERVER_URL` berisi URL server Anda agar APK terhubung ke backend proxy & Chrome Web Store Anda.
5. *(Opsional)* Untuk tanda tangan rilis tetap di Play Store, tambahkan GitHub Secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, dan `ANDROID_KEY_PASSWORD`. Jika tidak diisi, workflow otomatis membuat keystore rilis sementara yang valid sehingga APK langsung bisa diinstal.
