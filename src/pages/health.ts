import type { APIRoute } from 'astro';
import { getDb } from '../lib/db';
import { IS_STATIC_PREVIEW } from '../lib/url';

// Liveness/readiness probe for Docker and uptime monitors: 200 only when the database answers.
export const prerender = false;

export const GET: APIRoute = () => {
  if (IS_STATIC_PREVIEW) return new Response('ok (static preview)', { headers: { 'Content-Type': 'text/plain' } });
  try {
    getDb().prepare('SELECT 1').get();
    return new Response('ok', { headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('[health] database check failed', err);
    return new Response('database unavailable', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
};
