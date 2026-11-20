# Audit procesov YesDay — 20. 11. 2026

**Rozsah:** kontrola súčasného kódu a lokálnych automatických testov. Dnes znovu prešlo všetkých 67 testov v `tests/*.test.mjs`; testy používajú náhrady platobných/e-mailových služieb. Neboli vykonané reálne platby, poslané e-maily, čítané produkčné klientské údaje ani menené poskytovateľské účty. Toto nie je potvrdenie end-to-end prevádzkovej pripravenosti. Staršie živé skúšky majú vlastné dátumy v `SPUSTENIE_STAV.md`.

## Oprava po audite — 20. 11. 2026

Pôvodné nálezy nižšie zachytávajú stav pred opravou. Následne bolo doplnené bezpečné prevzatie prerušenej úlohy, transakčné pripravenie projektu pred e-mailom, šifrovaná evidencia presného prístupu pre opakovanie, oneskorené potvrdenie platby a nové overenie objednávky. Prešlo 88 automatických testov, build, 32 rollback databázových kontrol a samostatná skúška súbehu (jeden claim, druhý busy; syntetické údaje odstránené). Migrácia je aplikovaná. Podrobnosti, hranice obnovy a prevádzkový postup: [ONBOARDING_RECOVERY.md](ONBOARDING_RECOVERY.md).

Nálezy 1 a 2 a časť nálezov 3 a 5 sú týmto opravené v kóde. Reálne doručenie/prihlásenie, prevádzkové alerty, fakturácia, refundácie a koniec služby zostávajú otvorené. Neboli vykonané platby ani odoslané e-maily; verejný predaj zostáva zatvorený.

## Pôvodná matica procesu a jeho kontroly

| Proces | Čo je dnes v kóde / overené | Čo uzavrieť a akceptačný výsledok |
| --- | --- | --- |
| Pred nákupom | Balík, cena, dizajn, demo; predajné prepínače | Firma, úplné informácie a VOP, potrebné vyhlásenia, verzia dokumentov a potvrdenie na uchovateľnom médiu. |
| Platba | Stripe checkout a serverová validácia, ochrana opakovania; testy prešli | Úspech, zamietnutie, opustenie, návrat bez platby, obnova stránky a dvojklik bez ďalšej platby. Test metód skutočne povolených v Stripe. |
| Webhook a účet | Overenie Stripe podpisu, kontrola zaplatenia, evidencia onboarding_jobs a claims, unikátny projekt | Súbeh webhooku s návratom z checkoutu, opakovaný event, starý účet, rovnaký slug; presne jeden správny projekt a príslušné prístupy. |
| Chyba počas prípravy | FAILED sa dá spracovať znovu; PROCESSING sa opätovne nepreberá | Pád procesu uprostred operácie: časový limit alebo riadená obnova zaseknutej úlohy bez duplicít a bez resetu živého procesu. |
| Dodanie prístupu | Uvítanie, invite/recovery odkaz, stav odoslania; návratová stránka vie znovu overiť objednávku | Doručenie, spam, oneskorenie, expirácia, nový odkaz bez ďalšej kúpy; okamžité prihlásenie aj chyba po odoslaní e-mailu. |
| Doklad | V kontrolovanom checkoutu nie je invoice_creation ani samostatná fakturačná integrácia | Zvoliť správny postup s účtovníkom; doklad má údaje firmy, cenu a evidenciu platby. Overiť doručenie aj opätovné získanie. |
| Editor a publikovanie | Editor, web, PDF/QR a program existujú | Uloženie/obnova, dlhé mená, všetky dizajny a oprávnenia balíkov; klient chápe, čo už vidia hostia. Teraz nie je univerzálny prepínač koncept/publikovať. |
| Hostia a RSVP | Validácia, opravy a atómové zápisy, limity; testy prešli | Reálna rodina/deti/odmietnutie/oprava, správne počty a izolácia; právne vyriešiť zdravotné údaje a odpoveď za ďalšiu osobu. |
| Ubytovanie | Oprávnenia, draft, odoslanie, stavy a pripomienková úloha | Adresát, izba, preview, zmena hotela/termínu a výpadok; ukázať rozdiel „prijaté poskytovateľom“ a skutočné doručenie. Cron a DNS/doručenie dnes neboli živo overené. |
| Galéria a tlač | Existujú; staršie integračné skúšky galérie prešli | Nové PDF skutočne stiahnuť/vytlačiť a naskenovať QR; galerijné limity, mobil, skrytie a odstránenie súborov. |
| Podpora a reklamácia | Kontaktný e-mail a chybová stránka po objednávke | Evidencia požiadavky, vlastník prípadu, odpoveď, náprava a uzavretie; primerané overenie klienta bez hesiel. Určiť pracovné dni a lehotu odpovede. |
| Odstúpenie a refundácia | Pracovný text; refund/dispute handler sa pri kontrole nenašiel | Online odstúpenie, prijatie a potvrdenie, rozhodnutie, refund Stripe + účtovná oprava + správne ukončenie/prístup. Môže byť riadené manuálne, nesmie sa stratiť medzi troma systémami. |
| Koniec služby | Potvrdené obchodné pravidlá, funkčná automatizácia/export sa nenašli | Upozornenia 30/7 dní, vypnutie po 12 mesiacoch, súkromný export ďalších 30 dní, následný výmaz storage aj metadát s overením výsledku. |
| Údaje, incident, obnova | Sprísnené prístupy, limitovanie, čiastkové testy | Postup žiadosti o prístup/výmaz, provider retencie, incidentné kontakty, skúška obnovy záloh a nevzkriesenie zmazaných dát. Uzavrieť historické zistenie prístupov. |

## Konkrétne nálezy zo súčasného kódu

### 1. Zaseknutá objednávka v PROCESSING

`lib/onboarding/orchestrator.js`, `claimOnboardingJob`: preberá iba PENDING/FAILED. V tomto toku sa nenašiel mechanizmus po vypršaní spracovania ani obnovovacia úloha. Bežná výnimka nastaví FAILED, ale tvrdé prerušenie procesu môže obísť catch. Potom návratová stránka opakovane dostáva stav spracovania a zastaví automatické opakovanie po obmedzenom počte pokusov. Pred spustením definovať detekciu a bezpečné obnovenie; nevyriešiť iba resetovaním všetkých PROCESSING na PENDING.

### 2. Prístupový e-mail môže predbehnúť hotový projekt

Orchestrátor pripravuje identitu a posiela prístup skôr než dokončí vytvorenie projektu a jeho obsahu. To nemusí znamenať chybu pri bežnom priebehu, ale musí sa preveriť okamžité otvorenie e-mailu a zlyhanie medzi odoslaním a dokončením projektu. Klient nesmie zaplatiť znovu, aby získal službu. Nastaviť stav čakania/nápravu a upozornenie obsluhe.

### 3. Oneskorené platby a refundácie nemajú úplný tok

`lib/stripeCheckoutOnboarding.js` spracúva iba checkout.session.completed a požaduje paid. Ďalšie eventy ignoruje. Buď obmedziť nákup na skutočne podporované okamžité metódy, alebo doplniť a otestovať oneskorené potvrdenie/zlyhanie. Refundácia a spor nezmenia projekt automaticky cez tento handler; treba jasný manuálny postup alebo integráciu. Overiť aj čiastočnú refundáciu — nemá automaticky rovnaké dôsledky ako zrušenie celého plnenia. [Stripe — webhooky](https://docs.stripe.com/webhooks).

### 4. Fakturácia a zmluvné potvrdenie sú otvorené

Checkout posiela produkt, cenu a zákaznícky e-mail. V kontrolovanej implementácii sa nenašlo vytváranie faktúry, príslušné fakturačné údaje, verzia prijatých VOP ani plné zmluvné potvrdenie. Nastavenia samotného Stripe účtu dnes neboli kontrolované; samy nenahrádzajú chýbajúce aplikačné kroky. [Stripe — potvrdenia a faktúry](https://docs.stripe.com/receipts).

### 5. Bezpečné opakovanie checkoutu nie je úplný audit onboardingu

Testy idempotencie checkoutu a ubytovacieho e-mailu nepreukazujú všetky súbehy a vedľajšie efekty orchestrátora. Overiť aj prípad „odosielateľ prijal uvítací e-mail, ale aplikácia nestihla uložiť výsledok“, opakované generovanie odkazov a prevádzkové upozornenia pri chybe. Nepovažovať iba logovanie chyby za zabezpečenú reakciu človeka.

## Minimálny prevádzkový postup pri chybe po platbe

1. Nájsť platbu a objednávku podľa bezpečného identifikátora; klientovi povedať, aby platbu neopakoval. Nežiadať heslo alebo kompletné údaje karty.
2. Skontrolovať skutočný Stripe stav, onboarding job a projekt; neprepisovať paid podľa screenshotu od klienta.
3. Rozlíšiť chybu projektu, účtu, e-mailu a faktúry; opraviť iba zlyhanú časť bez vytvorenia druhej objednávky.
4. Ak je nutný nový prístup, použiť bezpečný overený kanál a predchádzajúci odkaz riešiť podľa Auth mechanizmu. Nikomu neposielať cudzí projekt.
5. Overiť výsledok, zaznamenať zásah a uzavrieť požiadavku s klientom. Pri refundácii prepojiť platbu, doklad aj dostupnosť služby.

Zodpovedné osoby a reálne reakčné lehoty ešte určí Diana/manžel. Tento návrh nie je tvrdenie, že máme hotovú zákaznícku pohotovosť.

## Čo musí obsahovať záverečný protokol skúšobnej svadby

Dátum a verzia nasadenia, balík/dizajn, syntetický účet, scenár, očakávaný a skutočný výsledok, dôkaz bez citlivých údajov, prípadná oprava a nové overenie. Zahrnúť zamietnutie aj opakovanie platby, súbeh a výpadky, nový/existujúci účet, e-mail a doklad, správny balík, mobilný editor, PDF/QR, RSVP, ubytovanie, galériu, reklamáciu/refundáciu a skončenie/výmaz. Na prvý skúšobný priechod nepotrebujeme údaje s. r. o.; produkčné účtovné a právne údaje musia byť doplnené pred skutočným predajom.
