import { describe, expect, it } from 'vitest';
import { doctorsForOption, findOption, resolvePrefill } from '@/lib/booking/treatments';
import { content, treatmentGroups } from './fixtures';

const groups = treatmentGroups();
const opt = (id: string) => findOption(groups, id)!.doctors;

describe('treatment → doctor routing map', () => {
  it('with one dentist, every reason and every treatment books with Dr. Ramakanth', () => {
    for (const g of groups) for (const o of g.options) expect(o.doctors).toEqual(['dr-ramakanth']);
    expect(opt('general')).toEqual(['dr-ramakanth']);
    expect(opt('problem:wisdom-tooth')).toEqual(['dr-ramakanth']);
  });

  it('implants and braces/aligners are flagged for a possible visiting specialist (to confirm)', () => {
    const flagged = content.services.categories.filter((c: { confirmSpecialist: boolean }) => c.confirmSpecialist).map((c: { slug: string }) => c.slug).sort();
    expect(flagged).toEqual(['braces-aligners', 'dental-implants']);
  });

  it('there are 10 categories, each with at least one option and a doctor', () => {
    expect(groups.filter((g) => g.id.startsWith('category:'))).toHaveLength(10);
    for (const g of groups) {
      expect(g.options.length).toBeGreaterThan(0);
      for (const o of g.options) expect(o.doctors.length).toBeGreaterThan(0);
    }
  });

  it('every symptom chip links to an existing treatment category', () => {
    const cats = new Set(content.services.categories.map((c: { slug: string }) => c.slug));
    for (const p of content.routing.problems) expect(cats.has(p.category)).toBe(true);
  });

  it('deep links pre-fill the wizard', () => {
    expect(resolvePrefill(groups, { problem: 'toothache' }).treatmentId).toBe('problem:toothache');
    expect(resolvePrefill(groups, { treatment: 'root-canal-treatment' }).treatmentId).toBe('treatment:root-canal-treatment/single-visit-rct');
    expect(resolvePrefill(groups, { treatment: 'tooth-extraction/wisdom-tooth-removal' }).treatmentId).toBe('treatment:tooth-extraction/wisdom-tooth-removal');
    const doc = resolvePrefill(groups, { doctor: 'dr-ramakanth' });
    expect(findOption(groups, doc.treatmentId)!.doctors).toContain('dr-ramakanth');
    expect(resolvePrefill(groups, { problem: 'nope' }).treatmentId).toBeNull();
  });

  it('a preferred doctor narrows an option only when they treat it', () => {
    const o = findOption(groups, 'problem:toothache');
    expect(doctorsForOption(o, 'dr-ramakanth')).toEqual(['dr-ramakanth']);
    expect(doctorsForOption(o, 'dr-somebody-else')).toEqual(o!.doctors);
  });
});
