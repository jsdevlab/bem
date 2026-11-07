# @jsdevlab/bem

[English](./README.md) | 简体中文

> 与框架无关的 BEM（Block、Element、Modifier）类名构建器。

[![npm version](https://img.shields.io/npm/v/@jsdevlab/bem.svg)](https://www.npmjs.com/package/@jsdevlab/bem)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE.txt)

`@jsdevlab/bem` 可以把块名、可选的元素名和修饰符映射转换为合法的 BEM 类名字符串。
它可以替代常见的 `[base, cond ? 'base--x' : ''].filter(Boolean).join(' ')` 写法，
适用于 React、Vue、Svelte、Solid、Preact 以及原生 DOM。

## 特性

- 默认遵循标准 BEM：`block`、`block__element`、`block--modifier`、
  `block--modifier-value`
- 支持布尔修饰符（`true` / `false`）和值修饰符（`'lg'`、`2`、`0`）
- 可自定义元素/修饰符分隔符，并支持可选的命名空间（`ns`）前缀
- 自动清洗为合法的 CSS 类名
- 两套 API：函数式 `bem()` 与链式 `block()` 构建器
- 通过 `createBem()` 工厂在项目中共享配置
- 零依赖，同时提供 ESM 与 CJS，完整 TypeScript 类型

## 安装

```bash
npm install @jsdevlab/bem
# 或
pnpm add @jsdevlab/bem
# 或
yarn add @jsdevlab/bem
```

## 快速开始

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

块名之后的参数会按类型自动识别，因此无需使用 `undefined` 占位符（旧写法
`bem('card', undefined, { active: true })` 仍然兼容）：

| 参数                                          | 识别为 |
| --------------------------------------------- | ------ |
| `string`                                      | 元素名 |
| 含有字符串类型 `el`、`mod` 或 `ns` 属性的对象 | 配置项 |
| 其他对象                                      | 修饰符 |

支持的签名：

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

返回值始终以基础类名开头（块名，或传入元素名时的 `block__element`），随后按
对象键的顺序追加已启用的修饰符。

### 修饰符值

对于 `bem('card', { key: value })`：

| 值                                 | 结果                |
| ---------------------------------- | ------------------- |
| `true`                             | `card card--key`    |
| `'lg'`                             | `card card--key-lg` |
| `2`                                | `card card--key-2`  |
| `0`                                | `card card--key-0`  |
| `false`、`null`、`undefined`、`''` | `card`（被忽略）    |

注意 `0` 是合法的修饰符值，会被输出，而不会按假值处理：

```ts
bem('card', { count: 0 }); // 'card card--count-0'
```

### 链式 `block()`

```ts
import { block } from '@jsdevlab/bem';

const cn = block('hl-hue-slider');

String(cn); // 'hl-hue-slider'
cn.toString(); // 'hl-hue-slider'
cn.modifiers({ vertical: true }); // 'hl-hue-slider hl-hue-slider--vertical'
cn.element('handle'); // BemElement → 'hl-hue-slider__handle'
cn.element('handle').modifiers({ active: true });
// 'hl-hue-slider__handle hl-hue-slider__handle--active'

// 自定义分隔符
const legacy = block('card', { el: '_', mod: '_' });
legacy.element('title').modifiers({ size: 'lg' });
// 'card_title card_title_size-lg'
```

`BemBlock` 与 `BemElement` 都实现了 `toString()`，因此可以直接用于模板字符串或
任何需要字符串的场合。

### 共享配置：`createBem()`

```ts
import { createBem } from '@jsdevlab/bem';

const { bem, block } = createBem({ el: '_', mod: '_' });

bem('card', 'title'); // 'card_title'
bem('card', { active: true }); // 'card card_active'
block('card').modifiers({ active: true }); // 'card card_active'
```

调用时传入的配置会与工厂配置合并，调用级配置优先：

```ts
const { bem } = createBem({ ns: 'hl' });

bem('card', { active: true }, { mod: '_' }); // 'hl-card hl-card_active'
bem('card', 'title', { el: '__' }); // 'hl-card__title'
```

`createBem()` 返回的 `block()` 只接受块名，因为配置已经绑定。

### 配置项

```ts
interface BemOptions {
  /** 元素分隔符，默认 `__`。 */
  el?: string;
  /** 修饰符分隔符，默认 `--`。 */
  mod?: string;
  /** 命名空间前缀，例如 'hl' → 'hl-card'。 */
  ns?: string;
}
```

命名空间会以 `ns-` 的形式加在块名之前，并被元素和修饰符继承。它是幂等的：
已经以 `ns-` 开头的块不会被重复添加前缀。

```ts
bem('card', { ns: 'hl' }); // 'hl-card'
bem('card', 'title', { ns: 'hl' }); // 'hl-card__title'
bem('hl-card', { ns: 'hl' }); // 'hl-card'
```

### 名称清洗

每个片段（块名、元素名、修饰符键、修饰符值）都会被清洗，保证输出始终是合法的
CSS 类名：

- 连续空白字符会被替换为 `-`
- 不在 `[a-zA-Z0-9_-]` 范围内的字符会被移除（包括中日韩文字、带重音的字母和
  emoji 等非 ASCII 字符）
- 修饰符键清洗后为空时，该修饰符被忽略
- 修饰符值清洗后为空时，该修饰符退化为布尔形式

```ts
bem('my card'); // 'my-card'
bem('card', 'the title'); // 'card__the-title'
bem('card', { 'size lg': true }); // 'card card--size-lg'
bem('card', { color: '#ff0000' }); // 'card card--color-ff0000'
bem('card', { color: '###' }); // 'card card--color'
bem('card', { '###': true }); // 'card'
```

如果需要使用非 ASCII 名称，请在传入前自行编码——清洗器只保留 ASCII 字母、数字、
`_` 和 `-`。

### 参数识别注意事项

只有当普通对象不含字符串类型的 `el`、`mod` 或 `ns` 属性时，它才会被当作修饰符。
因此，一个名称恰好为 `el`、`mod` 或 `ns` 且值为字符串的修饰符会被误认为配置项：

```ts
bem('card', { mod: 'x' }); // 被当作配置项 → 'card'
```

这种情况下请使用链式 API：

```ts
block('card').modifiers({ mod: 'x' }); // 'card card--mod-x'
```

### TypeScript

所有公开类型均已导出：

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

非法的参数形式会在编译期被拒绝：

```ts
bem('card', 123); // ✗ 数字不是合法参数
bem('card', true); // ✗ 裸布尔值不是合法参数
```

## 从数组拼接写法迁移

```ts
// 之前
const className = [
  'hl-hue-slider',
  vertical ? 'hl-hue-slider--vertical' : '',
  disabled ? 'hl-hue-slider--disabled' : '',
]
  .filter(Boolean)
  .join(' ');

// 之后
const className = bem('hl-hue-slider', { vertical, disabled });
```

## 开发

环境要求：Node.js 24.19+ 且低于 27（在 `devEngines.runtime` 中声明）和 pnpm 12+。

```bash
pnpm install       # 安装依赖
pnpm dev           # 使用 rslib 监听构建
pnpm test          # 类型检查 + rstest
pnpm test:watch    # rstest 监听模式
pnpm build         # 构建 ESM + CJS + 类型声明
pnpm check         # biome check --write
pnpm format        # biome format --write
pnpm changeset     # 为当前改动添加 changeset
```

### 发布

本项目使用 [Changesets](https://github.com/changesets/changesets)。每个改变行为的
PR 都应包含一个 changeset。合并到 `main` 后会运行 `Publish` 工作流：它会打开或更新
版本 PR；该 PR 合并后，则通过 trusted publishing 将带有 provenance 的包发布到 npm。

### CI

| 工作流                             | 触发条件       | 用途                             |
| ---------------------------------- | -------------- | -------------------------------- |
| `ci.yml`                           | push / PR      | Lint、类型检查、测试与构建       |
| `publish.yml`                      | push 到 `main` | 通过 Changesets 版本化或发布     |
| `comment-changesets-pr-status.yml` | Pull Request   | 在每个 PR 上评论 Changesets 状态 |

所有 GitHub Actions 均固定到 commit SHA，并在注释中标注版本。

## 许可证

[MIT](./LICENSE.txt) © jsdevlab
