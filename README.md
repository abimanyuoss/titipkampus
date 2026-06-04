# TitipKampus

Web app responsif untuk operasional TitipKampus UMP: pemesanan layanan, manajemen kurir, pelacakan real-time, COD, pembayaran digital berbasis OTP, voucher otomatis, rating, riwayat transaksi, verifikasi admin, dan analytics.

## Run Locally

1. Install dependencies:
   `npm install`
2. Configure `.env.local` from `.env.example`.
3. Generate Prisma Client:
   `npm run prisma:generate`
4. Push schema to Neon/PostgreSQL:
   `npm run db:push`
5. Run the app:
   `npm run dev`

Saat development, app otomatis memakai database memori jika Neon/PostgreSQL tidak bisa dijangkau, jadi UI tetap bisa dites. Gunakan `TITIPKAMPUS_DB_MODE=postgres` jika ingin memaksa koneksi PostgreSQL dan gagal saat database bermasalah.

## Code Quality

Project ini memakai Biome sebagai pengganti ESLint + Prettier untuk linting, formatting, dan organize imports.

- Check lint + type safety: `npm run lint`
- Auto-fix lint/format/imports: `npm run lint:fix`
- Format saja: `npm run format`
- TypeScript check saja: `npm run typecheck`

Akun demo lokal otomatis dibuat saat `NODE_ENV` bukan `production`:
- Mahasiswa: `demo.mahasiswa@gmail.com` / `demo1234`
- Admin: `demo.admin@gmail.com` / `admin123`

Untuk production, jangan commit kredensial asli. Isi `DATABASE_URL`,
`SESSION_SECRET`, dan kredensial admin awal lewat environment Vercel
(`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`, `SEED_ADMIN_PHONE`)
jika admin seed memang diperlukan.

Fitur final:
- Realtime update via Server-Sent Events (`/api/events`).
- Verifikasi kurir oleh admin sebelum bisa menerima tugas.
- Voucher aktif: `UMPHEMAT`, `KOPMA5000`.
- Pembayaran digital memakai OTP pengujian.
- Analytics operasional untuk admin.
