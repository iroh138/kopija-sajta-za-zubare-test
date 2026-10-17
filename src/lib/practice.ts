import { z } from 'astro/zod';
import raw from '../data/practice.json';

/**
 * The single source of truth for name, address, phone, hours and insurers.
 * Header, footer, contact blocks and JSON-LD all read from here, so they cannot disagree.
 */
const time = z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM');

const hour = z.union([
  z.object({ day: z.number().int().min(1).max(7), opens: time, closes: time, closed: z.literal(false).optional() }),
  z.object({ day: z.number().int().min(1).max(7), closed: z.literal(true) }),
]);

const special = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  opens: time.optional(),
  closes: time.optional(),
  closed: z.boolean().optional(),
  label: z.string(),
});

const PracticeSchema = z.object({
  name: z.string().min(1),
  tagline: z.string(),
  specialty: z.string(),
  phone: z.object({ display: z.string(), e164: z.string().regex(/^\+\d{8,15}$/, 'E.164, e.g. +12015550142') }),
  email: z.string().email(),
  address: z.object({
    street: z.string(),
    unit: z.string().optional(),
    city: z.string(),
    region: z.string(),
    postalCode: z.string(),
    country: z.string().length(2),
  }),
  geo: z.object({ lat: z.number(), lng: z.number() }),
  mapsUrl: z.string().url(),
  profileUrl: z.string(),
  social: z.array(z.object({ network: z.string(), url: z.string().url() })),
  acceptingNewPatients: z.boolean(),
  freeConsultation: z.object({ offered: z.boolean(), note: z.string() }),
  hours: z.array(hour).length(7),
  specialDates: z.array(special),
  serviceAreas: z.array(z.string()),
  insurers: z.array(z.object({ name: z.string(), accepted: z.boolean(), notes: z.string().optional() })),
  payments: z.array(z.object({ name: z.string(), description: z.string() })),
  reasons: z.array(z.object({ title: z.string(), body: z.string() })),
});

export type Practice = z.infer<typeof PracticeSchema>;
export const practice: Practice = PracticeSchema.parse(raw);

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'p.m.' : 'a.m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function hoursRows() {
  return practice.hours.map((h) => ({
    day: DAY_NAMES[h.day - 1],
    text: 'closed' in h && h.closed ? 'Closed' : `${formatTime((h as any).opens)} – ${formatTime((h as any).closes)}`,
  }));
}

/** Special dates from `today` onward, soonest first. Computed at build time; rebuild to refresh. */
export function upcomingSpecialDates(today = new Date()) {
  const iso = today.toISOString().slice(0, 10);
  return practice.specialDates
    .filter((d) => d.date >= iso)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({
      ...d,
      pretty: new Date(`${d.date}T12:00:00`).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
      text: d.closed ? 'Closed' : `${formatTime(d.opens!)} – ${formatTime(d.closes!)}`,
    }));
}

export function addressLine(): string {
  const a = practice.address;
  return `${a.street}${a.unit ? `, ${a.unit}` : ''}, ${a.city}, ${a.region} ${a.postalCode}`;
}
