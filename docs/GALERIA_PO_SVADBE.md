# Galéria po svadbe

Implementácia 5. 11. 2026.

- Balíky Signature a Atelier, iba aktívne a zaplatené projekty. Server overuje vlastníka pri každom čítaní a zápise správy galérie.
- Klientska zóna → Galéria: názov, úvod, explicitné zverejnenie, výber viacerých fotiek, popisy, posun poradia, odstránenie s potvrdením.
- Limit 100 fotografií. Prehliadač prekreslí JPG/PNG/WebP do JPEG s dlhšou stranou najviac 2000 px a veľkosťou do 2 MB. Originály sa nearchivujú; HEIC treba najprv exportovať do podporovaného formátu.
- Nová galéria je nezverejnená. Publikovaná neprázdna galéria je na konci svadobného webu vo všetkých deviatich dizajnoch. Klik otvorí modálny náhľad; šípky, Escape a návrat fokusu sú podporované.
- Fotky sú v súkromnom Supabase buckete `wedding-gallery`. Verejná stránka dostáva hodinové podpísané odkazy až po kontrole publikovania, balíka a stavu projektu. Nepublikovaná galéria sa do stránky neposiela. Otvorenú stránku treba po exspirácii odkazov obnoviť. Zrušenie publikovania nezruší už vydané odkazy okamžite.
- Tabuľky nemajú priame oprávnenia pre `anon` ani `authenticated`; prístup ide iba cez server. RPC na zmenu poradia je dostupné iba pre `service_role`. Limit fotiek vynucuje DB pod zámkom rodičovského riadku.

## Migrácia a prevádzka

Migrácia `20261105000000_add_wedding_gallery.sql` bola aplikovaná transakčne na prepojený projekt a zapísaná do `supabase_migrations.schema_migrations`. Zvyšné čakajúce migrácie neboli hromadne spúšťané.

Pri rušení celého projektu treba najprv odstrániť jeho objekty z `wedding-gallery`, až potom projekt. Cudzí kľúč odstráni metadata, nie fyzické storage súbory. Ak po neúspešnom zápise zlyhá kompenzačné mazanie uploadu, server vypíše `Gallery upload cleanup required` s interným ID; treba odstrániť konkrétny osirelý objekt. Obe operácie musia byť súčasťou postupu uzavretia účtu.

## Overenie

- 40 automatických testov prešlo vrátane autorizácie API, balíkov, stavu projektu, neplatných uploadov, kompenzačného mazania a poradia.
- Deväť reálnych DB kontrol prešlo: súkromný bucket, priame oprávnenia, predvolené skrytie, limit 101. fotky a atómové poradie vrátane odmietnutia cudzích/duplicitných ID. Syntetické dáta boli v transakcii ukončenej rollbackom.
- API testy používajú náhradu Supabase klienta. Nepredstavujú celý test nahratia a podpísania fotografie cez prihlásený produkčný účet.
- V Safari bola vizuálne overená mriežka na lokálnych ukážkových obrázkoch, otvorenie modálneho náhľadu, prechod na ďalšiu fotografiu a Escape s návratom fokusu.
- Automatické schvaľovanie zamietlo získanie tajného Supabase API kľúča pre tento integračný test. Kľúč nebol získaný a nebol použitý obchádzajúci postup. Celý autentifikovaný upload zostáva na akceptačné overenie v klientskom účte.

Pôvodný audit pred prvým predajom je historický stav pred doplnením galérie. Implementácia galérie odstraňuje medzeru v kóde; nemení jeho ostatné bezpečnostné a právne zistenia.
