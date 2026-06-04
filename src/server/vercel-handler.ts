import type { IncomingMessage, ServerResponse } from 'node:http';
import { createTitipKampusApp } from '../../server.js';

let appPromise: ReturnType<typeof createTitipKampusApp> | null = null;

function restoreRewrittenApiPath(req: IncomingMessage) {
  const requestUrl = new URL(req.url || '/api', `https://${req.headers.host || 'titipkampus.vercel.app'}`);
  const rewrittenPath = requestUrl.searchParams.get('path');
  if (!rewrittenPath) return;

  requestUrl.searchParams.delete('path');
  const query = requestUrl.searchParams.toString();
  const normalizedPath = rewrittenPath.replace(/^\/+/, '');
  req.url = `/api/${normalizedPath}${query ? `?${query}` : ''}`;
}

export default async function handleTitipKampusRequest(req: IncomingMessage, res: ServerResponse) {
  restoreRewrittenApiPath(req);
  appPromise ??= createTitipKampusApp({ serveFrontend: false });
  const app = await appPromise;
  app(req, res);
}
