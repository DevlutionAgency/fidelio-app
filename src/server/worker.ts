import { handleWebRequest } from './apiRouter.ts';
import { runMigrations, setTursoConfig } from '../db/index.ts';

interface Env {
  ASSETS?: { fetch: (req: Request) => Promise<Response> };
  TURSO_DATABASE_URL?: string;
  TURSO_AUTH_TOKEN?: string;
  [key: string]: unknown;
}

let initialized = false;

/**
 * Cloudflare Worker standard entrypoint (handles both API and Static Assets)
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Provide Turso credentials from Cloudflare Worker env if provided
    if (env.TURSO_DATABASE_URL) {
      setTursoConfig(env.TURSO_DATABASE_URL, env.TURSO_AUTH_TOKEN);
    }

    // Run DB migrations once on startup
    if (!initialized) {
      try {
        await runMigrations();
        initialized = true;
      } catch (err) {
        console.warn('[Worker] Migration warning:', err);
      }
    }

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Handle all API routes
    if (url.pathname.startsWith('/api/')) {
      try {
        return await handleWebRequest(request);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur interne du serveur';
        return new Response(
          JSON.stringify({
            ok: false,
            error: message,
            erreur: { code: 'erreur_serveur', message },
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    }

    // Serve static frontend assets via ASSETS binding (Cloudflare Workers with static assets)
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};
