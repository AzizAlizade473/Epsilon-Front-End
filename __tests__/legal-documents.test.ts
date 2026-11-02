import { expect, test } from '@jest/globals';
import { getLegalDocument } from '@/lib/legal-documents';
import { resolveDeepLink } from '@/lib/deep-link';

test('only the two named legal documents accept Epsilon deep links', () => {
  expect(resolveDeepLink('epsilon://legal/terms')).toMatchObject({
    valid: true,
    path: '/legal/terms',
  });
  expect(resolveDeepLink('epsilon://legal/privacy')).toMatchObject({
    valid: true,
    path: '/legal/privacy',
  });
  expect(resolveDeepLink('epsilon://legal/unknown').valid).toBe(false);
});

test.each(['az', 'en', 'ru'] as const)(
  '%s drafts have complete ordered sections and honest version metadata',
  (locale) => {
    for (const type of ['terms', 'privacy'] as const) {
      const document = getLegalDocument(type, locale);
      const headings = document.blocks.filter((block) => block.heading);
      const count = type === 'terms' ? 18 : 16;
      expect(headings).toHaveLength(count);
      expect(document.blocks).toHaveLength(count * 2);
      headings.forEach((heading, index) =>
        expect(heading.text.startsWith(`${index + 1}. `)).toBe(true),
      );
      expect(
        document.blocks.every((block) => block.text.trim().length > 5),
      ).toBe(true);
      expect(document.draft).toBe(true);
      expect(document.version).toBe('draft-2026-11-02');
      expect(document.locale).toBe(locale);
      expect(document.blocks.map((block) => block.text).join(' ')).not.toMatch(
        /Lorem ipsum|Coming soon/,
      );
    }
  },
);
