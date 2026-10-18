import { abs } from './url';
import { practice, DAY_NAMES_EN } from './practice';

/** Practice JSON-LD, generated from practice.json so it always matches the visible NAP and hours. */
export function practiceJsonLd(site: URL) {
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
    '@id': abs('/#ordinacija', site),
    name: p.name,
    alternateName: p.legalName,
    slogan: p.tagline,
    url: abs('/', site),
    logo: abs('/images/logo-3a-dent.svg', site),
    image: abs('/images/hero.webp', site),
    ...(p.phone ? { telephone: p.phone.e164 } : {}),
    email: p.email,
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
    areaServed: p.serviceAreas.map((name) => ({ '@type': 'Place', name })),
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
