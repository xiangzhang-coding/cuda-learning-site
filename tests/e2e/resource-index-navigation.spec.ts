// SPDX-License-Identifier: Apache-2.0
import { createServer } from 'node:http';
import { expect, test } from '@playwright/test';
import { collectBrowserFailures, openResourceIndexPage } from '../helpers/browser-contract';
import currentPublication from '../../src/current-publication-manifest.json' with { type: 'json' };

for (const route of ['/practice/', '/en/practice/']) {
  test(`${route}resource index navigation waits for a streamed document to finish parsing`, async ({ page, baseURL }, info) => {
    test.skip(!['webkit', 'mobile-safari'].includes(info.project.name), 'WebKit navigation lifecycle regression.');
    test.setTimeout(60_000);
    const html = await (await fetch(new URL(route, baseURL))).text();
    const split = html.indexOf('<cuda-resource-index');
    expect(split).toBeGreaterThan(0);
    let tail: ReturnType<typeof setTimeout> | undefined;
    // Serve the real built page in two chunks on a fresh origin. No fake readiness,
    // replacement component, extra cards or modified production script is injected.
    const server = createServer(async (request, response) => {
      try {
        if (request.url === route) {
          response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
          response.write(html.slice(0, split));
          tail = setTimeout(() => response.end(html.slice(split)), 1000);
        } else {
          const upstream = await fetch(new URL(request.url ?? '/', baseURL));
          response.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') ?? 'application/octet-stream' });
          response.end(Buffer.from(await upstream.arrayBuffer()));
        }
      } catch {
        if (!response.headersSent) response.writeHead(502);
        response.end();
      }
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing fixture listener');
    const origin = `http://127.0.0.1:${address.port}`;
    const failures = collectBrowserFailures(page, origin);
    try {
      const index = await openResourceIndexPage(page, `${origin}${route}`);
      expect(await page.evaluate(() => document.readyState), 'parsing must finish before the bounded hydration assertion').not.toBe('loading');
      await expect(index).toHaveAttribute('data-ready', 'true', { timeout: 15_000 });
      await expect(index.locator('[data-resource-card]')).toHaveCount(currentPublication.scope.practiceBankEntries);
      await index.locator('[data-resource-filter="relation"]').selectOption('L12');
      await expect(index.locator('[data-resource-card]:visible')).toHaveCount(2);
      expect(failures).toEqual([]);
    } finally {
      clearTimeout(tail);
      await page.close();
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  });
}
