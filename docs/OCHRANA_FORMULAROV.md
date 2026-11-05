# Ochrana formulárov a opakovaných požiadaviek

Implementácia 5. 11. 2026. Objednávky sa týmto neotvárajú; produkčné príznaky predaja zostávajú bez zmeny.

## Limity

Limity sú atómové v Supabase, spoločné pre všetky Vercel inštancie. Nedostupnosť ochrany znamená 503, nie obídenie kontroly. Prekročenie vracia 429 a `Retry-After`. Ide o pevné časové okná; na ich hranici môžu prejsť požiadavky z oboch susedných okien. Táto vrstva nenahrádza ochranu poskytovateľa hostingu pred distribuovaným útokom.

| Operácia | Limit |
| --- | --- |
| Generické a personalizované RSVP spolu | 600 odoslaní / IP / 10 minút |
| Jedna odpoveď / personalizovaná pozvánka | 8 odoslaní / minútu |
| Vytváranie checkoutu | 30 požiadaviek / IP / 15 minút |
| Nové checkouty na jeden e-mail | 10 / hodinu |
| Ubytovacie e-maily, hrubý limit požiadaviek | 120 / IP / minútu |
| Nové e-mailové operácie jedného majiteľa | 120 / minútu a 1000 / deň |
| Nové e-mailové operácie pre jedného hosťa | 3 / 10 minút |

RSVP má vyšší spoločný IP limit kvôli hosťom na spoločnej Wi-Fi. Identifikátor individuálnej odpovede má vlastný menší limit; oprava odpovede zostáva možná. Úspešne dokončené opakovanie checkoutu/e-mailu používa uložený výsledok a nezvyšuje kvótu nových externých operácií. Hrubý IP limit sa uplatňuje aj na opakovanie.

V produkcii sa používa Vercelom nastavený `x-vercel-forwarded-for`; jeho chýbanie/neplatný formát neumožní obísť ochranu. Hlavička Origin, ak je prítomná, musí zodpovedať doméne požiadavky. [Vercel – request headers](https://vercel.com/docs/headers/request-headers).

JSON je obmedzený aj pri streamovaní: RSVP 64 KiB, checkout 8 KiB, ubytovací e-mail 16 KiB. Veľké požiadavky vracajú 413, nesprávny obsah 415/400. Verejné formuláre obsahujú skryté pole proti jednoduchým botom, vyradené z ovládania klávesnicou a z čítačiek obrazovky. Vyplnenie poľa sa nezapíše ako úspešné RSVP.

## Dvojklik a výpadok spojenia

- Checkout používa náhodný identifikátor zámeru. V rámci tabu sa rovnaké údaje a cena držia pri rovnakom identifikátore najviac 23 hodín aj po obnovení stránky. Zmena údajov/ceny vytvorí nový zámer. V sessionStorage nie sú mená ani e-mail, iba odtlačok formulára, UUID a čas; ak storage nefunguje, zostáva pamäťová záloha pre otvorenú stránku.
- E-mail má identifikátor otvoreného návrhu; úprava textu alebo vytvorenie nového návrhu je nový zámer. Opakovanie odoslania toho istého návrhu používa rovnaký identifikátor. Manuálne odoslanie z externej e-mailovej aplikácie táto ochrana nepokrýva.
- Súkromná tabuľka operácií povolí iba jedného spracovateľa na zámer. Súbežný pokus dostane 409 s krátkym čakaním. Dokončený pokus vráti pôvodný výsledok. Rovnaký identifikátor s iným obsahom sa odmietne.
- Stripe aj Resend dostávajú stabilný idempotency key bez osobných údajov. Ak prvý pokus prerušilo spojenie, opakovanie toho istého zámeru nevytvorí druhú operáciu. [Stripe](https://docs.stripe.com/api/idempotent_requests), [Resend](https://resend.com/docs/dashboard/emails/idempotency-keys).
- Zámok spracovania trvá 90 sekúnd. Potom možno bezpečne obnoviť prerušené spracovanie s tým istým kľúčom poskytovateľa. Neuzavretý zámer starší než 23 hodín sa už nevykonáva automaticky; dokončený výsledok sa môže ďalej vrátiť z cache.
- Ak poskytovateľ operáciu prijal, zlyhanie uloženia výsledku sa neprezentuje ako dôvod odoslať novú platbu/e-mail. Zachovaný kľúč na opakovanie chráni aj pri dočasnej chybe cache.
- Generické RSVP ostáva upsert podľa projektu a identifikátora odpovede. Personalizované RSVP je teraz tiež atómový upsert podľa príjemcu, nie dvojkrok „načítaj a potom vlož“. Bežná UNIQUE podmienka zachováva viac generických odpovedí s NULL príjemcom.

## Údaje a prevádzka

Tabuľky `request_limit_buckets` a `request_operations` nemajú priame práva pre anonymov ani klientov. RPC má len service_role. Počítadlá používajú HMAC odtlačky identifikátorov; surové IP, adresy klientov a texty e-mailov sa do tejto evidencie neukladajú. Výsledok operácie obsahuje len odpoveď potrebnú na opakovanie (napr. checkout URL alebo ID a stav e-mailu). Ide aj tak o súkromné prevádzkové údaje.

Počítadlá expirujú po konci svojho okna, operácie po 48 hodinách. Expirácia a fyzické zmazanie sú odlišné: obmedzené čistenie prebieha pri používaní a hromadné čistenie je zapojené do existujúceho denného zabezpečeného cronu. Ak cron zlyháva, treba čistenie skontrolovať; nevytvárať sľub absolútnej 48-hodinovej fyzickej retencie bez sledovania cronu.

Migrácia: `20261105000300_add_request_protection.sql`, aplikovaná transakčne a zapísaná do histórie. Pri nasadzovaní musí predchádzať novému API.

Overenie pred publikovaním: 67 automatických testov, 20 transakčných DB kontrol a skutočný súbeh dvoch nezávislých databázových spojení (limit povolil jeden z dvoch pokusov, operáciu získal len jeden spracovateľ a ďalší pokus vrátil uložený výsledok). Syntetické počítadlá a operácie boli odstránené. Neodosielali sa skutočné e-maily ani nevytvárali reálne Stripe checkouty.
