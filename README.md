# zal3a · plant pots with faces

Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + Zustand 5, with a built-in SQLite database and an admin dashboard.
Storefront in English (`/en`) and Arabic RTL (`/ar`); admin at `/admin`.

```bash
npm install
npm run dev     # http://localhost:3000  (runs `npm run setup` first)
npm run build && npm start
```

`npm run setup` runs automatically before `dev` and `build`. It creates the database in `data/`, seeds the catalog with
mock images on the first run, and creates the first admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env.local`
(see `.env.example`). If no password is set, it generates one and prints it once.

## Admin (`/admin`)

- **Pots**: add, edit, delete, reorder, show or hide, mark as featured in the home page hero, set the price, sale % and stock
  (0 = sold out, empty = not tracked). Each pot can be a set of several pots (like the Gossip Duo), and customers pick a
  plant for each one.
- **Plant combo photos**: on a pot's edit page there's a photo slot for every plant combination. The product page switches to
  that photo when a customer picks those plants. The seeded ones are labelled **MOCK PHOTO**. Replace them with real ones.
- **Plants**: same controls, plus photo, icon, care levels and "great for" tags used by the gift matchmaker.
- **Orders**: every checkout is saved here, with status tracking and WhatsApp/phone links. Stock is taken off when an order is placed.
- **Account**: change password, add/remove admins. `npm run admin:create -- email password` also creates an admin or resets a password.

## Where things live

| What | File |
| --- | --- |
| Social links, WhatsApp number, delivery fees | `lib/site.ts` |
| Storefront text (EN + AR) | `lib/dictionaries/en.ts`, `lib/dictionaries/ar.ts` |
| Pricing, stock and matchmaker logic | `lib/catalog.ts` |
| Database access (all SQL) | `lib/server/db.ts`, `catalog-repo.ts`, `orders-repo.ts`, `users.ts` |
| Image storage | `lib/server/storage.ts` (files in `data/uploads`, served at `/uploads/…`) |
| Admin server actions | `app/admin/actions.ts` |
| Colours, fonts, animations | `app/globals.css` |

## Hosting notes

- Everything that changes lives in `data/` (or `DATA_DIR`): `zal3a.db` and `uploads/`. **Back that folder up.** It's not in git.
- It needs a host with a persistent disk (a VPS, Railway/Render/Fly with a volume, etc.). It won't persist on Vercel's
  serverless functions. To move there, swap the SQLite files in `lib/server/` for Postgres and `storage.ts` for blob storage.
  Nothing else touches the database or the disk.
- Admin sign-in cookies are `Secure` in production, so serve the site over HTTPS.
- Prices are always recalculated on the server at checkout. The browser's cart is never trusted.

The original single-file version is kept in `legacy/index.html`.
