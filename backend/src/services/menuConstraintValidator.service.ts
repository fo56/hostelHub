import jsonLogic from 'json-logic-js';

export function validateConstraints(
  rules: Array<Record<string, any>>,
  validDishIds: Set<string>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const syntheticContexts = [
    { day: 0, mealType: 'Lunch', dishTags: ['paneer', 'spicy'], weekCount: { 'paneer': 0 }, daysSinceLastServed: null, isWeekend: false },
    { day: 3, mealType: 'Dinner', dishTags: [], weekCount: {}, daysSinceLastServed: 2, isWeekend: false },
    { day: 6, mealType: 'Breakfast', dishTags: ['sweet'], weekCount: { 'sweet': 1 }, daysSinceLastServed: 5, isWeekend: true },
  ];

  for (const r of rules) {
    if (r.appliesTo?.dishId && !validDishIds.has(r.appliesTo.dishId)) {
      errors.push(`Rule "${r.sourcePhrase}" references a dish that doesn't exist in the catalog.`);
    }

    if (r.action === 'LIMIT' && (typeof r.max !== 'number' || r.max < 0)) {
      errors.push(`Rule "${r.sourcePhrase}" is a LIMIT rule but has an invalid or missing 'max' value.`);
    }

    // Dry run the jsonLogic
    if (r.condition && r.condition !== true) {
      for (const ctx of syntheticContexts) {
        try {
          const result = jsonLogic.apply(r.condition, ctx);
          if (result === undefined) {
             errors.push(`Rule "${r.sourcePhrase}" evaluated to undefined. Logic tree might be malformed.`);
             break;
          }
        } catch (err: any) {
          errors.push(`Rule "${r.sourcePhrase}" contains an invalid logic condition: ${err.message}`);
          break;
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
