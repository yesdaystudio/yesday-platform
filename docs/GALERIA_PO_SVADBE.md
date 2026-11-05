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
- Automatické API testy používajú náhradu Supabase klienta; samostatne prešiel aj nižšie uvedený živý integračný test.
- V Safari bola vizuálne overená mriežka na lokálnych ukážkových obrázkoch, otvorenie modálneho náhľadu, prechod na ďalšiu fotografiu a Escape s návratom fokusu.
- Po výslovnom súhlase používateľky prešiel živý integračný test na produkčnej doméne: 20 kontrol s dvoma dočasnými prihlásenými účtami a samostatnými skúšobnými projektmi. Overil dva reálne JPEG uploady, podpísané doručovanie fotiek, odmietnutie priameho verejného storage prístupu, anonymnej správy, cudzieho vlastníka a Essential balíka, popisy s diakritikou, uložené poradie, zverejnenie a skrytie v skutočnej odpovedi svadobného webu a odstránenie fotky.
- Servisný kľúč bol použitý iba v pamäti procesu, bez vypísania či uloženia. Skúšobné účty vznikli potvrdené bez odoslania e-mailov; neprebehli platby. Všetky vytvorené skúšobné účty, projekty a storage objekty boli po teste odstránené; odstránenie projektov bolo overené.

Pôvodný audit pred prvým predajom je historický stav pred doplnením galérie. Implementácia galérie odstraňuje medzeru v kóde; nemení jeho ostatné bezpečnostné a právne zistenia.
