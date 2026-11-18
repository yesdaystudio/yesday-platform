# Predajná homepage — 18. 11. 2026

Zadanie: zachovať elegantný vizuál a vysvetliť YesDay ako digitálneho svadobného pomocníka, nie iba web a pozvánku. Bez aktivácie predaja.

## Zmeny

- Úvod: „Menej správ hosťom. Viac pokoja pred svadbou.“ Konkrétne potvrdenia účasti, informácie pre hostí a prehľad bez prepisovania; demo bez registrácie a orientačná cena.
- Nová kompaktná navigácia s logom; mobilné menu sa rozbalí na vyžiadanie, zavrie po voľbe a cez Escape. Na mobile hlavička nezostáva nad galériou pri scrollovaní.
- V mobile vodorovná galéria deviatich dizajnov, viditeľný začiatok ďalšej karty, šípky a počítadlo. Desktop si zachováva mriežku a pôvodné vizuály s rôznymi menami.
- Kratšie slovenské popisy, jednotné „Vyskúšať šablónu zadarmo“ a vysvetlenie dema.
- Tri klikateľné interaktívne ukážky namiesto videí: vzorové RSVP → aktualizované počty a odpoveď → hotel/izba a pripravený e-mail. Stav je iba v pamäti otvorenej stránky. Bez reálnych platieb, údajov návštevníka a odosielania e-mailov.
- Celý existujúci ClientDashboard alebo ClientAccommodation je dostupný na rozbalenie až na želanie. Kompaktná ukážka a plný prehľad používajú rovnaké responses. E-mailový náhľad používa existujúci buildAccommodationEmailDraft, ktorého implementácia sa nemenila (iba export).
- Nadpis „Krásny zážitok pre hostí. Menej starostí pre vás.“ zachovaný a zlúčený s praktickým dôkazom namiesto ďalších opakovaných benefitov.
- Balíky vysvetľujú výsledok; odstránený nepodložený štítok „Najobľúbenejšia voľba“ a odborné „bespoke/flow/dashboard“ z hlavnej ponuky.
- Osobný panel: skrátený príbeh Diany, mamy dvoch detí, podľa jej vlastného textu. Žiadna fiktívna fotografia, referencie či životopis. Vedľa dodanie prístupu po potvrdení platby, vlastné úpravy, digitálna tlač a podpora cez existujúci kontaktný e-mail. Osobná tvorba je Atelier.
- FAQ a záverečná výzva k vyskúšaniu. Jazyk dokumentu sk a metadata zodpovedajú pomocníkovi.

## Overenie

Vizuálna kontrola Safari desktop a responzívna šírka 393 px: hero, karta/šípka galérie (1/9 → 2/9), menu otvorenie/zavretie po odkaze a osobný panel. Funkčné RSVP 4 → 6 hostí a 2 → 3 žiadosti o ubytovanie; rovnaká Anna a Michal sa zobrazili v plnom ClientDashboard. Príprava e-mailu s izbou 305 zobrazila správnu izbu aj hotel a kontakt vzorového hosťa. Nič sa neodoslalo.

Automatické kontroly a finálny build zapisovať až po výsledku. Nejde o meranie skutočnej konverzie ani prísľub nákupu do 15 sekúnd.

## Otvorené voliteľné doplnenia

Skutočná fotografia Diany, ak ju dodá na publikovanie. Skutočné krátke videozáznamy možno doplniť neskôr; aktuálne tri ukážky sú interaktívne, nie video. Právne, účtovné a prevádzkové podmienky predaja stále rieši samostatný launch checklist.

Finálne kontroly: 12 automatických testov (ubytovací e-mail a navigácia dema) prešlo, produkčný build prešiel a git diff --check bez chýb. Predajné prepínače ani checkout API neboli zmenené; verejný predaj sa neaktivuje.
