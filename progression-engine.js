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

    const testsUsed = sessionState.testsRun.length;
    const wrongRepairs = sessionState.wrongRepairs || 0;
    const efficiencyScore = Math.max(
      20,
      Math.min(100, Math.round(100 - wrongRepairs * 18 - Math.max(0, testsUsed - 3) * 7))
    );

    const tier = global.FF_DIFFICULTY.DIFFICULTY_TIERS[caseObj.difficulty];
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
      wrongRepairs,
      efficiencyScore,
      earnedXp,
      optimalPathHint: `Inspect ${primaryFault.primaryComponent.replace(/_/g, ' ')}, verify readings under ${primaryFault.conditionDependent.replace(/_/g, ' ')} conditions, and apply targeted repair.`
    };
  }

  global.FF_PROGRESSION = { RANKS, computePlayerRank, buildDebrief };
})(typeof window !== 'undefined' ? window : globalThis);
