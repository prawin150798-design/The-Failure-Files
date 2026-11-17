// difficulty-engine.js
// Manages analytical difficulty tiers (Apprentice, Investigator, Master Engineer) and adaptive scaling

(function(global) {
  const DIFFICULTY_TIERS = {
    apprentice: {
      id: 'apprentice',
      label: 'Apprentice',
      badge: 'TIER I · GUIDED',
      description: 'Clearer symptom correlations, single root cause, generous diagnostic budget, and analytical hints.',
      allowCompound: false,
      misleadingClueCount: 0,
      diagnosticBudget: 12,
      repairBudgetPenalty: 0.5,
      toleranceMultiplier: 1.25,
      xpMultiplier: 1.0
    },
    investigator: {
      id: 'investigator',
      label: 'Investigator',
      badge: 'TIER II · STANDARD',
      description: 'Competing hypotheses, misleading customer statements, condition-dependent faults, and moderate test budgets.',
      allowCompound: true,
      compoundChance: 0.35,
      misleadingClueCount: 1,
      diagnosticBudget: 6,
      repairBudgetPenalty: 1.0,
      toleranceMultiplier: 1.0,
      xpMultiplier: 1.5
    },
    master: {
      id: 'master',
      label: 'Master Engineer',
      badge: 'TIER III · UNFORGIVING',
      description: 'Interacting compound faults, incomplete/inaccurate records, tight diagnostic limits, and strict tolerances.',
      allowCompound: true,
      compoundChance: 0.75,
      misleadingClueCount: 2,
      diagnosticBudget: 4,
      repairBudgetPenalty: 1.5,
      toleranceMultiplier: 0.85,
      xpMultiplier: 2.2
    }
  };

  function computeAdaptiveTier(performanceHistory) {
    if (!performanceHistory || performanceHistory.length < 2) {
      return 'apprentice'; // new players start with the guided tier
    }
    const recent = performanceHistory.slice(-5);
    const avgScore = recent.reduce((acc, item) => acc + (item.efficiencyScore || 70), 0) / recent.length;
    const recentFails = recent.filter(item => !item.solved).length;

    if (recentFails >= 2 || avgScore < 58) return 'apprentice';
    if (avgScore >= 84 && recentFails === 0) return 'master';
    return 'investigator';
  }

  global.FF_DIFFICULTY = { DIFFICULTY_TIERS, computeAdaptiveTier };
})(typeof window !== 'undefined' ? window : globalThis);
