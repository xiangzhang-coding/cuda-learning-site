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
