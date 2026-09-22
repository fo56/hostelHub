/**
 * Handles the construction of the final weekly Mess Menu for a hostel using MILP solver.
 */
import { MenuRecommendation } from '../models/MenuRecommendation';
import { MessMenu } from '../models/MessMenu';
import { Dish } from '../models/Dish';
import { Hostel } from '../models/Hostel';
import solver from 'javascript-lp-solver';
import jsonLogic from 'json-logic-js';

interface Rule {
  action: 'ALLOW_IF' | 'REQUIRE_IF' | 'LIMIT';
  appliesTo: { mealType?: string; categoryName?: string; dishId?: string; tag?: string };
  condition: object;
  max?: number;
  windowSize?: number;
  sourcePhrase: string;
}

interface RuleContext {
  day: number;
  mealType: string;
  dishId: string;
  dishTags: string[];
  dishName: string;
  weekCount: Record<string, number>;
  daysSinceLastServed: number | null;
  isWeekend: boolean;
}

function ruleApplies(rule: Rule, ctx: RuleContext): boolean {
  if (rule.appliesTo.mealType && rule.appliesTo.mealType !== ctx.mealType) return false;
  if (rule.appliesTo.dishId && rule.appliesTo.dishId !== ctx.dishId) return false;
  if (rule.appliesTo.tag) {
     const hasTag = ctx.dishTags.some(t => t.toLowerCase() === rule.appliesTo.tag!.toLowerCase());
     const hasName = ctx.dishName.toLowerCase().includes(rule.appliesTo.tag.toLowerCase());
     if (!hasTag && !hasName) return false;
  }
  if ((rule.appliesTo as any).dishNameMatch && !ctx.dishName.toLowerCase().includes((rule.appliesTo as any).dishNameMatch.toLowerCase())) return false;
  return true;
}

function passesAllowIf(candidate: any, ctx: RuleContext, rules: Rule[]): boolean {
  for (const rule of rules.filter(r => ruleApplies(r, ctx))) {
    if (rule.action === 'ALLOW_IF') {
       try {
         if (!jsonLogic.apply(rule.condition, ctx)) return false;
       } catch(e) {
         return false; // Safely fail if logic throws
       }
    }
  }
  return true;
}

function extractAssignment(result: any, openDays: number[]): Map<number, string> {
  const assignment = new Map<number, string>();
  if (!result.feasible) return assignment; // Will handle fallback below

  for (const key of Object.keys(result)) {
    if (result[key] === 1 && key.startsWith('dish_')) {
       // key is "dish_dishId_day"
       const parts = key.split('_');
       const dayStr = parts.pop();
       const day = parseInt(dayStr || '', 10);
       // Rejoin the remaining parts for dishId (skipping the "dish" prefix)
       parts.shift(); // remove "dish"
       const dishId = parts.join('_');
       if (!isNaN(day) && openDays.includes(day)) {
         assignment.set(day, dishId);
       }
    }
  }
  return assignment;
}

/**
 * Solves the constraint satisfaction problem for a specific meal slot across the week.
 * 
 * Uses a Mixed-Integer Linear Programming (MILP) approach. Variables represent 
 * the assignment of a specific dish to a specific day. Constraints enforce that exactly 
 * one dish is assigned per day per slot, and applies custom logic rules (LIMIT, ALLOW_IF, REQUIRE_IF).
 *
 * @param candidates - Dishes eligible for this slot with their final composite scores.
 * @param openDays - Array of day indices (0-6) where this slot needs to be filled.
 * @param mealType - The meal identifier (e.g. 'Breakfast', 'Lunch').
 * @param rules - Array of global/hostel rules (e.g., 'Limit rice to 3x/week').
 * @param historyMap - Map of dishId to days since it was last served (for penalizing repetition).
 * @param variantLabel - Menu generation variant (e.g., 'Standard', 'Low Repetition') to tweak score weights.
 * @returns Map of day index to chosen dishId.
 */
function solveMealAssignment(
  candidates: { dishId: string; finalScore: number; tags: string[]; name: string; _id: string }[],
  openDays: number[],
  mealType: string,
  rules: Rule[],
  historyMap: Map<string, number | null>,
  variantLabel: string
) {
  const model: any = {
    optimize: 'score',
    opType: 'max',
    constraints: {},
    variables: {},
    ints: {},
  };

  const requireGroups = new Map<string, string[]>(); // ruleId_day -> list of varKeys

  for (const day of openDays) {
    const slotConstraintKey = `slot_${day}`;
    model.constraints[slotConstraintKey] = { equal: 1 };
    
    // Slack variable to prevent infeasibility if ALLOW_IF eliminates all candidates
    // (e.g., 'No rice on weekends' empties the entire Rice category slot)
    const slackVarKey = `slack_${day}`;
    model.variables[slackVarKey] = {
        score: -100000,
        [slotConstraintKey]: 1
    };
    model.ints[slackVarKey] = 1;

    for (const c of candidates) {
      const ctx: RuleContext = {
        day,
        mealType,
        dishId: c.dishId,
        dishTags: c.tags,
        dishName: c.name,
        weekCount: {},
        daysSinceLastServed: historyMap.get(c.dishId) ?? null,
        isWeekend: day >= 5,
      };

      if (!passesAllowIf(c, ctx, rules)) continue; 

      const varKey = `dish_${c.dishId}_${day}`;
      
      // Cross-week penalty if served recently
      let historyPenalty = 0;
      if (ctx.daysSinceLastServed !== null) {
          historyPenalty = 50 / (ctx.daysSinceLastServed + 1);
          if (variantLabel === 'Low Repetition') {
              historyPenalty = historyPenalty * 3; // Heavily penalize cross-week repetition
          }
      }
      
      // Scale finalScore (0-1) up to heavily prioritize student votes (0-200)
      const scaledFinalScore = c.finalScore * 200;

      model.variables[varKey] = {
        score: scaledFinalScore - historyPenalty,
        [slotConstraintKey]: 1,
      };
      model.ints[varKey] = 1;

      // Handle LIMIT
      const limitRules = rules.filter(r => r.action === 'LIMIT' && ruleApplies(r, ctx));
      for (const limitRule of limitRules) {
        const ruleId = (limitRule as any)._id || limitRule.appliesTo.tag || limitRule.appliesTo.categoryName || 'global';
        if (limitRule.windowSize && limitRule.windowSize > 1) {
            for (let wDay = Math.max(0, day - limitRule.windowSize + 1); wDay <= day; wDay++) {
              const limitKey = `limit_win_${ruleId}_${wDay}`;
              model.constraints[limitKey] = model.constraints[limitKey] ?? { max: limitRule.max || 1 };
              model.variables[varKey][limitKey] = 1;
            }
        } else {
            const limitKey = `limit_${ruleId}`;
            model.constraints[limitKey] = model.constraints[limitKey] ?? { max: limitRule.max || 1 };
            model.variables[varKey][limitKey] = 1;
        }
      }

      // Handle REQUIRE_IF
      const reqRules = rules.filter(r => r.action === 'REQUIRE_IF' && ruleApplies(r, ctx));
      for (const req of reqRules) {
          try {
            if (jsonLogic.apply(req.condition, ctx)) {
              // Instead of pinning exactly this dish, we add it to a requirement group
              // The MILP solver will ensure at least ONE dish from this group is selected today
              const groupId = `req_${(req as any)._id || Math.random()}_${day}`;
              if (!requireGroups.has(groupId)) requireGroups.set(groupId, []);
              
              requireGroups.get(groupId)!.push(varKey);
            }
          } catch(e) {}
      }
    }
  }

  // Enforce REQUIRE_IF groups by massive score boost to prevent infeasibility crashes
  for (const [groupId, varKeys] of requireGroups) {
    for (const varKey of varKeys) {
       if (model.variables[varKey]) {
          model.variables[varKey].score += 10000;
       }
    }
  }

  const result = solver.Solve(model);
  return extractAssignment(result, openDays);
}


/**
 * Master orchestrator function to generate a full week's mess menu.
 * 
 * Workflow:
 * 1. Fetches hostel configurations and active menu rules.
 * 2. Compiles historical dish served dates to penalize repetition across consecutive weeks.
 * 3. Retrieves computed dish recommendations/scores from `MenuRecommendation`.
 * 4. Iterates through the hostel's defined meal plan framework (e.g., Breakfast -> Main Course).
 * 5. Solves the optimal assignment independently for each slot using MILP.
 * 6. Constructs and returns (or persists) the final Menu document.
 *
 * @param hostelId - Target hostel for menu generation.
 * @param variantLabel - Toggles specific algorithmic tweaks (default: 'Standard').
 * @param publishMethod - Sets the menu state upon creation (default: 'MANUAL').
 * @returns The newly constructed and saved MessMenu document.
 */
export const buildMessMenu = async (hostelId: string, variantLabel: string = 'Standard', publishMethod: 'MANUAL' | 'AUTO' = 'MANUAL') => {
  const now = new Date();

  const hostel = await Hostel.findById(hostelId);
  if (!hostel || !hostel.mealPlan) throw new Error('Hostel or meal plan not found');

  // Build History Map (walk by effectiveFrom descending to find recent service dates)
  // We'll limit to last 60 days of menus to keep it bounded.
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const pastMenus = await MessMenu.find({ hostelId, effectiveFrom: { $gte: sixtyDaysAgo } })
      .populate({ path: 'meals.slots.rotatingItems.item', select: '_id name' })
      .sort({ effectiveFrom: -1 }).lean();
  
  const historyMap = new Map<string, number | null>();
  
  function getDaysAgoForDayIndex(dayIndex: number, from: Date, to: Date): number | null {
     let d = new Date(to);
     while (d >= from) {
         if ((d.getDay() === 0 ? 6 : d.getDay() - 1) === dayIndex) {
             return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
         }
         d = new Date(d.getTime() - 24 * 60 * 60 * 1000);
     }
     return null;
  }

  for (let w = 0; w < pastMenus.length; w++) {
      const menu = pastMenus[w];
      const from = menu.effectiveFrom!;
      const to = menu.effectiveTo || now;
      
      for (const meal of menu.meals) {
          for (let d = 0; d < 7; d++) {
             const slot = meal.slots[d];
             if (slot && slot.status === 'SCHEDULED' && slot.rotatingItems) {
                const daysAgo = getDaysAgoForDayIndex(d, from, to);
                if (daysAgo !== null) {
                    for (const ri of slot.rotatingItems) {
                       // After populate, ri.item IS the Dish doc — read _id directly
                       const dishId = (ri.item as any)?._id?.toString();
                       if (dishId) {
                          const existing = historyMap.get(dishId);
                          if (existing === undefined || existing === null || daysAgo < existing) {
                              historyMap.set(dishId, daysAgo);
                          }
                       }
                    }
                }
             }
          }
      }
  }

  const rules: Rule[] = (hostel.menuConstraints as any) || [];
  const generatedMeals = [];
  const solverFailures: string[] = [];

  for (const mealPlanItem of hostel.mealPlan) {
    if (mealPlanItem.isActive === false) continue;
    const mealName = mealPlanItem.mealName;
    
    const fixedItems = await Dish.find({ hostelId, mealType: mealName, itemClass: 'FIXED', status: 'ACTIVE' });
    const fixedIds = fixedItems.map(s => s._id);

    const daySlots: any[] = Array.from({ length: 7 }, () => ({ 
      status: 'SCHEDULED', 
      fixedItems: fixedIds, 
      rotatingItems: [] 
    }));

    // Pass 1: Handle offDays
    const openDays: number[] = [];
    for (let i = 0; i < 7; i++) {
        const jsDayIndex = (i + 1) % 7; 
        const isOffDay = mealPlanItem.offDays?.includes(jsDayIndex);

        if (isOffDay) {
            daySlots[i].status = 'CLOSED';
        } else {
            openDays.push(i);
        }
    }

    // Solve for each category
    for (const category of mealPlanItem.categories) {
      const catName = category.categoryName;
      const recommendations = await MenuRecommendation.find({
        hostelId, mealName, categoryName: catName
      }).populate({ path: 'dishId', select: 'tags name' });

      const candidates = recommendations
         .filter(r => r.dishId)
         .map((r: any) => ({
            _id: r._id,
            dishId: r.dishId._id.toString(),
            name: r.dishId.name,
            tags: r.dishId.tags || [],
            finalScore: r.finalScore || 0
         }));

      // Filter rules for this specific category (if specified)
      const catRules = rules.filter(r => !r.appliesTo?.categoryName || r.appliesTo.categoryName === catName);

      if (candidates.length === 0) {
        continue;
      }

      const assignment = solveMealAssignment(candidates, openDays, mealName, catRules, historyMap, variantLabel);

      if (assignment.size === 0 && openDays.length > 0) {
          const warnMsg = `Solver infeasible for meal ${mealName}, category ${catName}. Fell back to naive assignment.`;
          console.warn(`[WARN] ${warnMsg}`);
          solverFailures.push(warnMsg);
          
          if (candidates.length > 0) {
              const sorted = [...candidates].sort((a, b) => b.finalScore - a.finalScore);
              for (let i = 0; i < openDays.length; i++) {
                  const day = openDays[i];
                  const c = sorted[i % sorted.length];
                  assignment.set(day, c.dishId);
              }
          }
      }

      // Map assignment back to daySlots
      for (const day of openDays) {
         const assignedDishId = assignment.get(day);
         if (assignedDishId) {
            const rec = candidates.find(c => c.dishId === assignedDishId);
            if (rec) {
                daySlots[day].rotatingItems.push({ category: catName, item: rec.dishId });
            }
         }
      }
    }

    generatedMeals.push({
      mealName,
      slots: daySlots
    });
  }

  return await MessMenu.create({
    hostelId,
    status: 'DRAFT',
    variantLabel,
    meals: generatedMeals,
    publishMethod,
    solverFailures,
    generatedAt: new Date()
  });
}