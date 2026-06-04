import type { IncomingMessage, ServerResponse } from 'node:http';
import { createTitipKampusApp } from '../server.js';

let appPromise: ReturnType<typeof createTitipKampusApp> | null = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  appPromise ??= createTitipKampusApp({ serveFrontend: false });
  const app = await appPromise;
  app(req, res);
}
