import { defineConfig } from '@rslib/core';

export default defineConfig({
  syntax: ['node 22'],
  lib: [
    {
      format: 'esm',
      dts: true,
    },
    {
      format: 'cjs',
    },
  ],
});
