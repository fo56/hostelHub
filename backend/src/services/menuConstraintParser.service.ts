import { GoogleGenAI } from '@google/genai';

let ai: GoogleGenAI | null = null;

const RULE_SCHEMA = {
  type: 'object',
  properties: {
    rules: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['ALLOW_IF', 'REQUIRE_IF', 'LIMIT'] },
          appliesTo: {
            type: 'object',
            properties: {
              mealType: { type: 'string', enum: ['Breakfast', 'Lunch', 'Snack', 'Dinner'] },
              categoryName: { type: 'string' },
              dishId: { type: 'string' },
              tag: { type: 'string' },
            },
          },
          condition: { 
            type: 'string', 
            description: 'Stringified JsonLogic expression. MUST NOT BE EMPTY (use "{\\"==\\": [1,1]}" for global rules).'
          },
          max: { type: 'integer' },
          windowSize: { type: 'integer' },
          sourcePhrase: { type: 'string' },
        },
        required: ['action', 'appliesTo', 'condition', 'sourcePhrase'],
      },
    },
    preview: { type: 'string' },
  },
  required: ['rules', 'preview'],
};

const SYSTEM_PROMPT = `You convert a hostel mess admin's plain-text menu rules into a small set of generic logic rules.

Each rule has exactly one action:
- ALLOW_IF: the dish/tag may only be placed when the condition is true. DO NOT use ALLOW_IF for spacing/gap rules.
- REQUIRE_IF: the dish/tag must be placed when the condition is true
- LIMIT: caps how many times a tag may appear. Use "max" to set the limit. If it's a spacing/gap rule within the week (e.g. "alternate days", "at least 3 days between", "no continuous", "max 2 per week"), you MUST use LIMIT with "max" and "windowSize". For example, "alternate days" = windowSize: 2, max: 1.


Conditions are JsonLogic expressions using only these variables via {"var": "..."}:
- day (0=Monday..6=Sunday)
- mealType ("Breakfast"|"Lunch"|"Snack"|"Dinner")
- dishTags (array of strings)
- weekCount (object mapping tag -> count placed so far this week)
- daysSinceLastServed (number or null — null means never served before)
- isWeekend (boolean)

Use only these JsonLogic operators: and, or, not, ==, !=, >, <, >=, <=, in, var.
Only reference dishes from the provided catalog by their exact "id" — never invent one; prefer "tag" over "dishId" whenever the rule is really about a category, not one specific dish.
The admin may write in English — interpret it.

CRITICAL RULES FOR CONDITIONS:
- A condition MUST be a valid JsonLogic object. NEVER leave it empty \`{}\`. 
- If a rule applies globally/always, use \`{"==": [1, 1]}\` as the condition.
- If a rule applies to a specific day, remember day 0 is Monday, 6 is Sunday.

EXAMPLES:
1. "Require paneer on Monday for dinner" ->
   action: "REQUIRE_IF", appliesTo: { tag: "Paneer" }, condition: "{\\"and\\": [{\\"==\\": [{\\"var\\": \\"day\\"}, 0]}, {\\"==\\": [{\\"var\\": \\"mealType\\"}, \\"Dinner\\"]}]}"

2. "Dal on alternate days" ->
   action: "LIMIT", appliesTo: { tag: "Dal" }, max: 1, windowSize: 2, condition: "{\\"==\\": [1, 1]}"

Always fill "preview" with a plain-English restatement of every rule, so a human can catch a misreading before it's saved.`;

export async function parseMenuConstraints(
  text: string,
  dishCatalog: { id: string; name: string; mealType: string; tags?: string[] }[]
) {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  const result = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: `${SYSTEM_PROMPT}\n\nDish catalog:\n${JSON.stringify(dishCatalog)}\n\nAdmin's rules:\n${text}`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: RULE_SCHEMA,
    },
  });

  const responseText = (result.text as string).replace(/```json/g, '').replace(/```/g, '').trim();

  const parsed = JSON.parse(responseText) as {
    rules: Array<Record<string, any>>;
    preview: string;
  };

  for (const r of parsed.rules) {
      if (typeof r.condition === 'string') {
          try {
             r.condition = JSON.parse(r.condition);
          } catch(e) {
             r.condition = { "==": [1, 1] }; // Fallback
          }
      }
  }
  return parsed;
}
