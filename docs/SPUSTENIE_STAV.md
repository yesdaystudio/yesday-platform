# Postup k oficiálnemu spusteniu YesDay

Stav: 5. november 2026. Online objednávky zostávajú zatvorené.

## Dohodnuté rozhodnutia

- Web vrátane galérie má byť dostupný 12 mesiacov po svadbe (potvrdené používateľkou).
- Predajcom bude pripravovaná s. r. o.; založenie sa má začať 5. 11. 2026. Obchodné meno, sídlo, IČO a daňové údaje sa doplnia po ich potvrdení.
- Dvanásťmesačné trvanie je zatiaľ produktové rozhodnutie. Automatické ukončenie, upozornenie pred skončením, export a retenčný proces ešte nie sú implementované.
- Overené cez read-only Vercel API: produkčný tím používa aktívny plán Hobby. Pred komerčným predajom treba plán povoľujúci komerčné použitie. Vercel Pro má k dátumu kontroly základ 20 USD/mesiac s jedným nasadzujúcim členom a kreditom na spotrebu; spotreba nad kredit a ďalšie položky môžu byť účtované navyše. Nebol vykonaný upgrade ani platba. [Hobby](https://vercel.com/docs/plans/hobby), [Pro](https://vercel.com/docs/plans/pro-plan).

## Krok 1: ochrana klientskych údajov — nasadená oprava

Pred opravou boli v produkcii vypnuté RLS na `projects`, `website_content` a `schedule_items` a existovali široké oprávnenia anonymných aj prihlásených rolí. Potvrdená bola dostupnosť stĺpca `client_email`; samotné e-maily neboli pri audite načítané. Ostatné tabuľky mali RLS zapnuté, ale viaceré ponechávali oprávnenie TRUNCATE, ktoré RLS nekontroluje.

Nasadené migrácie:

- `20261105000100_secure_project_access`: RLS troch tabuliek; anonym nemá priame práva. Prihlásený klient číta len vlastný projekt, obsah, program a odpovede. Projekt môže meniť len cez povolené stĺpce; nemôže si zmeniť vlastníka, balík ani platobný stav. Priame vkladanie RSVP je zrušené; ide cez serverovú validáciu. Ubytovanie môže upravovať majiteľ prémiového balíka.
- `20261105000200_revoke_unsafe_table_privileges`: zrušené TRUNCATE, TRIGGER a REFERENCES pre `public`, `anon` a `authenticated` na všetkých verejných aplikačných tabuľkách. Upravené aj defaultné oprávnenia pre budúce tabuľky vytvorené migračnou rolou.

Verejné svadobné weby sa načítavajú na serveri z explicitného zoznamu verejných stĺpcov. Do vykreslenia sa neposiela e-mail, vlastníctvo, Stripe identifikátor ani platobný stav. RSVP formulár dostáva iba ID, slug a typ balíka cez `/api/weddings/[slug]`. Web, generické aj personalizované RSVP vyžadujú zaplatený aktívny projekt. Projekty v onboardingu sa verejne nezobrazujú. Nejde ešte o samostatný prepínač koncept/zverejniť.

Overenie:

- 42 automatických testov prešlo, produkčný build prešiel.
- 23 databázových kontrol nasadených pravidiel s dvoma syntetickými vlastníkmi prešlo; oba smery izolácie, editor, program, ubytovanie, zákaz zmeny vlastníctva/balíka/platby a zákaz priameho RSVP. Test je uložený v `tests/sql/project-security.sql`; vždy používa transakciu s rollbackom.
- 20 živých kontrol na produkčnej doméne prešlo: verejný web funguje po uzavretí tabuliek, súkromný sentinel sa neobjaví v HTML, minimálna odpoveď verejného API, odmietnutie nezaplateného/onboarding projektu, generické RSVP aj jeho opakované odoslanie, personalizovaná pozvánka a odmietnutie zakázaných stavov. Anonymné HEAD požiadavky na tri tabuľky sú odmietnuté. Skúšobné projekty, pozvánky a RSVP boli odstránené a ich odstránenie overené.
- Po dodatočnom odobratí hromadných oprávnení metadátová kontrola potvrdila, že anonym ani klient nemajú TRUNCATE/TRIGGER na žiadnej aplikačnej tabuľke.
- Nevykonávali sa platby, neposielali e-maily ani nenačítavali reálne klientské údaje. Na tieto testy nebol potrebný servisný API kľúč.

Oprava uzatvára súčasný prístup; nedokazuje, že v minulosti nikto údaje nečítal ani nemenil. Zostáva samostatne posúdiť dostupné provider logy, rozsah skutočne uložených osobných údajov a prípadné incidentné povinnosti s odborníkom. Nevytvárať tvrdenie „k úniku nikdy nedošlo“ bez dôkazov.

## Nasledujúce kroky

Dokončený ďalší technický krok: ubytovací e-mail serverovo overuje vlastníka, aktívne zaplatené Signature/Atelier, potvrdenú účasť, požiadavku na ubytovanie a uložený kontakt. Cudzí klient nedostáva informáciu, či má hosť e-mail. Príjemcu ani reply-to nemožno prepísať cez payload. Overenie a odosielanie majú samostatné chybové stavy. Ak poskytovateľ e-mail prijal, ale zlyhá uloženie stavu, výsledok zostáva úspešný a UI odporučí neposielať znova. Testy používajú náhradu odosielateľa, reálne e-maily sa neposielali. Celkom 50 automatických testov prešlo. Pracovný právny podklad je v `PRAVNY_BRIEF_PRED_SPUSTENIM.md`.

1. **Predajný rozsah a dokumenty:** doplniť predajcu po založení s. r. o., podporu a rozsah úprav, zmenu termínu, ukončenie po 12 mesiacoch; pripraviť podklady pre VOP, reklamácie, odstúpenie a ochranu údajov. Zdravotné údaje v RSVP vyžadujú osobitné riešenie. Nepublikovať neúplné právne dokumenty ako hotové.
2. **Fakturácia a checkout:** účtovník potvrdí daňový režim, doklady a zahraničných dodávateľov; doplniť príslušné údaje, informovanie, potvrdenia a evidenciu pri nákupe. Následne vyskúšať celý platobný/onboardingový proces, zlyhania a refundáciu.
3. **Ďalšie API a ochrana formulárov:** preveriť balíky a stav pri odosielaní ubytovacích e-mailov, limity/spam, zrušenie prístupov a obnovu pozvánok. Krok 1 nie je úplný bezpečnostný audit všetkých funkcií.
4. **Prevádzka a retencia:** zálohy a skúšobná obnova, monitoring, výmaz/export, vymazanie storage súborov pri rušení projektu, limity a komerčné plány poskytovateľov.
5. **Akceptačná svadba:** mobil, editor, dlhé mená, program s ďalšími bodmi, e-maily, fyzická tlač a sken QR, jednotlivé aj hromadné PDF.
6. **Prvý asistovaný predaj**, až keď budú vyššie uvedené podmienky uzavreté; následne otvorenie automatických objednávok.

Už hotové: galéria Signature/Atelier vrátane samostatného živého testu 20 kontrol; detaily v `GALERIA_PO_SVADBE.md`. Historický audit `AUDIT_PRED_PRVYM_PREDAJOM_2026-11-05.md` obsahuje pôvodné zistenia pred týmito opravami.
