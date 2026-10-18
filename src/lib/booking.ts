/** Validation for the appointment request form. Server-side only; the browser adds HTML constraints on top. */

export const TIME_OPTIONS = [
  { value: 'pre-podne', label: 'Pre podne (utorak i četvrtak, 8–13 h)' },
  { value: 'popodne', label: 'Popodne (13–16 h)' },
  { value: 'uvece', label: 'Uveče (ponedeljak, sreda i petak, do 21 h)' },
] as const;

export const CONTACT_OPTIONS = [
  { value: 'phone', label: 'Telefonski poziv' },
  { value: 'text', label: 'SMS / Viber' },
  { value: 'email', label: 'E-mail' },
] as const;

export interface BookingValues {
  patientName: string;
  patientIsMinor: '' | 'yes' | 'no';
  guardianName: string;
  phone: string;
  email: string;
  preferredContact: string;
  patientType: '' | 'new' | 'existing';
  service: string;
  preferredTimes: string[];
  message: string;
  urgent: boolean;
  consentPrivacy: boolean;
}

export type BookingErrors = Partial<Record<keyof BookingValues, string>>;

export const emptyValues = (): BookingValues => ({
  patientName: '',
  patientIsMinor: '',
  guardianName: '',
  phone: '',
  email: '',
  preferredContact: 'phone',
  patientType: '',
  service: '',
  preferredTimes: [],
  message: '',
  urgent: false,
  consentPrivacy: false,
});

const str = (v: FormDataEntryValue | null, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function parseBooking(form: FormData, serviceIds: string[]) {
  const values: BookingValues = {
    patientName: str(form.get('patientName'), 120),
    patientIsMinor: (['yes', 'no'].includes(str(form.get('patientIsMinor'))) ? str(form.get('patientIsMinor')) : '') as BookingValues['patientIsMinor'],
    guardianName: str(form.get('guardianName'), 120),
    phone: str(form.get('phone'), 40),
    email: str(form.get('email'), 200),
    preferredContact: str(form.get('preferredContact')),
    patientType: (['new', 'existing'].includes(str(form.get('patientType'))) ? str(form.get('patientType')) : '') as BookingValues['patientType'],
    service: str(form.get('service')),
    preferredTimes: form.getAll('preferredTimes').map((v) => str(v)).filter((v) => TIME_OPTIONS.some((o) => o.value === v)),
    message: str(form.get('message'), 500),
    urgent: form.get('urgent') === 'on',
    consentPrivacy: form.get('consentPrivacy') === 'on',
  };

  const errors: BookingErrors = {};
  if (values.patientName.length < 2) errors.patientName = 'Unesite ime i prezime pacijenta.';
  if (!values.patientIsMinor) errors.patientIsMinor = 'Označite da li je pacijent mlađi od 18 godina.';
  if (values.patientIsMinor === 'yes' && values.guardianName.length < 2) errors.guardianName = 'Unesite ime i prezime roditelja ili staratelja.';
  const digits = values.phone.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) errors.phone = 'Unesite broj telefona na koji možemo da vas kontaktiramo.';
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Unesite ispravnu e-mail adresu ili ostavite polje prazno.';
  if (!CONTACT_OPTIONS.some((o) => o.value === values.preferredContact)) errors.preferredContact = 'Izaberite kako da vas kontaktiramo.';
  if (values.preferredContact === 'email' && !values.email) errors.email = 'Unesite e-mail adresu ili izaberite drugi način kontakta.';
  if (!values.patientType) errors.patientType = 'Označite da li ste već bili kod nas.';
  if (values.service && !serviceIds.includes(values.service)) values.service = '';
  if (!values.consentPrivacy) errors.consentPrivacy = 'Potrebna je vaša saglasnost da bismo sačuvali zahtev.';

  /** Honeypot: real users never see or fill this field. */
  const isBot = str(form.get('website')).length > 0;
  return { values, errors, isBot };
}

/** Simple in-memory limiter: 5 submissions per IP per 10 minutes. Resets on restart; enough for a single-instance site. */
const hits = new Map<string, number[]>();
export function rateLimited(ip: string, limit = 5, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}
