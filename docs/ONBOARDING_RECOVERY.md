# Spoľahlivé dokončenie objednávky — 20. 11. 2026

## Zmeny

- Stripe podpis, stav complete/paid, režim payment, EUR a presná cena zo spoločného cenníka sú podmienkou aktivácie. Identifikátor objednávky je vždy Stripe Checkout Session ID. Testovacie platby sa na produkcii štandardne nepovoľujú.
- Dokončenie webhookom a návratovou stránkou používa tú istú databázovú úlohu. Atómový claim, päťminútová lehota a jedinečný token bránia súbežnému spracovaniu. Serverové routy majú limit 60 sekúnd. Ďalší pokus môže prevziať prerušenú úlohu až po vypršaní lehoty; starý proces nemôže prepísať jej stav.
- Identita vzniká cez Auth generateLink bez odoslania e-mailu. Projekt, základný obsah a checkpoint pripravenosti sa uložia v jednej transakcii. Prístupový e-mail sa posiela až potom.
- Rozpracovaný prístupový odkaz aj presný obsah e-mailu vrátane odosielateľa sú šifrované AES-256-GCM v serverovej outbox evidencii. Opakovanie po neistom výsledku posiela rovnaké telo aj Resend idempotency key. Po potvrdenom dokončení sa produkčný šifrovaný obsah odstráni. Verejná návratová API odpoveď produkčný prístupový token nevracia.
- Produkčné dodanie vyžaduje nastavený Resend a odosielateľa. Pri chýbajúcej konfigurácii sa objednávka nedokončí neoveriteľným náhradným e-mailovým tokom. Overená bola prítomnosť názvov produkčných premenných, nie platnosť kľúčov či doručiteľnosť domény.
- Oneskorené úspešné platby spracúva aj checkout.session.async_payment_succeeded. Nezaplatená platba projekt neaktivuje. Vypršaný checkout zastaví čakanie.
- Návratová stránka rozlišuje čakanie na platbu a prípravu projektu, umožňuje nové overenie a pri chybe zákazníka upozorní, aby platbu neopakoval.
- Existujúci účet sa rieši recovery odkazom. Historický záznam už odoslaného prístupu sa rešpektuje. Nová objednávka sa nikdy nepripája k starému projektu iba podľa e-mailu. Kolízia slugu vytvorí príponu. Archivovaný alebo nezaplatený projekt sa opakovaním neaktivuje.

## Overenie

- 88 automatických testov v tests/*.test.mjs prešlo. Nové scenáre zahŕňajú súbeh, výpadok projektu, neisté prijatie e-mailu, zlyhanie checkpointu po prijatí, obnovenie bez ďalšieho odoslania, staršie záznamy, šifrovanie a Stripe validácie.
- Produkčný build prešiel.
- 32 databázových kontrol prešlo v produkčnej databáze s výhradne syntetickými údajmi a úplným rollbackom. Zahŕňajú skutočnú chybu zápisu obsahu: projekt ani checkpoint sa vtedy neuložia.
- Dve samostatné súbežné databázové transakcie nad rovnakou syntetickou objednávkou vrátili presne raz claimed a raz busy. Syntetický job bol odstránený; zostatok 0. Neboli vytvorené Auth účty ani projekty v tomto teste.
- Migrácia 20261120000000_recover_paid_onboarding.sql bola aplikovaná a zaevidovaná v histórii. Testovacie Auth riadky v rollback teste nevolajú Auth API ani neposielajú správy.
- Neboli vykonané platby ani odoslané e-maily. Z tohto overenia nevyplýva skutočné doručenie do schránky ani úplná prevádzková pripravenosť.

## Prevádzkové hranice a bezpečná náprava

1. Obnova sa spustí pri ďalšom overenom Stripe evente alebo overení objednávky na návratovej stránke. Samostatný periodický recovery worker ani upozornenie na každú chybu zatiaľ neexistuje. Prevádzkovateľ musí sledovať failed a processing po lehote.
2. Resend drží idempotency key 24 hodín. Ak sa začalo odoslanie a jeho prijatie nebolo uložené, po 23 hodinách systém automatické odoslanie zastaví. Človek musí overiť výsledok u poskytovateľa; nevymazať checkpointy a nespúšťať naslepo nový e-mail. Neisté prijatie nie je dôvod na druhú platbu.
3. Prijaté poskytovateľom neznamená doručené do schránky. Ešte treba overiť bounce/spam, DNS, platnosť odkazu a reálne prihlásenie. Existujúce prihlásenie obsahuje obnovu hesla; jej skutočné doručenie tiež vyžaduje test. Expirácia Auth odkazu sa týmto nemení a pri opakovaní sa úmyselne negeneruje iný odkaz pod rovnakým idempotency key.
4. Šifrovanie používa ONBOARDING_ENCRYPTION_KEY, ak je nastavený; inak doménovo oddelený odvodený kľúč zo serverového SUPABASE_SERVICE_ROLE_KEY. Pri rotácii musí byť zabezpečené dočítanie rozpracovaných obálok starým kľúčom alebo riadená náprava. Nový samostatný kľúč nenastavovať uprostred rozpracovaných úloh bez migrácie. Tajné hodnoty sa pri tomto overení nečítali ani nemenili.
5. Staršie objednávky s vlastným external_order_id odlišným od Stripe Session ID potrebujú pred opakovaním individuálne mapovanie; nový tok používa kanonické ID. Presná cenová kontrola predpokladá dnešný cenník bez kupónov. Pred zmenou cien či zavedením zliav doplniť verziovaný záznam ceny objednávky.
6. Notifikácia prevádzkovateľa je samostatný best-effort krok po dodaní. Jej výpadok neruší hotový projekt; nejde o úplný systém prevádzkových alertov.
7. Refundácie/spory, faktúry, potvrdenie zmluvy a skončenie služby touto opravou nevznikli. Predajné prepínače zostávajú zatvorené.

## Ďalšia akceptačná skúška

Riadene vykonať skúšobnú objednávku cez Stripe a doručenie na určenú testovaciu schránku: nový/existujúci účet, okamžité otvorenie, nastavenie hesla, správny projekt/balík, opakovanie stránky, expirácia a náprava. Vyžaduje samostatne dohodnuté testovacie prostredie a adresáta. Verejný predaj sa tým automaticky neotvára.

## Dokumentácia poskytovateľov

- [Supabase generateLink](https://supabase.com/docs/reference/javascript/auth-admin-generatelink)
- [Resend idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys)
- [Stripe webhooky](https://docs.stripe.com/webhooks)
