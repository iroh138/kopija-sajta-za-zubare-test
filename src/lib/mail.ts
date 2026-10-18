import nodemailer from 'nodemailer';
import type { AppointmentRequest } from './db';

/**
 * Notifies the practice of a new request. Sends nothing unless SMTP_HOST and NOTIFY_EMAIL are set.
 * The email carries only a reference and contact preference — staff read details in /admin,
 * so personal data is not copied into mailboxes.
 */
export async function notifyPractice(req: Pick<AppointmentRequest, 'id' | 'preferred_contact' | 'patient_type' | 'urgent'>, practiceName: string) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, NOTIFY_EMAIL, SITE_URL } = process.env;
  if (!SMTP_HOST || !NOTIFY_EMAIL) {
    console.info(`[booking] request #${req.id} stored; email not configured (set SMTP_HOST and NOTIFY_EMAIL).`);
    return false;
  }
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  const adminUrl = new URL('/admin', SITE_URL ?? 'http://localhost:4321').href;
  const contact: Record<string, string> = { phone: 'telefonom', text: 'SMS/Viber porukom', email: 'e-mailom' };
  try {
    await transport.sendMail({
      from: SMTP_FROM ?? SMTP_USER,
      to: NOTIFY_EMAIL,
      subject: `${req.urgent ? 'HITNO – ' : ''}Novi zahtev za termin #${req.id} – ${practiceName}`,
      text: `${req.patient_type === 'new' ? 'Novi' : 'Postojeći'} pacijent želi da ga kontaktirate ${contact[req.preferred_contact] ?? req.preferred_contact}.${req.urgent ? '\nPacijent je označio da ima jak bol (hitno).' : ''}\n\nSpisak zahteva: ${adminUrl}\n`,
    });
    return true;
  } catch (err) {
    // The request is already saved; a mail failure must not lose it or show the visitor an error.
    console.error(`[booking] request #${req.id} stored but email failed:`, err);
    return false;
  }
}
