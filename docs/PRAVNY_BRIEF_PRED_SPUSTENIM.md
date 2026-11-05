# Podklady pre podmienky a prvý predaj YesDay

Pracovný podklad k 5. 11. 2026. Toto nie sú zverejniteľné VOP; chýbajú potvrdené údaje predajcu a nižšie uvedené obchodné rozhodnutia. Cieľom je dať právnikovi a účtovníkovi konkrétny opis produktu, nie všeobecnú šablónu e-shopu.

## Potvrdené

- Značka: YesDay Studio, web `https://www.yesdaystudio.com`.
- Predaj cez pripravovanú slovenskú s. r. o. Údaje a stav registrácie zatiaľ nie sú potvrdené.
- Web aj galéria majú byť dostupné **12 mesiacov po svadbe**. Rozhodnutie potvrdila používateľka 5. 11. 2026.
- Jednorazové balíky: Essential 129 €, Signature 249 €, Atelier od 449 €. Konečný daňový režim a formuláciu cien potvrdí účtovník podľa predajcu.
- Produkt je digitálna služba so svadobným webom, klientskym editorom, zberom RSVP, správou hostí a stiahnuteľnými PDF. Systém aktuálne nezabezpečuje objednanie fyzickej tlače ani dopravu tlačovín.
- Signature a Atelier obsahujú navyše ubytovanie a jeho komunikáciu, personalizované QR pozvánky a fotogalériu. Galéria má limit 100 webových fotiek, najviac 2 MB po spracovaní na fotografiu. Nie je archívom originálov.
- Údaje a konkrétny vzhľad si pár upravuje v editore. Atelier zahŕňa individuálnu tvorbu; presný rozsah, termín a schvaľovanie treba zachytiť v individuálnej objednávke.
- Online platby sú momentálne zatvorené. Záujem cez e-mail nie je automatická platená objednávka.
- Essential a Signature zahŕňajú editor na vlastné úpravy a pomoc s jeho používaním (potvrdené používateľkou). Pomoc zahŕňa prihlásenie, ovládanie editora, používanie PDF/QR/galérie a riešenie funkčných chýb. Osobné písanie textov, grafické úpravy na objednávku a príprava svadobného obsahu pracovníkom YesDay nie sú zahrnuté; individuálna tvorba sa dohodne v Atelieri. Tým nie sú dotknuté zákonné práva pri vadách služby.

## Rozhodnutia, ktoré ešte treba uzavrieť

| Téma | Potrebné doplnenie |
| --- | --- |
| Predajca | Obchodné meno, sídlo, IČO, registračné údaje, DIČ/IČ DPH podľa stavu, zmluvný a reklamačný kontakt. |
| Začiatok služby | Od ktorého momentu beží dodanie: zaplatenie, doručenie prístupu, dokončenie úprav? Koľko času pred svadbou môže zákazník kúpiť službu? |
| Koniec služby | Upozornenie pred uplynutím 12 mesiacov, lehota na export, možnosť predĺženia, osud údajov a záloh. Automatizácia zatiaľ nie je hotová. |
| Zmena termínu | Ako prepočítať koniec služby pri presunutí svadby, či existuje maximálne trvanie od nákupu a prípadný doplatok. |
| Podpora | Rozsah je potvrdený: editor a pomoc s jeho používaním. Ešte určiť kanál, pracovné dni a reálnu lehotu odpovede. Nesľubovať pohotovosť bez prevádzkového zabezpečenia. |
| Výstupy | Rozmery PDF a rozsah licencie, počet dizajnových zmien, kto kontroluje mená/dátumy pred tlačou, ktoré úpravy robí pár a ktoré YesDay. |
| Zrušenie svadby | Obchodný postup mimo zákonného odstúpenia a reklamácie; tieto situácie treba odlišovať. |
| Verejnosť webu | Web je dostupný návštevníkom s odkazom. Nie je zabezpečený PIN-om. Zakúpenie neznamená, že obsah vidia len menovite pozvaní hostia. |
| Fotografie | Oprávnenie nahrávať a zverejňovať fotky, oprávnenia od fotografa a fotografovaných ľudí podľa okolností; použitie v portfóliu osobitne. |

## Právnik: čo má posúdiť a pripraviť

1. Klasifikáciu kombinácie priebežnej digitálnej služby, PDF obsahu a prípadnej zákazkovej práce; informačné povinnosti a zodpovednosť za vady digitálneho plnenia.
2. VOP, reklamačný postup, poučenie a formulár na odstúpenie; správny súhlas so začatím plnenia pred uplynutím lehoty a jeho účinky pre jednotlivé časti produktu. Samotná personalizácia ani prvé prihlásenie sa nesmú automaticky vyhlásiť za stratu práva odstúpiť.
3. Finálny záväzný platobný krok, potvrdenie objednávky/zmluvy na trvanlivom médiu a evidenciu prijatého znenia dokumentov a potrebných súhlasov.
4. Funkciu na online odstúpenie v rozsahu aktuálnych pravidiel; nepreberať staré VOP s už nefunkčnou platformou ODR. [Zákon 108/2024, aktuálne znenie](https://static.slov-lex.sk/static/SK/ZZ/2024/108/20260927.html).
5. Ochranu údajov zákazníkov aj hostí vrátane alergií, ktoré môžu predstavovať zdravotné údaje. Právne základy, minimalizáciu, informovanie, retenciu, práva dotknutých osôb a roly YesDay/páru. Posúdiť aj odpovedanie za ďalších členov domácnosti. [GDPR](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679).
6. Zmluvy s dodávateľmi, krajiny spracovania/prenosy, prípadné sprostredkovateľské podmienky pre klienta podľa skutočného vzťahu. Podnikateľská služba nemá automaticky domácu výnimku len preto, že svadba je súkromná.
7. Rozsah licencií ku grafike/fontom/fotografiám, oprávnenia zákazníka k výstupom a zmysluplné limity zodpovednosti bez vylúčenia zákonných práv spotrebiteľa.

## Skutočný tok údajov

| Časť | Údaje / prístup |
| --- | --- |
| Platba a onboarding | E-mail klienta, meno páru, balík, vybraný dizajn a identifikátory platby/projektu. Stripe + server YesDay; prístup a účet cez Supabase, e-mail cez Resend. |
| Klientska zóna | Majiteľ číta vlastný projekt a hostí. Pravidlá v databáze oddeľujú účty a bránia vlastnej zmene balíka, vlastníctva či platobného stavu. |
| Verejný web | Zvolené mená, dátum, miesta, program a texty. Neposiela klientsky e-mail ani údaje o platbe. |
| RSVP | Mená dospelých/detí, účasť, strava, alergie; podľa balíka ubytovanie, kontakt a doprava. Vidí pár a oprávnená prevádzka služby. |
| Personalizovaný odkaz | Držiteľ odkazu vie otvoriť príslušnú pozvánku a odoslať/upraviť odpoveď. Token nie je dôkaz totožnosti konkrétneho človeka. |
| Ubytovací e-mail | Len prihlásený majiteľ aktívneho zaplateného Signature/Atelier, potvrdenému hosťovi žiadajúcemu ubytovanie. Príjemca sa berie z uloženého RSVP, nie z voľne zadaného API adresáta. |
| Galéria | Pár nahráva webové kópie fotiek a zapína zverejnenie. Súkromný storage vydáva dočasné odkazy. Po skrytí môžu už vydané odkazy fungovať do vypršania; už stiahnuté fotky nemožno zobrať späť. |
| Dodávatelia | Vercel (hosting), Supabase (účty, databáza a storage), Stripe (platby), Resend (transakčné e-maily). Aktuálne zmluvné subjekty, regióny a DPA treba potvrdiť podľa účtov. |

## Účtovník

Potvrdiť daňový režim novej s. r. o., doklady ku každej platbe a refundácii, fakturačné údaje a číslovanie, zahraničné služby a prípadnú registráciu podľa § 7a. Samotný nízky obrat nevyrieši povinnosti pri zahraničných službách. Predaj mimo SR zatiaľ nebol osobitne nastavený. [Finančná správa](https://www.financnasprava.sk/sk/podnikatelia/dane/dan-z-pridanej-hodnoty/registracna-povinnost-pre-dph/_1).

Tento podklad neznamená, že obchodné podmienky sú schválené alebo že je predaj pripravený. Aktuálne zostávajú otvorené aj fakturácia, celý platobný test, retencia, obnova záloh a akceptačné skúšky uvedené v `SPUSTENIE_STAV.md`.
