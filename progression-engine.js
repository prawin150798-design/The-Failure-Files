// progression-engine.js & case-history.js
// Tracks career XP, ranks, tool unlocks, inventor archive discoveries, and deduplicated history

(function(global) {
  const RANKS = [
    { level: 0, title: 'Junior Field Technician', minXp: 0 },
    { level: 1, title: 'Diagnostic Specialist', minXp: 900 },
    { level: 2, title: 'Senior Failure Analyst', minXp: 1600 },
    { level: 3, title: 'Chief Forensic Engineer', minXp: 2600 },
    { level: 4, title: 'Keeper of the Archive', minXp: 4000 }
  ];

  function computePlayerRank(totalXp) {
    let current = RANKS[0];
    for (const r of RANKS) {
      if (totalXp >= r.minXp) current = r;
    }
    return current;
  }

  function buildDebrief(caseObj, sessionState, acceptanceResult) {
    const primaryFault = global.FF_FAULTS.FAULT_CATALOG.find(f => f.id === caseObj.primaryFaultId);
    const compound = caseObj.compoundId
      ? global.FF_FAULTS.COMPOUND_INTERACTIONS.find(c => c.id === caseObj.compoundId)
      : null;

    const tier = global.FF_DIFFICULTY.DIFFICULTY_TIERS[caseObj.difficulty];
    const runs = sessionState.testsRun;
    // A repeated run of the same tool under identical conditions adds no information.
    const repeatedTests = runs.filter((t, i) =>
      runs.findIndex(u => u.toolId === t.toolId && u.load === t.load && u.duration === t.duration) < i).length;
    const uniqueTests = runs.length - repeatedTests;

    const applied = sessionState.repairsApplied.map(id => caseObj.repairOptions.find(r => r.id === id)).filter(Boolean);
    const isNeeded = r => (r.fixes && r.fixes.includes(caseObj.primaryFaultId)) || r.fixesSecondary;
    const wasted = applied.filter(r => !isNeeded(r));
    const wrongRepairs = wasted.length;
    const wastedCost = wasted.reduce((s, r) => s + r.cost, 0);
    const totalCost = applied.reduce((s, r) => s + r.cost, 0);
    const downtime = applied.reduce((s, r) => s + r.time, 0);
    const testsUsed = runs.length;

    const efficiencyScore = Math.max(20, Math.min(100, Math.round(
      100 - wrongRepairs * 12 * tier.repairBudgetPenalty - repeatedTests * 6 - Math.max(0, uniqueTests - 4) * 4 - (sessionState.hints || 0) * 4
    )));
    const earnedXp = acceptanceResult.passed
      ? Math.round((180 + efficiencyScore * 1.2) * tier.xpMultiplier)
      : 25;

    return {
      solved: acceptanceResult.passed,
      rootCauseTitle: primaryFault.title,
      faultType: primaryFault.faultType,
      compoundTitle: compound ? compound.secondaryTitle : null,
      interactionNote: compound ? compound.interactionNote : null,
      whyItBehavedThatWay: primaryFault.concept,
      misleadingCluesExplained: primaryFault.misleadingClues.map(c => ({
        source: c.source,
        claim: c.text,
        reality: c.explanation
      })),
      testsUsed,
      repeatedTests,
      wrongRepairs,
      wastedCost,
      totalCost,
      downtime,
      efficiencyScore,
      earnedXp,
      optimalPathHint: `Inspect ${primaryFault.primaryComponent.replace(/_/g, ' ')}, verify readings under ${primaryFault.conditionDependent.replace(/_/g, ' ')} conditions, and apply targeted repair.`
    };
  }

  global.FF_PROGRESSION = { RANKS, computePlayerRank, buildDebrief };
})(typeof window !== 'undefined' ? window : globalThis);
