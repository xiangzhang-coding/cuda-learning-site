// SPDX-License-Identifier: Apache-2.0
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '../..');

export async function discoverPublishedRoutes() {
  const files = (await readdir(path.join(projectRoot, 'src/content/docs'), { recursive: true }))
    .map((file) => file.split(path.sep).join('/'))
    .filter((file) => /\.(?:md|mdx)$/.test(file));

  return files
    .map((file) => {
      const stem = file.replace(/\.(?:md|mdx)$/, '').replace(/(?:^|\/)index$/, '');
      return stem ? `/${stem}/` : '/';
    })
    .sort((left, right) => left.localeCompare(right, 'en'));
}

export async function publishedRouteBatches() {
  const routes = await discoverPublishedRoutes();
  return (['zh', 'en'] as const).flatMap((locale) => {
    const localized = routes.filter((route) => route.startsWith('/en/') === (locale === 'en'));
    return Array.from({ length: Math.ceil(localized.length / 12) }, (_, index) => ({
      locale,
      batch: index + 1,
      routes: localized.slice(index * 12, (index + 1) * 12),
    }));
  });
}
