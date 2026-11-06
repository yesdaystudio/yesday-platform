# Botanique v3 — 6. 11. 2026

Referencia: používateľkou priložená biela botanická pozvánka s akvarelovými zelenými listami naľavo hore a napravo dole. Nové ilustrácie vznikli vstavaným imagegen, nie CLI. Súbory zachovávajú priehľadnosť:

- `public/templates/botanique/foliage-top-v3.png`
- `public/templates/botanique/foliage-bottom-v3.png`

Použitie: hlavná pozvánka, kartička k stolu, QR, skutočné hero a homepage náhľad. Text zostáva živý/editovateľný. Biela namiesto krémového podkladu, bez tmavej menovky a rámčeka. Mená Cormorant Garamond alebo zvolený editorial variant; spojka Great Vibes. Ostatné dizajny zostávajú zachované.

## Generačné prompty

Top:

Create a production botanical watercolor illustration asset for a wedding invitation and matching website, inspired by the uploaded reference's painted foliage only. Transparent background. A single tall organic cascading arrangement growing from upper left, with fine branching sage eucalyptus, olive-green pointed leaves, pale translucent fern-like sprigs and richer dark green leaves, hand-painted watercolor pigment blooms and subtle loose pale green speckles. Composition mostly vertical, wider lush upper left tapering into fine stems below; leaves individually refined and natural, generous transparent gaps, delicate but clearly visible. No flowers, no text, no invitation card, no envelope, no linen, no mockup, no shadows, no border, no photoreal leaves. Flat scanned artist watercolor, sophisticated botanical wedding stationery, fresh white-friendly sage/olive palette. High resolution.

Bottom:

Production watercolor botanical corner illustration asset on transparent background for elegant wedding stationery, matching sage eucalyptus and olive green watercolor foliage of the user's uploaded invitation reference. An asymmetric lush arrangement in LOWER RIGHT corner, fine curved stems climbing up right edge and delicate sprays extending left along bottom edge. Natural pointed dark olive leaves interleaved with pale translucent round eucalyptus leaves and light feathery sprigs. Small subtle pale sage pigment splashes. Art occupies right and bottom, transparent center and upper left. Refined hand-painted watercolor, fresh white-friendly, not vector or cartoon. No flowers, no text, no paper rectangle, no invitation, no envelope, no photography, no shadows. Different natural leaf arrangement from a top left cascading branch; complementary artwork, not a mirrored clone.

## Overenie

Produkčný build. Lokálna vizuálna kontrola Safari: hero a zostava pozvánka/kartička/QR; texty aj motívy sa vykreslili. Fyzická tlač a finálna kontrola exportovaného PDF týmto nie sú potvrdené.

## Revízia v4: celé listy a rozpité pozadie

Na pripomienku používateľky zmenené umiestnenie ilustrácií na kladné vnútorné odsadenie s object-fit contain, bez záporného orezania. Výraznejšie listy na pozvánke, kartičke k stolu, QR aj hero a náhľade. Nový priesvitný akvarelový podklad `public/templates/botanique/watercolor-wash-v4.png`, vstavaný imagegen, spoločný pre tlačoviny a web. Pigmentové škvrny môžu pokračovať do okraja hero, listové vetvy sú celé v kompozícii.

Prompt:

Use case: stylized-concept. Asset type: transparent watercolor wash overlay for elegant botanical wedding stationery and matching website. Paint a large irregular pale sage green and soft olive watercolor wash, pigment dissolving in water into paper with feathery cauliflower blooms, wet-on-wet granulation, softly pooled edges, several tiny scattered olive pigment droplets outside. Asymmetric organic vertical composition, richly textured translucent pale green, more pigment toward upper left and lower right, almost clear central area for text. Actual transparent background with smoothly fading pigment alpha, no solid background, no rectangular edges, no leaves, no flowers, no text, no mockup, no shadows, not a digital smooth gradient. Delicate authentic scanned watercolor on white-friendly palette, wash must be visible yet pale enough behind dark text. All marks and splashes comfortably inside canvas with transparent margin on every side.

Finálna korekcia podľa ďalšej pripomienky: jemnejšia mierka listov (hero 42/51 vw, tlačoviny 52/65 %), približne 70–74 % krytie listov a iba 16–23 % krytie akvarelu. Viac bieleho priestoru. Dekoratívne vrstvy tlačovín sú v izolovanom pozadí, aby neprekrývali text ani biele ochranné okolie QR.

Posledná pripomienka: odstránený rozpíjaný akvarelový podklad označený ako lišajník zo všetkých použití (hero, tlačoviny, homepage náhľad). Zostávajú zjemnené celé listové vetvičky na bielom. Generovaný súbor zostáva historický, produkt ho nepoužíva.

## Oprava interpretácie pripomienky

Používateľka označením „lišajník“ myslela jemné rozkonárené výplňové vetvičky medzi listami vľavo hore, nie akvarelový podklad. Podklad sa vracia s rovnakým jemným krytím ako v schválenej zjemnenej verzii. Horná ilustrácia sa čistí vstavaným imagegen do nového `foliage-top-clean-v5.png`; široké olivové a okrúhle eukalyptové listy zostávajú. Dolný pravý prvok sa nemení.

Edit prompt:

Edit this existing transparent watercolor foliage asset precisely. Remove ALL pale feathery fern/lichen/moss-like filler sprigs, the tiny intricate branched fronds interspersed between the leaves. Keep ONLY the broad pointed olive leaves and round eucalyptus leaves with their connecting stems and sparse pigment dots. Preserve the exact overall upper-left cascading silhouette, placement, scale, watercolor rendering, sage/olive palette and all main leaves as closely as possible. Replace removed filler with clean transparency, do not add anything, no flowers, no new foliage, no background. Maintain actual transparent alpha background and original portrait canvas. This is a cleanup of lichen-like filler, not a redesign.
