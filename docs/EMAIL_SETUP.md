# Nastavenie e-mailov YesDay

Produkcia používa Resend API a vlastné bezpečné odkazy generované cez Supabase Auth.

## Premenné prostredia vo Verceli

- `RESEND_API_KEY` – API kľúč vytvorený v Resend.
- `YESDAY_EMAIL_FROM` – overený odosielateľ, napr. `YesDay <hello@yesdaystudio.com>`.
- `NEXT_PUBLIC_SITE_URL` – `https://www.yesdaystudio.com`.
- `SUPABASE_SERVICE_ROLE_KEY` – serverový service role kľúč Supabase.

## Pred aktiváciou

1. Pridať odosielaciu doménu v Resend.
2. Do DNS domény doplniť záznamy z Resend a počkať na stav `Verified`.
3. Pridať `RESEND_API_KEY` a `YESDAY_EMAIL_FROM` do Production, Preview aj Development podľa potreby.
4. V Supabase ponechať povolené presmerovanie na `https://www.yesdaystudio.com/reset-password`.
5. Otestovať nového používateľa, existujúceho používateľa a ubytovací e-mail.

Ak premenné Resend nie sú nastavené, onboarding dočasne používa pôvodné e-maily Supabase. Priamy ubytovací e-mail zobrazí informáciu, že odosielanie ešte nie je aktivované.
