import { defineMiddleware } from 'astro:middleware';
import { timingSafeEqual } from 'node:crypto';

const safeEqual = (a: string, b: string) => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
};

/** HTTP Basic auth in front of /admin. Disabled (503) until ADMIN_USER and ADMIN_PASSWORD are set. Use HTTPS in production. */
export const onRequest = defineMiddleware(async (ctx, next) => {
  if (!ctx.url.pathname.startsWith('/admin')) return next();

  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;
  if (!user || !pass) return new Response('Admin is disabled: set ADMIN_USER and ADMIN_PASSWORD.', { status: 503 });

  const header = ctx.request.headers.get('authorization') ?? '';
  const [scheme, encoded] = header.split(' ');
  if (scheme === 'Basic' && encoded) {
    const [u, ...rest] = Buffer.from(encoded, 'base64').toString('utf8').split(':');
    if (safeEqual(u, user) && safeEqual(rest.join(':'), pass)) {
      const res = await next();
      res.headers.set('Cache-Control', 'no-store');
      res.headers.set('X-Robots-Tag', 'noindex, nofollow');
      return res;
    }
  }
  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Practice admin", charset="UTF-8"' },
  });
});
