import { handleWebRequest } from '../../src/server/apiRouter.ts';
import { runMigrations, setTursoConfig } from '../../src/db/index.ts';

let initialized = false;

// Cloudflare Pages Function entrypoint
export const onRequest = async (context: {
  request: Request;
  env: Record<string, string>;
}): Promise<Response> => {
  // Transfer Cloudflare environment variables to DB config
  if (context.env?.TURSO_DATABASE_URL) {
    setTursoConfig(context.env.TURSO_DATABASE_URL, context.env.TURSO_AUTH_TOKEN);
  }

  // Ensure DB migrations run once upon first worker execution
  if (!initialized) {
    try {
      await runMigrations();
      initialized = true;
    } catch (err) {
      console.warn('[Cloudflare Pages] Migration init warning:', err);
    }
  }

  // Handle CORS preflight
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    return await handleWebRequest(context.request);
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
};
