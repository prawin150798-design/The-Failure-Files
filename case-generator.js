// case-generator.js
// Seeded PRNG procedural case generator with validation and fingerprint deduplication

(function(global) {
  function createSeededRng(seedStr) {
    let h = 1779033703 ^ seedStr.length;
    for (let i = 0; i < seedStr.length; i++) {
      h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function() {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
  }

  const INVESTIGATION_FORMATS = [
    { id: 'fault_diagnosis', label: 'Standard Fault Diagnosis', weight: 25 },
    { id: 'intermittent_failure', label: 'Condition-Dependent / Intermittent Failure', weight: 20 },
    { id: 'incorrect_previous_repair', label: 'Botched Previous Repair Investigation', weight: 20 },
    { id: 'conflicting_evidence', label: 'Conflicting Evidence & Telemetry Audit', weight: 15 },
    { id: 'multiple_interacting', label: 'Interacting Multi-Fault Cascade', weight: 12 },
    { id: 'experimental_archive', label: 'Inventor’s Prototype Anomaly', weight: 8 }
  ];

  const CLIENT_PROFILES = [
    'Northport Marine & Power Ltd.',
    'Apex Stamping & Forging Works',
    'Meridian Logistics Fleet Depot',
    'Vanguard Precision Machining',
    'Kestrel Cold-Storage Plant',
    'Clandestine Vault Archive — Sector 7'
  ];

  function pickWeighted(rng, items) {
    const total = items.reduce((s, x) => s + x.weight, 0);
    let r = rng() * total;
    for (const item of items) {
      r -= item.weight;
      if (r <= 0) return item;
    }
    return items[items.length - 1];
  }

  function generateCase(options = {}) {
    const seed = options.seed || ('FF-' + Math.random().toString(36).substring(2, 8).toUpperCase());
    const difficulty = options.difficulty || 'investigator';
    const playerRank = options.playerRank ?? 1;
    const recentFingerprints = options.recentFingerprints || [];

    const tier = global.FF_DIFFICULTY.DIFFICULTY_TIERS[difficulty];
    const rng = createSeededRng(seed);

    // Filter unlocked machines
    const allMachines = Object.values(global.FF_DB.MACHINE_DATABASE);
    const eligibleMachines = allMachines.filter(m => m.unlockRank <= playerRank);

    for (let attempt = 0; attempt < 25; attempt++) {
      const format = pickWeighted(rng, INVESTIGATION_FORMATS);
      let machine = eligibleMachines[Math.floor(rng() * eligibleMachines.length)];
      if (format.id === 'experimental_archive') {
        const exp = eligibleMachines.find(m => m.isExperimental);
        if (exp) machine = exp;
      }

      const matchingFaults = global.FF_FAULTS.FAULT_CATALOG.filter(f => f.machineId === machine.id);
      if (!matchingFaults.length) continue;

      const primaryFault = matchingFaults[Math.floor(rng() * matchingFaults.length)];

      // Optional compound fault based on difficulty
      let compound = null;
      if (tier.allowCompound && (format.id === 'multiple_interacting' || rng() < tier.compoundChance)) {
        const possibleCompounds = global.FF_FAULTS.COMPOUND_INTERACTIONS.filter(
          c => c.primaryFaultId === primaryFault.id
        );
        if (possibleCompounds.length) {
          compound = possibleCompounds[Math.floor(rng() * possibleCompounds.length)];
        }
      }

      const ambientTemp = Math.round(18 + rng() * 20);
      const operatingHours = Math.round(1200 + rng() * 14000);
      const client = machine.isExperimental
        ? 'Clandestine Vault Archive — Sector 7'
        : CLIENT_PROFILES[Math.floor(rng() * (CLIENT_PROFILES.length - 1))];

      const fingerprint = `${machine.id}:${primaryFault.id}:${compound ? compound.id : 'single'}:${format.id}`;
      if (recentFingerprints.includes(fingerprint) && attempt < 20) {
        continue;
      }

      // Build combined repair options
      const repairOptions = [...primaryFault.repairs];
      if (compound && !repairOptions.some(r => r.id === compound.extraRepair.id)) {
        repairOptions.push(compound.extraRepair);
      }

      // Select misleading clues according to difficulty
      const misleadingClues = primaryFault.misleadingClues.slice(0, tier.misleadingClueCount);

      const caseObj = {
        id: 'PROC-' + seed,
        seed,
        fingerprint,
        difficulty,
        formatId: format.id,
        formatLabel: format.label,
        client,
        machineId: machine.id,
        machineName: machine.name,
        industry: machine.industry,
        isExperimental: !!machine.isExperimental,
        title: `${machine.name}: ${format.label}`,
        primaryFaultId: primaryFault.id,
        compoundId: compound ? compound.id : null,
        operatingConditions: {
          ambientTemp,
          operatingHours,
          defaultLoad: machine.baseParams.ratedLoad,
          defaultDuration: 15
        },
        symptoms: [...primaryFault.symptoms],
        misleadingClues,
        repairOptions,
        diagnosticBudget: tier.diagnosticBudget,
        createdAt: Date.now()
      };

      // Validate solvability & consistency before returning
      const validation = validateGeneratedCase(caseObj);
      if (validation.valid) {
        return caseObj;
      }
    }

    throw new Error('Failed to generate valid procedural case after 25 attempts.');
  }

  function validateGeneratedCase(caseObj) {
    const primaryFault = global.FF_FAULTS.FAULT_CATALOG.find(f => f.id === caseObj.primaryFaultId);
    if (!primaryFault) return { valid: false, reason: 'Missing primary fault definition.' };

    // 1. Verify broken state fails acceptance criteria
    const brokenResult = global.FF_ACCEPTANCE.runAcceptanceSuite(caseObj, []);
    if (brokenResult.passed) {
      return { valid: false, reason: 'Case already passes acceptance without any repair.' };
    }

    // 2. Verify valid repair passes acceptance criteria
    const correctPrimaryRepair = primaryFault.repairs.find(r => r.fixes && r.fixes.includes(primaryFault.id));
    if (!correctPrimaryRepair) return { valid: false, reason: 'No valid primary repair defined.' };

    const solutionRepairs = [correctPrimaryRepair.id];
    if (caseObj.compoundId) {
      const comp = global.FF_FAULTS.COMPOUND_INTERACTIONS.find(c => c.id === caseObj.compoundId);
      if (comp) solutionRepairs.push(comp.extraRepair.id);
    }

    const fixedResult = global.FF_ACCEPTANCE.runAcceptanceSuite(caseObj, solutionRepairs);
    if (!fixedResult.passed) {
      return { valid: false, reason: 'Solution repairs fail acceptance criteria.' };
    }

    return { valid: true };
  }

  global.FF_GENERATOR = { generateCase, validateGeneratedCase, createSeededRng };
})(typeof window !== 'undefined' ? window : globalThis);
