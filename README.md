# zal3a · plant pots with faces

Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + Zustand 5. English (`/en`) and Arabic RTL (`/ar`).

```bash
npm install
npm run dev     # http://localhost:3000 → redirects to /en
npm run build && npm start
```

## Where things live

| What | File |
| --- | --- |
| Social links, WhatsApp number, delivery fees | `lib/site.ts` |
| Products & plants (EN + AR copy, prices, specs) | `lib/products.ts` |
| All UI text | `lib/dictionaries/en.ts`, `lib/dictionaries/ar.ts` |
| Cart / order store (persisted to localStorage) | `lib/store.ts` |
| Colours, fonts, animations | `app/globals.css` (`@theme`) |
| Pages | `app/[locale]/…` (home, `pots/[id]`, `checkout`, `checkout/thanks`) |

## Checkout

Checkout runs entirely in the browser: it validates the form, saves the order in the Zustand store and shows a
thank-you page with a **"Send it to us on WhatsApp"** button that pre-fills the full order. There is no backend,
so orders only reach the shop through that WhatsApp message. To receive orders automatically, post the `Order`
object from `CheckoutForm.submit()` to an API route or form service.

The original single-file version is kept in `legacy/index.html`.
