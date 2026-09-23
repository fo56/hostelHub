import { describe, it, expect } from 'vitest';
import { solveMealAssignment } from '../services/menuBuilder.service';

describe('Menu Builder MILP Solver', () => {
  const openDays = [0, 1, 2, 3, 4, 5, 6];
  const mealType = 'Lunch';

  it('should not assign the same dish every day (variety limits)', () => {
    const candidates = [
      { dishId: 'dish1', finalScore: 4.5, tags: ['curry'], name: 'Chicken Curry', _id: 'd1' },
      { dishId: 'dish2', finalScore: 4.0, tags: ['rice'], name: 'Fried Rice', _id: 'd2' },
      { dishId: 'dish3', finalScore: 3.5, tags: ['bread'], name: 'Roti', _id: 'd3' },
    ];
    
    // empty rules, empty history
    const historyMap = new Map();
    
    const assignment = solveMealAssignment(candidates, openDays, mealType, [], historyMap, 'Standard');
    
    // Check if assignments are valid
    expect(assignment.size).toBe(7); // 7 days filled
    
    // Max usage of any dish should be roughly 7 / 3 = ~3 max per week due to default limits
    const usageCounts = new Map<string, number>();
    for (const [day, dishId] of assignment.entries()) {
       usageCounts.set(dishId, (usageCounts.get(dishId) || 0) + 1);
    }
    
    // Default limit should be Math.max(2, Math.ceil(7 / 3) + 1) = 4
    for (const count of usageCounts.values()) {
       expect(count).toBeLessThanOrEqual(4);
    }
  });

  it('should enforce strict LIMIT rules via MILP', () => {
    const candidates = [
      { dishId: 'dish1', finalScore: 5.0, tags: ['Chicken'], name: 'Chicken Curry', _id: 'd1' },
      { dishId: 'dish2', finalScore: 2.0, tags: ['Veg'], name: 'Veg Curry', _id: 'd2' },
    ];
    
    // Rule: Limit Chicken tag to exactly 2 times per week max
    const rules: any = [
      {
         action: 'LIMIT',
         appliesTo: { tag: 'Chicken' },
         max: 2
      }
    ];
    
    const historyMap = new Map();
    
    const assignment = solveMealAssignment(candidates, openDays, mealType, rules, historyMap, 'Standard');
    
    // Check assignments
    expect(assignment.size).toBe(7);
    
    let chickenCount = 0;
    for (const [day, dishId] of assignment.entries()) {
       if (dishId === 'dish1') chickenCount++;
    }
    
    expect(chickenCount).toBeLessThanOrEqual(2);
  });

  it('should strictly enforce REQUIRE_IF rules (hard constraint)', () => {
    // If it's Monday (day=1), we MUST serve Chicken Curry.
    // We achieve this via a REQUIRE_IF rule
    
    const candidates = [
      { dishId: 'dish1', finalScore: 1.0, tags: ['Chicken'], name: 'Chicken Curry', _id: 'd1' }, // Terrible score, normally wouldn't be picked
      { dishId: 'dish2', finalScore: 5.0, tags: ['Veg'], name: 'Veg Curry', _id: 'd2' }, // Great score
    ];
    
    const rules: any = [
      {
         action: 'REQUIRE_IF',
         appliesTo: { dishId: 'dish1' },
         condition: { "==": [ { "var": "day" }, 1 ] }
      }
    ];
    
    const historyMap = new Map();
    const assignment = solveMealAssignment(candidates, openDays, mealType, rules, historyMap, 'Standard');
    
    expect(assignment.size).toBe(7);
    // On day 1 (Monday), it MUST be dish1 despite dish2 having a much higher score
    expect(assignment.get(1)).toBe('dish1');
  });

  it('should penalize history more heavily on Low Repetition variant', () => {
    const candidates = [
      { dishId: 'dish1', finalScore: 4.0, tags: [], name: 'Dish A', _id: 'd1' },
      { dishId: 'dish2', finalScore: 3.9, tags: [], name: 'Dish B', _id: 'd2' }, 
    ];
    
    // Dish1 has a slightly higher base score, but was served 1 day ago.
    const historyMap = new Map();
    historyMap.set('dish1', 1);
    historyMap.set('dish2', 10);
    
    const assignStandard = solveMealAssignment(candidates, [0], mealType, [], historyMap, 'Standard');
    const assignLowRep = solveMealAssignment(candidates, [0], mealType, [], historyMap, 'Low Repetition');
    
    // In Low Rep, historyPenalty is * 3, so Dish1 should be penalized enough that Dish B is picked.
    // Standard penalty: 50 / 2 = 25. Dish1 score: 4 * 200 - 25 = 775. Dish2 score: 3.9 * 200 - (50/11) = 780 - 4.5 = 775.5.
    // Wait, Standard might pick Dish B too. Let's make Dish1 base score much higher.
    
    const candidates2 = [
      { dishId: 'dish1', finalScore: 4.5, tags: [], name: 'Dish A', _id: 'd1' }, // 900
      { dishId: 'dish2', finalScore: 4.0, tags: [], name: 'Dish B', _id: 'd2' }, // 800
    ];
    
    const historyMap2 = new Map();
    historyMap2.set('dish1', 1); // standard penalty: 25. low rep penalty: 75.
    historyMap2.set('dish2', 14); // standard penalty: ~3. low rep penalty: ~10.
    
    // Standard: d1 = 900 - 25 = 875. d2 = 800 - 3 = 797. -> picks d1
    const assignSt2 = solveMealAssignment(candidates2, [0], mealType, [], historyMap2, 'Standard');
    expect(assignSt2.get(0)).toBe('dish1');
    
    // Low Rep: d1 = 900 - 75 = 825. d2 = 800 - 10 = 790. -> still picks d1?
    // Wait, let's make the difference tighter or the penalty bigger.
    const historyMap3 = new Map();
    historyMap3.set('dish1', 0); // standard penalty: 50. low rep penalty: 150.
    historyMap3.set('dish2', null); // 0 penalty.
    
    // Standard: d1 = 900 - 50 = 850. d2 = 800. -> picks d1
    const assignSt3 = solveMealAssignment(candidates2, [0], mealType, [], historyMap3, 'Standard');
    expect(assignSt3.get(0)).toBe('dish1');
    
    // Low Rep: d1 = 900 - 150 = 750. d2 = 800. -> picks d2!
    const assignLr3 = solveMealAssignment(candidates2, [0], mealType, [], historyMap3, 'Low Repetition');
    expect(assignLr3.get(0)).toBe('dish2');
  });
  it('should penalize dish repetition for score maxing over 7 days', () => {
    // If one dish is overwhelmingly popular, it shouldn't just be served every single day.
    const candidates = [
      { dishId: 'dish_max', finalScore: 5.0, tags: [], name: 'Super Popular Dish', _id: 'd1' },
      { dishId: 'dish_mid', finalScore: 4.0, tags: [], name: 'Mid Dish', _id: 'd2' },
      { dishId: 'dish_low', finalScore: 3.0, tags: [], name: 'Low Dish', _id: 'd3' },
      { dishId: 'dish_verylow', finalScore: 2.0, tags: [], name: 'Very Low Dish', _id: 'd4' },
      { dishId: 'dish_bottom', finalScore: 1.0, tags: [], name: 'Bottom Dish', _id: 'd5' },
    ];

    const historyMap = new Map();
    // 7 days simulation
    const assignment = solveMealAssignment(candidates, [0, 1, 2, 3, 4, 5, 6], mealType, [], historyMap, 'Standard');
    
    // We expect the solver to NOT pick 'dish_max' 7 times in a row. 
    // In fact, because of the variety limits, no dish can be picked more than Math.max(2, Math.ceil(7 / 5) + 1) = 3 times.
    let maxCount = 0;
    for (const dishId of assignment.values()) {
      if (dishId === 'dish_max') maxCount++;
    }

    expect(maxCount).toBeLessThan(7);
    expect(maxCount).toBeLessThanOrEqual(3);
  });
});
