import { abs } from './url';
import { practice, DAY_NAMES_EN } from './practice';

/**
 * Entity links for areaServed (helps search engines and AI assistants resolve the place, not just the string).
 * Only verified URLs belong here; an area without an entry is emitted by name only.
 */
const PLACE_LINKS: Record<string, { type: string; sameAs: string }> = {
  'Novi Beograd': { type: 'AdministrativeArea', sameAs: 'https://en.wikipedia.org/wiki/New_Belgrade' },
  Beograd: { type: 'City', sameAs: 'https://en.wikipedia.org/wiki/Belgrade' },
};

/** Stable @id values so entities on different pages point at each other. */
export const ids = {
  practice: (site: URL) => abs('/#ordinacija', site),
  website: (site: URL) => abs('/#website', site),
  person: (site: URL, slug: string) => abs(`/o-nama#${slug}`, site),
  service: (site: URL, slug: string) => abs(`/usluge/${slug}#usluga`, site),
};

export function websiteJsonLd(site: URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': ids.website(site),
    url: abs('/', site),
    name: practice.name,
    inLanguage: 'sr-Latn-RS',
    publisher: { '@id': ids.practice(site) },
  };
}

/** Practice JSON-LD, generated from practice.json so it always matches the visible NAP and hours. */
interface PracticeLinks {
  /** Service pages: [slug, name] — listed as availableService. */
  services?: { slug: string; name: string }[];
  /** Staff slugs on /o-nama — linked as employee. */
  staff?: { slug: string; name: string }[];
}

export function practiceJsonLd(site: URL, links: PracticeLinks = {}) {
  const p = practice;
  const openingHoursSpecification = p.hours
    .filter((h) => !('closed' in h && h.closed))
    .map((h: any) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${DAY_NAMES_EN[h.day - 1]}`,
      opens: h.opens,
      closes: h.closes,
    }));

  const specialOpeningHoursSpecification = p.specialDates.map((d) => ({
    '@type': 'OpeningHoursSpecification',
    validFrom: d.date,
    validThrough: d.date,
    ...(d.closed ? { opens: '00:00', closes: '00:00' } : { opens: d.opens, closes: d.closes }),
  }));

  const sameAs = [...p.social.map((s) => s.url), ...(p.profileUrl ? [p.profileUrl] : [])];

  return {
    '@context': 'https://schema.org',
    '@type': 'Dentist',
    '@id': ids.practice(site),
    name: p.name,
    alternateName: p.legalName,
    slogan: p.tagline,
    url: abs('/', site),
    logo: abs('/images/logo-3a-dent.svg', site),
    image: abs('/images/hero.webp', site),
    ...(p.phone ? { telephone: p.phone.e164 } : {}),
    email: p.email,
    medicalSpecialty: 'https://schema.org/Dentistry',
    knowsLanguage: 'sr',
    isAcceptingNewPatients: p.acceptingNewPatients,
    currenciesAccepted: 'RSD',
    address: {
      '@type': 'PostalAddress',
      streetAddress: [p.address.street, p.address.unit].filter(Boolean).join(', '),
      addressLocality: p.address.city,
      addressRegion: p.address.region,
      postalCode: p.address.postalCode,
      addressCountry: p.address.country,
    },
    ...(p.geo
      ? { geo: { '@type': 'GeoCoordinates', latitude: Number(p.geo.lat.toFixed(5)), longitude: Number(p.geo.lng.toFixed(5)) } }
      : {}),
    hasMap: p.mapsUrl,
    openingHoursSpecification,
    ...(specialOpeningHoursSpecification.length ? { specialOpeningHoursSpecification } : {}),
    areaServed: p.serviceAreas.map((name) =>
      PLACE_LINKS[name] ? { '@type': PLACE_LINKS[name].type, name, sameAs: PLACE_LINKS[name].sameAs } : { '@type': 'Place', name },
    ),
    ...(links.services?.length
      ? { availableService: links.services.map((x) => ({ '@type': 'MedicalProcedure', '@id': ids.service(site, x.slug), name: x.name, url: abs(`/usluge/${x.slug}`, site) })) }
      : {}),
    ...(links.staff?.length ? { employee: links.staff.map((x) => ({ '@id': ids.person(site, x.slug), name: x.name })) } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function breadcrumbJsonLd(site: URL, items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: abs(it.path, site),
    })),
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  if (!faqs.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/** Serialise JSON-LD safely inside a <script> tag. */
export function ld(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}
