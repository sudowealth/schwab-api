import { type TokenSet } from './auth/types';
import { type Middleware, compose } from './middleware/compose';
import { withAuth } from './middleware/with-auth';
import { setGlobalSchwabFetch } from './core/http';

/**
 * Configure the Schwab API client with middleware for auth, rate limiting, and retries
 */
export function configureSchwabApi(opts: {
  tokens: { current(): TokenSet | null; refresh(): Promise<TokenSet>; };
  middlewares?: Middleware[];
}) {
  const chain = compose(
    ...(opts.middlewares ?? [withAuth(opts.tokens)])
  );

  // Patch core.http.schwabFetch to use chain internally
  setGlobalSchwabFetch((req) => chain(req));

  // Re-export existing generated namespaces untouched
  return import('./index.js').then((mod) => mod.trader);
}