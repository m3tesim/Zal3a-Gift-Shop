# zal3a · plant pots with faces

Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + Zustand 5, with a built-in SQLite database and an admin dashboard.
Storefront in English (`/en`) and Arabic RTL (`/ar`), with customer accounts, order tracking, verified reviews and
email notifications. Admin at `/admin`.

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
- **Plants**: same controls, plus photo, icon, sun and watering, "best for" labels and vibes (used by the gift matchmaker).
- **Tags & care**: add, rename, reorder, hide or delete the "best for" labels, vibes, watering options and sun options.
- **Orders**: every checkout is saved here, with a status timeline, search and WhatsApp/phone links. Stock is taken off when
  an order is placed. Changing the status emails the customer (confirmed / on its way / delivered / cancelled).
- **Reviews**: edit, hide, reply to or delete reviews. Only customers whose order with that pot is **delivered** can post one.
- **Customers**: everyone with an account, whether they confirmed their email, opted into offers, and what they've ordered.
- **Emails**: send offers (English + Arabic, optional banner image and button) to customers who opted in and confirmed
  their email; preview and test first. The outbox shows every email the shop sent, exactly as the customer saw it.
- **Account**: change password, add/remove admins. `npm run admin:create -- email password` also creates an admin or resets a password.

## Customers (`/en/account`, `/ar/account`)

Register, sign in, confirm email, reset a forgotten password, see order history with a tracking timeline, review delivered
pots and switch offer emails on or off. Guests can track an order at `/en/track` with the order number and phone. Every
order email also carries a signed link that opens the tracking page directly.

## Email

Uses any SMTP provider (Gmail with an app password, Zoho, Brevo, Resend, SES…). Add `SMTP_HOST`, `SMTP_PORT`,
`SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` and `SITE_URL` to `.env.local` and restart (see `.env.example`). Until then, every
email is still created and saved to the admin outbox, just not sent.

## Where things live

| What | File |
| --- | --- |
| Social links, WhatsApp number, delivery fees | `lib/site.ts` |
| Storefront text (EN + AR) | `lib/dictionaries/en.ts`, `lib/dictionaries/ar.ts` |
| Pricing, stock and matchmaker logic | `lib/catalog.ts` |
| Database + migrations | `lib/server/db.ts` (schema is versioned; upgrades run automatically) |
| Database access (all SQL) | `lib/server/*-repo.ts`, `users.ts` (admins), `customers.ts` (shoppers) |
| Email sending + templates | `lib/server/email/`, `lib/server/notify.ts`, `lib/server/campaigns.ts` |
| Image storage | `lib/server/storage.ts` (files in `data/uploads`, served at `/uploads/…`) |
| Admin server actions | `app/admin/actions.ts` |
| Colours, fonts, animations | `app/globals.css` |

## Hosting notes

- Everything that changes lives in `data/` (or `DATA_DIR`): `zal3a.db` and `uploads/`. **Back that folder up.** It's not in git.
- It needs a host with a persistent disk (a VPS, Railway/Render/Fly with a volume, etc.). It won't persist on Vercel's
  serverless functions. To move there, swap the SQLite files in `lib/server/` for Postgres and `storage.ts` for blob storage.
  Nothing else touches the database or the disk.
- Admin and customer sign-in cookies are `Secure` in production, so serve the site over HTTPS.
- Shop pages are rendered per request from SQLite, so stock, prices and reviews are always current.
- Prices are always recalculated on the server at checkout. The browser's cart is never trusted.

The original single-file version is kept in `legacy/index.html`.
