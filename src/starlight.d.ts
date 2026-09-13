// SPDX-License-Identifier: Apache-2.0
// The Search override retains Starlight 0.41.7's build-generated Pagefind options.
declare module 'virtual:starlight/pagefind-config' {
  export const pagefindUserConfig: Partial<
    Extract<import('@astrojs/starlight/types').StarlightConfig['pagefind'], object>
  >;
}
