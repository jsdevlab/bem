import { expect, test } from '@rstest/core';
import type { BemOptions } from '../src/index';
import { bem, block, createBem } from '../src/index';

// ── Functional bem ────────────────────────────────────────────────

test('block only', () => {
  expect(bem('card')).toBe('card');
});

test('block with element', () => {
  expect(bem('card', 'title')).toBe('card__title');
});

test('nested element names are not double-joined', () => {
  // BEM discourages nesting; element names are joined as-is
  expect(bem('card', 'header__title')).toBe('card__header__title');
});

test('boolean modifiers: true adds, false removes', () => {
  expect(bem('card', { active: true })).toBe('card card--active');
  expect(bem('card', { active: false })).toBe('card');
  expect(bem('card', { active: true, disabled: false })).toBe(
    'card card--active',
  );
});

test('value modifiers append value', () => {
  expect(bem('card', { size: 'lg' })).toBe('card card--size-lg');
  expect(bem('card', { size: 2 })).toBe('card card--size-2');
});

test('falsy values are ignored', () => {
  expect(bem('card', { a: null, b: undefined, c: '', d: 0 })).toBe(
    'card card--d-0',
  );
});

test('element with modifiers', () => {
  expect(bem('card', 'title', { active: true, size: 'sm' })).toBe(
    'card__title card__title--active card__title--size-sm',
  );
});

test('modifier ordering follows object key order', () => {
  expect(bem('card', { b: true, a: true })).toBe('card card--b card--a');
});

// ── Chainable block ───────────────────────────────────────────────

test('block: toString returns block name', () => {
  const cn = block('hl-hue-slider');
  expect(String(cn)).toBe('hl-hue-slider');
  expect(cn.toString()).toBe('hl-hue-slider');
});

test('block: modifiers', () => {
  const cn = block('hl-hue-slider');
  expect(cn.modifiers({ vertical: true, disabled: false })).toBe(
    'hl-hue-slider hl-hue-slider--vertical',
  );
});

test('block: element', () => {
  const cn = block('hl-hue-slider');
  const handle = cn.element('handle');
  expect(String(handle)).toBe('hl-hue-slider__handle');
  expect(handle.modifiers({ active: true })).toBe(
    'hl-hue-slider__handle hl-hue-slider__handle--active',
  );
});

test('block: empty modifiers returns base only', () => {
  const cn = block('card');
  expect(cn.modifiers({})).toBe('card');
  expect(cn.element('title').modifiers({})).toBe('card__title');
});

// ── Custom separators ─────────────────────────────────────────────

test('bem: custom separators via options', () => {
  expect(bem('card', 'title', { el: '_', mod: '_' })).toBe('card_title');
  expect(bem('card', { active: true }, { el: '_', mod: '_' })).toBe(
    'card card_active',
  );
});

test('block: custom separators inherited by element/modifiers', () => {
  const cn = block('card', { el: '_', mod: '_' });
  expect(cn.element('title').modifiers({ size: 'lg' })).toBe(
    'card_title card_title_size-lg',
  );
});

test('createBem: factory returns configured bem/block', () => {
  const { bem: customBem, block: customBlock } = createBem({
    el: '_',
    mod: '_',
  });
  expect(customBem('card', 'title')).toBe('card_title');
  const cn = customBlock('card');
  expect(cn.modifiers({ active: true })).toBe('card card_active');
  // default separators are unaffected
  expect(bem('card', 'title')).toBe('card__title');
});

// ── Namespace prefix ──────────────────────────────────────────────

test('bem: namespace prefix via options', () => {
  expect(bem('card', { ns: 'hl' })).toBe('hl-card');
  expect(bem('card', 'title', { ns: 'hl' })).toBe('hl-card__title');
  expect(bem('card', { active: true }, { ns: 'hl' })).toBe(
    'hl-card hl-card--active',
  );
});

test('block: namespace inherited by element/modifiers', () => {
  const cn = block('hue-slider', { ns: 'hl' });
  expect(String(cn)).toBe('hl-hue-slider');
  expect(cn.element('handle').modifiers({ active: true })).toBe(
    'hl-hue-slider__handle hl-hue-slider__handle--active',
  );
});

test('createBem: namespace factory applies to all', () => {
  const { bem: prefixed, block: prefixedBlock } = createBem({ ns: 'hl' });
  expect(prefixed('card', 'title')).toBe('hl-card__title');
  expect(prefixedBlock('hue-slider').modifiers({ vertical: true })).toBe(
    'hl-hue-slider hl-hue-slider--vertical',
  );
});

test('namespace not duplicated when block already prefixed', () => {
  expect(bem('hl-card', { ns: 'hl' })).toBe('hl-card');
});

test('namespace combines with custom separators and sanitize', () => {
  const options: BemOptions = { ns: 'hl', el: '_', mod: '_' };
  expect(bem('my card', 'the title', { 'size lg': true }, options)).toBe(
    'hl-my-card_the-title hl-my-card_the-title_size-lg',
  );
});

// ── Illegal character sanitization ────────────────────────────────

test('sanitizes block and element names', () => {
  expect(bem('my card', {})).toBe('my-card');
  expect(bem('card', 'the title')).toBe('card__the-title');
});

test('sanitizes modifier keys', () => {
  expect(bem('card', { 'size lg': true })).toBe('card card--size-lg');
});

test('sanitizes modifier values', () => {
  expect(bem('card', { color: '#ff0000' })).toBe('card card--color-ff0000');
});

test('skips modifier when key is empty after sanitize', () => {
  expect(bem('card', { '###': true })).toBe('card');
});

test('degrades value-only modifier when value sanitizes to empty', () => {
  expect(bem('card', { color: '###' })).toBe('card card--color');
});

test('valid names are untouched by sanitize', () => {
  expect(bem('hl-hue-slider', 'handle', { is_active: true })).toBe(
    'hl-hue-slider__handle hl-hue-slider__handle--is_active',
  );
});

// ── createBem merges caller options ───────────────────────────────

test('createBem: caller options merge with factory options', () => {
  const { bem: customBem } = createBem({ el: '_' });
  // caller options merge with factory options (caller wins): ns is not overridden by the factory el
  expect(customBem('card', { ns: 'hl' })).toBe('hl-card');
  // factory configuration applies
  expect(customBem('card', 'title')).toBe('card_title');
  // caller overrides factory
  expect(customBem('card', 'title', { el: '__' })).toBe('card__title');
  // factory ns combines with caller mod
  const { bem: prefixed } = createBem({ ns: 'hl' });
  expect(prefixed('card', { active: true }, { mod: '_' })).toBe(
    'hl-card hl-card_active',
  );
});

// ── Overloaded signatures (no undefined placeholders) ─────────────

test('overload: modifiers as second argument', () => {
  expect(bem('card', { active: true })).toBe('card card--active');
});

test('overload: options as second argument', () => {
  expect(bem('card', { ns: 'hl' })).toBe('hl-card');
  expect(bem('card', { el: '_' })).toBe('card');
});

test('overload: modifiers + options without element', () => {
  expect(bem('card', { active: true }, { ns: 'hl' })).toBe(
    'hl-card hl-card--active',
  );
});

test('overload: element + options without modifiers', () => {
  expect(bem('card', 'title', { ns: 'hl' })).toBe('hl-card__title');
});

test('overload: full form still works', () => {
  expect(bem('card', 'title', { size: 'lg' }, { ns: 'hl' })).toBe(
    'hl-card__title hl-card__title--size-lg',
  );
});

test('signature: createBem bem rejects invalid argument combos at compile time', () => {
  const { bem: customBem } = createBem();
  // all valid combinations work
  expect(customBem('card')).toBe('card');
  expect(customBem('card', 'title')).toBe('card__title');
  expect(customBem('card', { active: true })).toBe('card card--active');
  expect(customBem('card', 'title', { size: 'lg' })).toBe(
    'card__title card__title--size-lg',
  );
  expect(customBem('card', { active: true }, { ns: 'hl' })).toBe(
    'hl-card hl-card--active',
  );
  // @ts-expect-error modifiers do not accept numbers
  customBem('card', 123);
  // @ts-expect-error bare booleans are not allowed
  customBem('card', true);
  // @ts-expect-error element does not accept numbers
  customBem('card', 42, { active: true });
});

// ── Combination scenarios (replacing the filter(Boolean).join(' ') pattern) ──

test('replaces array join pattern', () => {
  const vertical = true;
  const disabled = false;
  // old pattern: ['hl-hue-slider', vertical ? 'is-vertical' : '', disabled ? 'is-disabled' : ''].filter(Boolean).join(' ')
  const old = [
    'hl-hue-slider',
    vertical ? 'hl-hue-slider--vertical' : '',
    disabled ? 'hl-hue-slider--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const next = bem('hl-hue-slider', { vertical, disabled });
  expect(next).toBe(old);
  expect(next).toBe('hl-hue-slider hl-hue-slider--vertical');
});
