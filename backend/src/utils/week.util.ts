// utils/week.util.ts
export const getCurrentWeek = (): number => {
  const startOfYear = new Date('2025-01-01');
  const now = new Date();
  return Math.ceil(
    (now.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
};
