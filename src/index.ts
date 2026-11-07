/**
 * @jsdevlab/bem — a framework-agnostic BEM (Block, Element, Modifier) class name generator.
 *
 * Naming conventions (standard BEM separators, customizable):
 * - Block:      `card`
 * - Element:    `card__title`
 * - Modifier:   `card--active` (boolean) / `card--size-lg` (with value)
 *
 * All class name fragments (block/element/modifier key/value) are sanitized automatically:
 * whitespace → `-`, other illegal characters (such as `#`/`.`) are removed,
 * guaranteeing valid CSS class names.
 *
 * Use case: replaces the `[cls, cond ? 'cls--x' : ''].filter(Boolean).join(' ')` pattern.
 */

/** Modifier value: a boolean toggle or any value (`0` is valid; `false`/`null`/`undefined`/`''` are ignored). */
export type ModifierValue = boolean | string | number | null | undefined;
export type Modifiers = Record<string, ModifierValue>;

/**
 * Separator and namespace configuration (for different BEM dialects/prefixes).
 *
 * @example
 * bem('card', 'title', { el: '_', mod: '_', ns: 'hl' })  // 'hl-card_title'
 */
export interface BemOptions {
  /** Element separator, defaults to `__`. */
  el?: string;
  /** Modifier separator, defaults to `--`. */
  mod?: string;
  /** Namespace prefix (e.g. 'hl' → 'hl-card'); skipped when the block is already prefixed. */
  ns?: string;
}

type ResolvedOptions = Required<BemOptions>;

const DEFAULT_OPTIONS: ResolvedOptions = { el: '__', mod: '--', ns: '' };

const resolveOptions = (options?: BemOptions): ResolvedOptions => ({
  el: options?.el ?? DEFAULT_OPTIONS.el,
  mod: options?.mod ?? DEFAULT_OPTIONS.mod,
  ns: options?.ns ?? DEFAULT_OPTIONS.ns,
});

/** Sanitizes illegal characters: whitespace → `-`, other illegal characters are removed; valid input passes through unchanged. */
const sanitize = (name: string): string =>
  name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '');

/** Applies the namespace prefix: skips when the block already starts with `ns-` (idempotent). */
const applyNs = (name: string, ns: string): string =>
  ns ? (name.startsWith(`${ns}-`) ? name : `${ns}-${name}`) : name;

/** Filters empty fragments and joins the rest with a space. */
const join = (parts: string[]): string => parts.filter(Boolean).join(' ');

const buildBase = (
  blockName: string,
  element: string | undefined,
  options: ResolvedOptions,
): string => {
  const block = applyNs(sanitize(blockName), options.ns);
  if (!element) return block;
  return `${block}${options.el}${sanitize(element)}`;
};

const buildModifiers = (
  base: string,
  modifiers: Modifiers | undefined,
  options: ResolvedOptions,
): string[] => {
  if (!modifiers) return [base];
  const parts = [base];
  for (const [key, value] of Object.entries(modifiers)) {
    if (
      value === false ||
      value === null ||
      value === undefined ||
      value === ''
    ) {
      continue;
    }
    const safeKey = sanitize(key);
    if (!safeKey) continue;
    if (value === true) {
      parts.push(`${base}${options.mod}${safeKey}`);
      continue;
    }
    const safeValue = sanitize(String(value));
    // Value sanitizes to empty (e.g. '#$%') → degrades to a boolean modifier
    parts.push(
      safeValue
        ? `${base}${options.mod}${safeKey}-${safeValue}`
        : `${base}${options.mod}${safeKey}`,
    );
  }
  return parts;
};

/** Argument type detection: an object with an `el`/`mod`/`ns` string key is treated as BemOptions, otherwise as modifiers. */
const isBemOptions = (value: unknown): value is BemOptions =>
  typeof value === 'object' &&
  value !== null &&
  (typeof (value as Record<string, unknown>).el === 'string' ||
    typeof (value as Record<string, unknown>).mod === 'string' ||
    typeof (value as Record<string, unknown>).ns === 'string');

type BemArg = string | Modifiers | BemOptions | undefined;

interface ParsedBemArgs {
  element?: string;
  modifiers?: Modifiers;
  options?: BemOptions;
}

/** Extracts element/modifiers/options from the variadic arguments by type (a later options wins over an earlier one). */
const parseBemArgs = (args: BemArg[]): ParsedBemArgs => {
  const parsed: ParsedBemArgs = {};
  for (const arg of args) {
    if (typeof arg === 'string') {
      parsed.element = arg;
    } else if (isBemOptions(arg)) {
      parsed.options = arg;
    } else if (arg !== undefined) {
      parsed.modifiers = arg;
    }
  }
  return parsed;
};

/** Core implementation (reused by createBem to avoid spreading across the public overloaded signature). */
const bemImpl = (
  blockName: string,
  element: string | undefined,
  modifiers: Modifiers | undefined,
  options: BemOptions | undefined,
): string => {
  const resolved = resolveOptions(options);
  return join(
    buildModifiers(
      buildBase(blockName, element, resolved),
      modifiers,
      resolved,
    ),
  );
};

/**
 * Overloaded signatures of the `bem` function (the `bem` returned by `createBem` shares the same signatures):
 * arguments are recognized by type automatically (string = element, object with `el`/`mod`/`ns` keys = options,
 * any other object = modifiers), so no `undefined` placeholders are needed.
 */
export type BemSignature = {
  (blockName: string): string;
  (blockName: string, element: string): string;
  (blockName: string, modifiers: Modifiers): string;
  (blockName: string, options: BemOptions): string;
  (blockName: string, element: string, modifiers: Modifiers): string;
  (blockName: string, element: string, options: BemOptions): string;
  (blockName: string, modifiers: Modifiers, options: BemOptions): string;
  (
    blockName: string,
    element: string,
    modifiers: Modifiers,
    options: BemOptions,
  ): string;
};

/**
 * Functional BEM class names (overloaded: arguments are recognized by type, no `undefined` placeholders needed).
 *
 * @param blockName Block name, e.g. `'card'`.
 * @param args
 * @returns The joined class name string.
 * @example
 * bem('card')                                          // 'card'
 * bem('card', 'title')                                 // 'card__title'
 * bem('card', { active: true })                        // 'card card--active'
 * bem('card', { ns: 'hl' })                            // 'hl-card'
 * bem('card', { active: true }, { ns: 'hl' })          // 'hl-card hl-card--active'
 * bem('card', 'title', { size: 'lg' }, { ns: 'hl' })   // 'hl-card__title hl-card__title--size-lg'
 * // legacy undefined placeholders are still accepted
 * bem('card', undefined, { active: true })             // 'card card--active'
 */
export const bem: BemSignature = (
  blockName: string,
  ...args: BemArg[]
): string => {
  const { element, modifiers, options } = parseBemArgs(args);
  return bemImpl(blockName, element, modifiers, options);
};

export interface BemElement {
  toString(): string;
  /** Element + modifiers (produces `block__elem block__elem--mod` class names). */
  modifiers(modifiers: Modifiers): string;
}

export interface BemBlock {
  toString(): string;
  /** Block + modifiers (produces `block block--mod` class names). */
  modifiers(modifiers: Modifiers): string;
  /** Element (`block__elem`). */
  element(name: string): BemElement;
}

/**
 * Chainable BEM class name builder.
 *
 * @param blockName Block name, e.g. `'hl-hue-slider'`.
 * @param options Separator and namespace options.
 * @returns A chainable block exposing `modifiers` and `element`.
 * @example
 * const cn = block('hl-hue-slider')
 * String(cn)                                        // 'hl-hue-slider'
 * cn.modifiers({ vertical: true })                  // 'hl-hue-slider hl-hue-slider--vertical'
 * cn.element('handle')                              // → 'hl-hue-slider__handle'
 * block('card', { el: '_', mod: '_' })              // custom separators
 */
export function block(blockName: string, options?: BemOptions): BemBlock {
  const resolved = resolveOptions(options);
  return {
    toString: () => applyNs(sanitize(blockName), resolved.ns),
    modifiers: (modifiers) =>
      join(
        buildModifiers(
          buildBase(blockName, undefined, resolved),
          modifiers,
          resolved,
        ),
      ),
    element: (name) => ({
      toString: () => buildBase(blockName, name, resolved),
      modifiers: (modifiers) =>
        join(
          buildModifiers(
            buildBase(blockName, name, resolved),
            modifiers,
            resolved,
          ),
        ),
    }),
  };
}

/**
 * Factory for separator configuration: returns `bem`/`block` sharing the same configuration.
 *
 * @param options Factory-level separator/namespace options.
 * @returns An object with a configured `bem` function and a configured `block` builder.
 * @example
 * const { bem, block } = createBem({ el: '_', mod: '_' })
 * bem('card', 'title')   // 'card_title'
 * block('card').modifiers({ active: true })  // 'card card_active'
 */
export function createBem(options?: BemOptions): {
  bem: BemSignature;
  block: (blockName: string) => BemBlock;
} {
  const base = resolveOptions(options);
  return {
    bem: (blockName: string, ...args: BemArg[]): string => {
      // Merge caller options with the factory configuration (caller wins); the remaining args are parsed as-is
      const callOptions = args.find(isBemOptions);
      const merged: BemOptions = { ...base, ...callOptions };
      const cleanArgs = args.filter((arg) => !isBemOptions(arg));
      const { element, modifiers } = parseBemArgs(cleanArgs);
      return bemImpl(blockName, element, modifiers, merged);
    },
    block: (blockName) => block(blockName, options),
  };
}
