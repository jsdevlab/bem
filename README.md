# @jsdevlab/bem

[English](./README.md) | [简体中文](./README.zh-CN.md)

> Framework-agnostic BEM (Block, Element, Modifier) class name builder.

[![npm version](https://img.shields.io/npm/v/@jsdevlab/bem.svg)](https://www.npmjs.com/package/@jsdevlab/bem)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE.txt)

`@jsdevlab/bem` turns a block name, an optional element, and a modifier map into a
valid BEM class string. It replaces the usual
`[base, cond ? 'base--x' : ''].filter(Boolean).join(' ')` pattern with a single
function call, and works with React, Vue, Svelte, Solid, Preact, or plain DOM.

## Features

- Standard BEM by default: `block`, `block__element`, `block--modifier`,
  `block--modifier-value`
- Boolean modifiers (`true` / `false`) and value modifiers (`'lg'`, `2`, `0`)
- Configurable element/modifier separators and an optional namespace (`ns`) prefix
- Automatic sanitization into valid CSS class names
- Two APIs: the functional `bem()` and the chainable `block()` builder
- `createBem()` factory for sharing configuration across a project
- Zero dependencies, ESM + CJS, full TypeScript types

## Installation

```bash
npm install @jsdevlab/bem
# or
pnpm add @jsdevlab/bem
# or
yarn add @jsdevlab/bem
```

## Quick start

```ts
import { bem } from '@jsdevlab/bem';

bem('card'); // 'card'
bem('card', 'title'); // 'card__title'
bem('card', { active: true }); // 'card card--active'
bem('card', { size: 'lg' }); // 'card card--size-lg'
bem('card', 'title', { size: 'sm' }); // 'card__title card__title--size-sm'
```

### React

```tsx
import { bem } from '@jsdevlab/bem';

interface CardProps {
  title: string;
  active?: boolean;
  size?: 'sm' | 'lg';
  children?: React.ReactNode;
}

export function Card({ title, active, size, children }: CardProps) {
  return (
    <div className={bem('card', { active, size })}>
      <h2 className={bem('card', 'title')}>{title}</h2>
      {children}
    </div>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { bem } from '@jsdevlab/bem';

const props = defineProps<{ active?: boolean; size?: 'sm' | 'lg' }>();
const cls = computed(() => bem('card', { active: props.active, size: props.size }));
</script>

<template>
  <div :class="cls"><slot /></div>
</template>
```

## API

### `bem(blockName, ...args)`

```ts
import { bem } from '@jsdevlab/bem';

bem('card');
bem('card', 'title');
bem('card', { active: true });
bem('card', { active: true }, { ns: 'hl' });
bem('card', 'title', { active: true, size: 'sm' }, { ns: 'hl' });
```

Arguments after the block name are recognized by type, so you never need
`undefined` placeholders (older calls such as `bem('card', undefined, { active: true })`
still work):

| Argument                                           | Treated as |
| -------------------------------------------------- | ---------- |
| `string`                                           | element    |
| object with a string `el`, `mod`, or `ns` property | options    |
| any other object                                   | modifiers  |

Supported signatures:

```ts
bem(block);
bem(block, element);
bem(block, modifiers);
bem(block, options);
bem(block, element, modifiers);
bem(block, element, options);
bem(block, modifiers, options);
bem(block, element, modifiers, options);
```

The return value always starts with the base class name (the block, or
`block__element` when an element is given), followed by the enabled modifiers in
the object's key order.

### Modifier values

For `bem('card', { key: value })`:

| Value                              | Result              |
| ---------------------------------- | ------------------- |
| `true`                             | `card card--key`    |
| `'lg'`                             | `card card--key-lg` |
| `2`                                | `card card--key-2`  |
| `0`                                | `card card--key-0`  |
| `false`, `null`, `undefined`, `''` | `card` (skipped)    |

Note that `0` is a valid modifier value and is emitted, not treated as falsy:

```ts
bem('card', { count: 0 }); // 'card card--count-0'
```

### Chainable `block()`

```ts
import { block } from '@jsdevlab/bem';

const cn = block('hl-hue-slider');

String(cn); // 'hl-hue-slider'
cn.toString(); // 'hl-hue-slider'
cn.modifiers({ vertical: true }); // 'hl-hue-slider hl-hue-slider--vertical'
cn.element('handle'); // BemElement → 'hl-hue-slider__handle'
cn.element('handle').modifiers({ active: true });
// 'hl-hue-slider__handle hl-hue-slider__handle--active'

// Custom separators
const legacy = block('card', { el: '_', mod: '_' });
legacy.element('title').modifiers({ size: 'lg' });
// 'card_title card_title_size-lg'
```

Both `BemBlock` and `BemElement` implement `toString()`, so they can be used
directly in template strings or anywhere a string is coerced.

### Shared configuration: `createBem()`

```ts
import { createBem } from '@jsdevlab/bem';

const { bem, block } = createBem({ el: '_', mod: '_' });

bem('card', 'title'); // 'card_title'
bem('card', { active: true }); // 'card card_active'
block('card').modifiers({ active: true }); // 'card card_active'
```

Call-level options are merged over factory options (call-level wins):

```ts
const { bem } = createBem({ ns: 'hl' });

bem('card', { active: true }, { mod: '_' }); // 'hl-card hl-card_active'
bem('card', 'title', { el: '__' }); // 'hl-card__title'
```

The `block()` returned by `createBem()` only accepts a block name, since the
configuration is already bound.

### Options

```ts
interface BemOptions {
  /** Element separator, defaults to `__`. */
  el?: string;
  /** Modifier separator, defaults to `--`. */
  mod?: string;
  /** Namespace prefix, e.g. 'hl' → 'hl-card'. */
  ns?: string;
}
```

The namespace is prepended as `ns-` to the block name and inherited by elements
and modifiers. It is idempotent: a block that already starts with `ns-` is not
prefixed twice.

```ts
bem('card', { ns: 'hl' }); // 'hl-card'
bem('card', 'title', { ns: 'hl' }); // 'hl-card__title'
bem('hl-card', { ns: 'hl' }); // 'hl-card'
```

### Sanitization

Every fragment (block, element, modifier key, modifier value) is sanitized so
the output is always a valid CSS class name:

- whitespace runs become `-`
- characters outside `[a-zA-Z0-9_-]` are removed (this includes non-ASCII
  characters such as CJK, accented letters, and emoji)
- a modifier whose key becomes empty is skipped
- a modifier whose value becomes empty degrades to its boolean form

```ts
bem('my card'); // 'my-card'
bem('card', 'the title'); // 'card__the-title'
bem('card', { 'size lg': true }); // 'card card--size-lg'
bem('card', { color: '#ff0000' }); // 'card card--color-ff0000'
bem('card', { color: '###' }); // 'card card--color'
bem('card', { '###': true }); // 'card'
```

If you need non-ASCII names, encode them before passing them in — the sanitizer
keeps only ASCII letters, digits, `_`, and `-`.

### Argument-detection caveat

A plain object is treated as modifiers only when it has no string-valued `el`,
`mod`, or `ns` property. A modifier literally named `el`, `mod`, or `ns` with a
string value would therefore be mistaken for options:

```ts
bem('card', { mod: 'x' }); // treated as options → 'card'
```

Use the chainable API in that case:

```ts
block('card').modifiers({ mod: 'x' }); // 'card card--mod-x'
```

### TypeScript

All public types are exported:

```ts
import type {
  BemBlock,
  BemElement,
  BemOptions,
  BemSignature,
  ModifierValue,
  Modifiers,
} from '@jsdevlab/bem';
```

Invalid argument shapes are rejected at compile time:

```ts
bem('card', 123); // ✗ number is not a valid argument
bem('card', true); // ✗ a bare boolean is not a valid argument
```

## Migrating from the array-join pattern

```ts
// Before
const className = [
  'hl-hue-slider',
  vertical ? 'hl-hue-slider--vertical' : '',
  disabled ? 'hl-hue-slider--disabled' : '',
]
  .filter(Boolean)
  .join(' ');

// After
const className = bem('hl-hue-slider', { vertical, disabled });
```

## Development

Requirements: Node.js 24+ (declared in `devEngines.runtime`) and pnpm 12+.

```bash
pnpm install       # install dependencies
pnpm dev           # watch build with rslib
pnpm test          # type check + rstest
pnpm test:watch    # rstest in watch mode
pnpm build         # build ESM + CJS + type declarations
pnpm check         # biome check --write
pnpm format        # biome format --write
pnpm changeset     # add a changeset for the current change
```

### Release

This project uses [Changesets](https://github.com/changesets/changesets).
Add a changeset to every PR that changes behavior. Merging to `main` runs the
`Publish` workflow, which either opens/updates the version PR or, once that PR
is merged, publishes the package to npm with provenance via trusted publishing.

### CI

| Workflow                           | Trigger        | Purpose                                  |
| ---------------------------------- | -------------- | ---------------------------------------- |
| `ci.yml`                           | push / PR      | Lint, type check, tests, and build       |
| `publish.yml`                      | push to `main` | Version or publish through Changesets    |
| `comment-changesets-pr-status.yml` | pull request   | Comment the Changesets status on each PR |

All GitHub Actions are pinned to commit SHAs with the version in a comment.

## License

[MIT](./LICENSE.txt) © jsdevlab
