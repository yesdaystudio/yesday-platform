# Pred spustením e-shopu

## Uvítací a registračný e-mail

- Zapojiť vlastnú transakčnú e-mailovú službu a odosielaciu doménu YesDay.
- Nastaviť SPF, DKIM a DMARC pre spoľahlivé doručovanie.
- Pripraviť značkový uvítací e-mail s oslovením páru, názvom balíka a bezpečným registračným odkazom.
- Novému účtu poslať nastavenie hesla; existujúcemu účtu poslať obnovenie prístupu.
- Otestovať nový aj existujúci e-mail, expiráciu odkazu, opakované odoslanie a Spam/Reklamy.
- V Supabase nastaviť produkčný Site URL a povolené presmerovania na `https://www.yesdaystudio.com/reset-password`.

## Faktúra a Stripe

- Zachovať dva samostatné e-maily: osobný uvítací e-mail YesDay a účtovný e-mail s faktúrou.
- V ostrom Stripe Checkoute zapnúť vytvorenie faktúry pre jednorazovú platbu.
- Zbierať fakturačné meno a adresu; pri firemnom nákupe aj potrebné firemné údaje.
- Doplniť do Stripe obchodné meno, sídlo, IČO, DIČ, IČ DPH podľa skutočného stavu a logo YesDay.
- S účtovníkom potvrdiť sadzbu DPH, číslovanie dokladov, povinné náležitosti a spôsob exportu do účtovníctva.
- V uvítacom e-maile uviesť, že faktúra príde samostatne; faktúru sprístupniť aj v klientskej zóne.
- Pred prepnutím na live kľúče otestovať úspešnú platbu, zamietnutú platbu, Apple Pay, duplicitný webhook, refundáciu a doručenie oboch e-mailov.

## Zhoda ukážky a reálneho systému

- Aplikovať všetky produkčné databázové migrácie vrátane variantu písma, farby textu a dopravy v RSVP.
- Skontrolovať Diana, Botanique a Penelope: web, editor, pozvánka, QR kartička, RSVP, hostia a ubytovanie.
- Overiť balíky Essential, Signature a Atelier a ich oprávnenia.
- Skontrolovať RLS pravidlá, zálohy databázy a prístup iba vlastníka ku klientskej zóne.
