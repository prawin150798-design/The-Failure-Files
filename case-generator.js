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

  const TIER_CODE = { apprentice: 'a', investigator: 'i', master: 'm' };
  const CODE_TIER = { a: 'apprentice', i: 'investigator', m: 'master' };

  // Replay codes look like FF-AB12CD~i1~3 (base seed ~ tier + rank ~ attempt index).
  // They carry everything needed to rebuild the identical case, independent of play history.
  function parseSeed(raw) {
    const s = String(raw || '').trim();
    const full = /^(FF-[A-Za-z0-9]{3,12})~([aimAIM])(\d)~(\d{1,2})$/.exec(s);
    if (full) return { base: full[1].toUpperCase(), difficulty: CODE_TIER[full[2].toLowerCase()], rank: +full[3], attempt: +full[4] };
    const bare = s.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 15);
    return bare ? { base: bare } : {};
  }

  function shuffle(rng, arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function generateCase(options = {}) {
    const parsed = parseSeed(options.seed);
    const base = parsed.base || ('FF-' + Math.random().toString(36).substring(2, 8).toUpperCase());
    const difficulty = parsed.difficulty || options.difficulty || 'investigator';
    const playerRank = parsed.rank ?? options.playerRank ?? 0;
    const fixedAttempt = parsed.attempt ?? null;
    const recentFingerprints = fixedAttempt === null ? (options.recentFingerprints || []) : [];

    const tier = global.FF_DIFFICULTY.DIFFICULTY_TIERS[difficulty];
    if (!tier) throw new Error('Unknown difficulty: ' + difficulty);

    const eligibleMachines = Object.values(global.FF_DB.MACHINE_DATABASE).filter(m => m.unlockRank <= playerRank);
    const first = fixedAttempt ?? 0;
    const last = fixedAttempt === null ? 40 : fixedAttempt + 1;

    // Each attempt has its own RNG stream, so attempt N always yields the same case.
    for (let attempt = first; attempt < last; attempt++) {
      const rng = createSeededRng(base + '#' + attempt);
      const format = pickWeighted(rng, INVESTIGATION_FORMATS);
      let machine = eligibleMachines[Math.floor(rng() * eligibleMachines.length)];
      if (format.id === 'experimental_archive') {
        machine = eligibleMachines.find(m => m.isExperimental);
        if (!machine) continue; // prototype anomalies only exist on the prototype machine
      }

      const matchingFaults = global.FF_FAULTS.FAULT_CATALOG.filter(f => f.machineId === machine.id);
      if (!matchingFaults.length) continue;
      const primaryFault = matchingFaults[Math.floor(rng() * matchingFaults.length)];

      let compound = null;
      if (tier.allowCompound && (format.id === 'multiple_interacting' || rng() < tier.compoundChance)) {
        const options2 = global.FF_FAULTS.COMPOUND_INTERACTIONS.filter(c => c.primaryFaultId === primaryFault.id);
        if (options2.length) compound = options2[Math.floor(rng() * options2.length)];
      }
      if (format.id === 'multiple_interacting' && !compound) continue; // format promises two faults

      const ambientTemp = Math.round(18 + rng() * 20);
      const operatingHours = Math.round(1200 + rng() * 14000);
      const client = machine.isExperimental
        ? 'Clandestine Vault Archive — Sector 7'
        : CLIENT_PROFILES[Math.floor(rng() * (CLIENT_PROFILES.length - 1))];

      const fingerprint = `${machine.id}:${primaryFault.id}:${compound ? compound.id : 'single'}:${format.id}`;
      if (recentFingerprints.includes(fingerprint) && attempt < first + 30) continue;

      // The compound's repair replaces any same-id decoy so it is never mislabelled as a wrong repair.
      const repairs = primaryFault.repairs
        .filter(r => !compound || r.id !== compound.extraRepair.id)
        .map(r => ({ ...r }));
      if (compound) repairs.push({ ...compound.extraRepair });
      const repairOptions = shuffle(rng, repairs);

      const caseObj = {
        id: 'PROC-' + base,
        seed: `${base}~${TIER_CODE[difficulty]}${playerRank}~${attempt}`,
        baseSeed: base,
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
        misleadingClues: primaryFault.misleadingClues.slice(0, tier.misleadingClueCount),
        repairOptions,
        diagnosticBudget: tier.diagnosticBudget
      };

      const validation = validateGeneratedCase(caseObj);
      if (validation.valid) return caseObj;
      if (fixedAttempt !== null) throw new Error('Replay code no longer produces a valid case: ' + validation.reason);
    }
    throw new Error('Failed to generate a valid procedural case.');
  }

  function validateGeneratedCase(caseObj) {
    const primaryFault = global.FF_FAULTS.FAULT_CATALOG.find(f => f.id === caseObj.primaryFaultId);
    if (!primaryFault) return { valid: false, reason: 'Missing primary fault definition.' };
    const acc = global.FF_ACCEPTANCE;

    if (acc.runAcceptanceSuite(caseObj, []).passed) {
      return { valid: false, reason: 'Case already passes acceptance without any repair.' };
    }

    const primaryRepair = primaryFault.repairs.find(r => r.fixes && r.fixes.includes(primaryFault.id));
    if (!primaryRepair) return { valid: false, reason: 'No valid primary repair defined.' };
    const solution = [primaryRepair.id];
    if (caseObj.compoundId) {
      const comp = global.FF_FAULTS.COMPOUND_INTERACTIONS.find(c => c.id === caseObj.compoundId);
      if (!comp) return { valid: false, reason: 'Missing compound definition.' };
      solution.push(comp.extraRepair.id);
      // A compound case must genuinely need both repairs.
      if (acc.runAcceptanceSuite(caseObj, [primaryRepair.id]).passed) return { valid: false, reason: 'Primary repair alone passes the compound case.' };
      if (acc.runAcceptanceSuite(caseObj, [comp.extraRepair.id]).passed) return { valid: false, reason: 'Secondary repair alone passes the compound case.' };
    }
    if (!acc.runAcceptanceSuite(caseObj, solution).passed) return { valid: false, reason: 'Solution repairs fail acceptance criteria.' };

    // Every offered repair outside the solution must fail on its own, and every solution repair must be offered.
    for (const id of solution) if (!caseObj.repairOptions.some(r => r.id === id)) return { valid: false, reason: 'Solution repair is not offered.' };
    for (const r of caseObj.repairOptions) {
      if (!solution.includes(r.id) && acc.runAcceptanceSuite(caseObj, [r.id]).passed) return { valid: false, reason: 'Decoy repair passes acceptance.' };
    }
    return { valid: true };
  }

  global.FF_GENERATOR = { generateCase, validateGeneratedCase, createSeededRng, parseSeed };
})(typeof window !== 'undefined' ? window : globalThis);
