# Lokalni SEO – 3A DENT, Novi Beograd

Audit i izmene urađeni po okviru [claude-seo](https://github.com/AgriciDaniel/claude-seo) (`seo-local`, `seo-schema`,
`seo-plan/local-service`), prilagođeno za Beograd i opštinu Novi Beograd. Stanje: 1. novembar 2026.

**Šta ovaj audit nije mogao da proveri:** pozicije u Google mapama (geo-grid), Google Business Profile podatke
(profil nije povezan sa sajtom), obim pretrage po ključnim rečima (nema pristupa alatu za ključne reči), backlinkove.
Izbor ključnih reči ispod je zato zasnovan na tome kako pacijenti u Srbiji opisuju usluge, ne na izmerenom obimu.

## Urađeno na sajtu

| Oblast | Izmena |
| --- | --- |
| Naslovi (`<title>`) | Svaka strana ima lokaciju; usluge ciljaju upit kojim pacijenti traže uslugu: „Vađenje zuba na Novom Beogradu", „Plombe i lečenje zuba…", „Lečenje kanala zuba…", „Pregled i čišćenje kamenca…", „Proteze, krunice i mostovi…", „Lečenje desni i uklanjanje kamenca…", „Beljenje zuba i terapija afti…". Početna: „Stomatolog i zubar Novi Beograd \| 3A DENT". Svi ≤ 60 znakova. |
| Meta opisi | Lokacija + konkretne usluge + poziv na akciju; svi ≤ 160 znakova (početna je ranije imala 204 i sekla se). |
| H1 | Usluge: „{usluga} na Novom Beogradu"; stručni naziv ostaje iznad, kao nadnaslov. Lista usluga: „Stomatološke usluge na Novom Beogradu". |
| Schema `Dentist` | Dodato `medicalSpecialty: Dentistry`, `knowsLanguage`, `availableService` (7 usluga, svaka sa `@id` koji pokazuje na stranu usluge), `employee` → doktorka (`Person` sa `@id` na /o-nama). |
| `areaServed` | Novi Beograd (`AdministrativeArea`) i Beograd (`City`) sa `sameAs` na Wikipedia stranice, da pretraživači i AI asistenti razreše mesto, ne samo tekst. |
| `WebSite` | Na početnoj, sa `inLanguage: sr-Latn-RS` i vezom na ordinaciju. |
| `MedicalProcedure` | Svaka usluga ima stabilan `@id` i `alternateName` (npr. „Lečenje kanala" uz „Endodoncija"). |
| Podaci za lokalni sadržaj | U `practice.json` dodato `locative` („na Novom Beogradu"), `neighborhood` i `directions`. Prazna polja se ne prikazuju; kad se popune, kvart se pojavljuje uz adresu, a „Kako do nas" na /kontakt. |

Namerno **nije** urađeno:
- **Strane po kvartovima/gradovima** („zubar Zemun", „zubar Blok 45"…). `seo-local` to označava kao *doorway* rizik; ordinacija ima jednu lokaciju.
- **`geo` meta tagovi** – Google ih ignoriše.
- **`aggregateRating`** – nema dovoljno stvarnih recenzija na sajtu; izmišljena ocena krši Google smernice.
- **FAQPage schema je zadržana**, ali bez očekivanja: Google od maja 2026. ne prikazuje FAQ rich results ni za jedan sajt.

## Pronađeno – potrebna potvrda klijenta (kritično)

1. **NAP se ne slaže sa PlanPlus imenikom.** [PlanPlus listing 3A Dent](https://www.planplus.rs/stomatoloska-ordinacija-3a-dent/33708) navodi:
   - poštanski broj **11197** (sajt: **11070**);
   - telefon **063/1021-722** (sajt: nema telefona);
   - „Blok 44" (sajt: ne pominje kvart);
   - nema sajta ni radnog vremena.

   Neslaganje naziva, adrese i telefona slabi lokalno rangiranje. Treba utvrditi tačan poštanski broj (Wikipedia za Novi Beograd navodi 11070) i da li je telefon aktuelan i sme da se objavi. Potom treba ispraviti **i** sajt (`practice.json`) **i** imenik.
2. **Telefon.** Google Business Profile i imenici ga očekuju. Ako klijent ne želi pozive, i dalje vredi imati broj u NAP-u (npr. za Viber).
3. **Koordinate (`geo`).** Treba ih preuzeti sa pina u Google Business Profile-u, sa 5 decimala, i upisati u `practice.json`. Nisu pogađane.
4. **Kvart (`neighborhood`).** PlanPlus i ulica Jurija Gagarina ukazuju na Blok 44. Upisati tek kad klijent potvrdi.
5. **„Kako do nas" (`directions`).** Orijentiri, linije javnog prevoza i parking, samo provereni podaci.

## Van sajta – najveći uticaj na lokalne rezultate

| Prioritet | Akcija |
| --- | --- |
| Kritično | Preuzeti/verifikovati **Google Business Profile**: primarna kategorija „Stomatolog" (Dentist), isti NAP kao sajt, radno vreme, fotografije, link na sajt. Link na profil upisati u `profileUrl` (tada ide i u `sameAs`). |
| Kritično | **Recenzije na Google-u**: stalan priliv, a ne jednokratna kampanja. Bez „filtriranja" zadovoljnih pacijenata, što Google zabranjuje. Odgovarati na recenzije bez potvrđivanja da je osoba pacijent. |
| Visoko | Ispraviti/dopuniti **PlanPlus** (link na sajt, radno vreme, ispravan poštanski broj). PlanPlus se pojavljuje na vrhu pretraga „stomatološke ordinacije Novi Beograd". |
| Visoko | **Bing Places** (koriste ga ChatGPT/Copilot) i **Apple Business Connect** – isti NAP. |
| Srednje | Ostali srpski imenici sa istim NAP-om (pre upisa proveriti da su aktivni i relevantni). |
| Srednje | Lokalni linkovi i pominjanja: lokalni portali Novog Beograda, saradnje (vrtići/škole u kvartu), stručna udruženja. |

## Sadržaj – najveća slabost na samom sajtu

Strane usluga imaju **23–40 reči** teksta (bez liste podusluga). `seo-local` navodi posebne strane usluga kao
faktor #1 za lokalni organski rezultat, ali one moraju da imaju sadržaj. Predlog po strani (300–600 reči, od doktorke,
ne generički tekst):

- kada je usluga potrebna (simptomi kojima pacijent traži: „boli me zub na hladno", „otekla desna"…);
- kako izgleda tretman u ovoj ordinaciji, korak po korak, i koliko traje;
- šta posle (oporavak, ishrana, kontrola);
- 2–4 pitanja koja pacijenti stvarno postavljaju (već postoji polje `faqs`);
- opciono: fotografije iz ordinacije.

## Tehnički preduslovi pri puštanju u rad

- `SITE_URL` mora biti stvarni domen (`https://www.<domen>.rs`), jer od njega zavise canonical, sitemap i schema `@id`.
- Posle puštanja: Google Search Console i Bing Webmaster Tools, prijaviti `sitemap-index.xml`.
- Preview na GitHub Pages ostaje `noindex` + `Disallow: /`, što je ispravno.
