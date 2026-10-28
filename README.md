# Nexora — Trading Journal

Professional ko'rinishdagi **trading journal / analytics dashboard**. Sof HTML + CSS + JavaScript
(hech qanday build, freymvork yoki CDN talab qilmaydi) — shuning uchun istalgan static hosting'ga
bir zumda joylasa bo'ladi.

![status](https://img.shields.io/badge/status-demo-14f0a4) ![stack](https://img.shields.io/badge/stack-vanilla%20JS-8b5cff)

## Sahifalar

| Sahifa | Fayl | Nima bor |
|---|---|---|
| **Dashboard** | `index.html` | 4 KPI + sparkline, kapital egri chizig'i (30/90/all), win-loss donut, so'nggi savdolar, savdo kalendari, instrumentlar va strategiyalar tahlili, intizom balli |
| **Trades** | `trades.html` | 210 ta demo savdo: qidiruv, long/short filtri, strategiya filtri, ustunlar bo'yicha saralash, pagination, CSV eksport |
| **Analytics** | `analytics.html` | AI xulosa, oylik P&L, hafta kunlari, R-ko'paytma gistogrammasi, long/short taqsimoti, drawdown egri chizig'i, eng yaxshi/yomon savdolar, setup jadvali |
| **Journal** | `journal.html` | Yozuvlar (mood + teglar), kunlik qoidalar checklist, intizom statistikasi, yangi yozuv qo'shish |
| **Pricing** | `pricing.html` | 3 tarif, oylik/yillik toggle, FAQ (accordion), CTA |

## Tez ishga tushirish

```bash
# 1-usul: Python
python3 -m http.server 8000

# 2-usul: Node
npx serve .
```

So'ng brauzerda `http://localhost:8000` ni oching.
Fayllarni to'g'ridan-to'g'ri ikki marta bosib (file://) ochish ham ishlaydi, lekin lokal server tavsiya etiladi.

## Nimalar ishlaydi (demo emas, haqiqiy)

- **UZ / EN til almashtirish** — yuqori o'ng burchakdagi `UZ | EN`. Tanlov `localStorage`da saqlanadi.
- **Savdo qo'shish** — `+ Savdo qo'shish` tugmasi. Kiritilgan savdo barcha sahifalardagi statistikaga qo'shiladi
  (sof foyda, win rate, profit factor, kalendar, grafiklar).
- **Jurnal yozuvi qo'shish** — matn, kayfiyat va teglar bilan; teg filtri avtomatik yangilanadi.
- **CSV eksport** — barcha savdolar jadvali `.csv` faylga chiqadi.
- **Kalendar** — har kuni P&L intensivligi bo'yicha ranglanadi, hover'da aniq summa.
- **Grafiklar** — barchasi qo'lda yozilgan SVG komponentlar: hover, tooltip, crosshair, resize'da qayta chizish.
- **Responsive** — 980px dan pastda sidebar drawer'ga aylanadi (burger tugmasi).

## Fayl tuzilishi

```
.
├── index.html            # Dashboard
├── trades.html           # Savdolar tarixi
├── analytics.html        # Tahlil
├── journal.html          # Jurnal
├── pricing.html          # Tariflar
└── assets/
    ├── favicon.svg
    ├── css/
    │   └── styles.css    # Dizayn tizimi: tokenlar, komponentlar, layout, responsive
    └── js/
        ├── i18n.js       # UZ/EN lug'ati + til almashtirish
        ├── data.js       # Demo ma'lumot generatori + statistika dvigateli
        ├── charts.js     # SVG chartlar: line, bars, donut, sparkline + formatlash
        ├── shell.js      # Sidebar, topbar, modal, toast, eksport
        ├── dashboard.js
        ├── trades.js
        ├── analytics.js
        ├── journal.js
        └── pricing.js
```

## Sozlash

### Ranglar va brend

Barcha ranglar `assets/css/styles.css` boshidagi CSS o'zgaruvchilarida:

```css
:root {
  --green: #14f0a4;   /* foyda / asosiy aksent */
  --red:   #ff5470;   /* zarar */
  --violet:#8b5cff;   /* ikkinchi aksent */
  --bg:    #07080c;
}
```

Faqat shu qiymatlarni almashtirsangiz, butun sayt (grafiklar ham) yangi brendga o'tadi.
Diagramma ranglari `assets/js/*.js` ichida `#14f0a4` ko'rinishida uchraydi.

### Demo ma'lumot

`assets/js/data.js`:
- `START_BALANCE` — boshlang'ich balans (25000).
- `SYMBOLS`, `SETUPS`, `SETUP_BIAS` — instrumentlar, strategiyalar va ularning "haqiqatga o'xshash" win-rate'i.
- `mulberry32(20261028)` — deterministik seed: har reload'da bir xil ma'lumot chiqadi. O'zgartirsangiz, yangi tarix generatsiya qilinadi.

Hozirgi demo: **210 savdo, 49% win rate, profit factor 1.25, maks. drawdown 10.1%, sof +$5,550** —
real treyder natijasiga o'xshash, sun'iy "hamma savdo foydali" ko'rinishidan qochilgan.

### Saqlanadigan kalitlar (localStorage)

| Kalit | Ma'nosi |
|---|---|
| `nexora.lang` | tanlangan til (`uz` / `en`) |
| `nexora.userTrades` | foydalanuvchi qo'shgan savdolar |
| `nexora.journal` | foydalanuvchi jurnal yozuvlari |
| `nexora.rules` | bugungi bajarilgan qoidalar |
| `nexora.mood-YYYY-MM-DD` | kunlik kayfiyat |

Demo ma'lumotni tozalash: brauzer DevTools → Application → Local Storage → sayt domenini tozalash.

## Keyingi qadamlar (real backend)

1. **Supabase** (loyihada allaqachon ulangan): `users`, `accounts`, `trades`, `journal_entries` jadvallari —
   `data.js` dagi funksiyalarni (`trades()`, `addTrade()`, `journal()`) Supabase so'rovlari bilan almashtirish kifoya.
2. **Auth** — Supabase Auth (email + Google), `user-chip` blokiga haqiqiy foydalanuvchi.
3. **Broker sync** — Binance/Bybit API yoki MetaTrader statement import (CSV parser tayyor).
4. **Deploy** — Vercel / Netlify / GitHub Pages: build qadami yo'q, shunchaki papkani yuklash.

## Eslatma

Bu demo. Barcha savdo ma'lumotlari generatsiya qilingan va brauzerda saqlanadi.
Trading yuqori risk bilan bog'liq — o'tgan natijalar kelajakni kafolatlamaydi.
