/**
 * Design-token drift guard.
 *
 * Reads the @theme block in app/global.css and asserts every CSS variable's
 * value matches the canonical token in momentum-shared. If anyone hand-edits
 * a hex in global.css without updating momentum-shared (or vice versa), this
 * test fails and the build blocks. That makes drift structurally impossible
 * even without a build-time CSS-var generator.
 *
 * Add a new mapping here when you add a new CSS variable derived from a
 * shared token. Mappings ONLY belong in this test if the variable's value
 * is supposed to track a shared token; web-only utilities (gradients,
 * shadows, kiosk-specific classes) are deliberately excluded.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { colors, borderRadius, spacing } from 'momentum-shared';

const CSS_PATH = join(__dirname, '..', 'app', 'global.css');

function extractCssVars(css: string): Record<string, string> {
  // Strip /* ... */ comments first so braces inside comments don't break
  // the @theme block extraction.
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const themeMatch = stripped.match(/@theme\s*\{([\s\S]*?)\}/);
  if (!themeMatch) throw new Error('No @theme block found in global.css');
  const block = themeMatch[1];
  const out: Record<string, string> = {};
  const re = /--([a-z0-9-]+):\s*([^;]+);/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    out[m[1]] = m[2].trim().toLowerCase();
  }
  return out;
}

function normalize(value: string | number): string {
  if (typeof value === 'number') return `${value}px`.toLowerCase();
  return String(value).toLowerCase();
}

describe('design-tokens-drift — global.css must mirror momentum-shared', () => {
  const vars = extractCssVars(readFileSync(CSS_PATH, 'utf8'));

  // Map of CSS variable name → expected value from momentum-shared.
  const expected: Record<string, string> = {
    'color-text-primary': normalize(colors.textPrimary),
    'color-text-secondary': normalize(colors.textSecondary),
    'color-text-tertiary': normalize(colors.textTertiary),
    'color-action-primary': normalize(colors.brandPrimary),
    'color-action-light': normalize(colors.brandLight),
    'color-action-hover': normalize(colors.brandDark),
    'color-signal-success': normalize(colors.success),
    'color-signal-success-light': normalize(colors.successLight),
    'color-signal-alert': normalize(colors.alert),
    'color-signal-alert-light': normalize(colors.alertLight),
    'color-signal-error': normalize(colors.error),
    'color-signal-error-light': normalize(colors.errorLight),
    'color-bg-canvas': normalize(colors.canvas),
    'color-bg-surface': normalize(colors.surface),
    'color-border-subtle': normalize(colors.borderSubtle),
    'radius-sm': normalize(borderRadius.sm),
    'radius-md': normalize(borderRadius.md),
    'radius-lg': normalize(borderRadius.lg),
    'radius-xl': normalize(borderRadius.xl),
    'radius-xxl': normalize(borderRadius.xxl),
    'radius-pill': '9999px',
    'space-xs': normalize(spacing.xs),
    'space-sm': normalize(spacing.sm),
    'space-md': normalize(spacing.md),
    'space-lg': normalize(spacing.lg),
    'space-xl': normalize(spacing.xl),
    'space-xxl': normalize(spacing.xxl),
    'space-xxxl': normalize(spacing.xxxl),
    'space-huge': normalize(spacing.huge),
    'space-massive': normalize(spacing.massive),
    'space-giant': normalize(spacing.giant),
  };

  it.each(Object.entries(expected))(
    '--%s matches the shared token value',
    (name, expectedValue) => {
      const actual = vars[name];
      expect(actual).toBeDefined();
      expect(actual).toBe(expectedValue);
    }
  );

  it('every declared CSS var has a corresponding mapping (no orphan vars)', () => {
    const cssNames = Object.keys(vars);
    const expectedNames = new Set(Object.keys(expected));
    const orphans = cssNames.filter((n) => !expectedNames.has(n));
    expect(orphans).toEqual([]);
  });
});
