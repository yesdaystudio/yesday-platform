# Pred spustením e-shopu

## Ranná priorita – 20. 10. 2026

- [x] Aplikovať migráciu `supabase/migrations/20261019000000_align_real_experience_with_demo.sql` v produkčnom Supabase.
- [x] Overiť produkčné stĺpce pre výber písma, farby a požiadavku na dopravu v RSVP.
- [ ] Vyskúšať uloženie písma a farby cez prihlásený reálny editor Botanique aj Penelope.
- [ ] Odoslať jednu skúšobnú RSVP odpoveď s dopravou a skontrolovať ju v záložke Hostia.

## Uvítací a registračný e-mail

- [x] Pripraviť značkový uvítací e-mail s oslovením páru, názvom balíka a bezpečným registračným odkazom.
- [x] Novému účtu pripraviť nastavenie hesla a existujúcemu účtu obnovenie prístupu.
- [x] Pripraviť priame odoslanie ubytovacieho e-mailu cez YesDay s automatickým záznamom dátumu odoslania.
- [ ] Založiť Resend, pridať API kľúč do Vercelu a nastaviť overeného odosielateľa YesDay.
- [ ] Nastaviť SPF, DKIM a DMARC pre spoľahlivé doručovanie.
- [ ] Otestovať nový aj existujúci e-mail, expiráciu odkazu, opakované odoslanie a Spam/Reklamy.
- [ ] V Supabase skontrolovať produkčný Site URL a povolené presmerovanie na `https://www.yesdaystudio.com/reset-password`.

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
