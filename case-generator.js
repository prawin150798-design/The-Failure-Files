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


  // Scenario archetypes change the *story and investigation structure*, not just readings.
  // Each archetype supplies a distinct operational context, history, and question to investigate.
  const SCENARIO_ARCHETYPES = [
    { id:'shift-change', formatId:'fault_diagnosis', title:'The Shift-Change Failure', weight:1, briefing:'The vehicle passes checks during the first shift but develops a fault after the handover. Compare how it behaves across operating periods.', profile:{load:72,duration:18,ambient:0,rpm:1}, events:[['3 shifts ago','A new driver took over the vehicle. The first shift reported normal operation.'],['2 shifts ago','The fault was first logged near the end of the evening shift.'],['Last shift','The next driver reproduced the symptom after a longer run.']] },
    { id:'heat-soak', formatId:'intermittent_failure', title:'The Heat-Soak Return', weight:1, briefing:'The fault disappears after a cool-down and returns as the vehicle heat-soaks. A cold inspection alone may be misleading.', profile:{load:68,duration:22,ambient:8,rpm:0.96}, events:[['Yesterday morning','Cold-start checks were within normal limits.'],['Yesterday afternoon','The fault appeared after sustained operation in a warm environment.'],['After shutdown','The symptom faded while the vehicle cooled.']] },
    { id:'cold-start', formatId:'fault_diagnosis', title:'The First-Start Problem', weight:1, briefing:'The vehicle behaves abnormally only during the first start after an extended shutdown. Once running, it appears healthy.', profile:{load:38,duration:4,ambient:-7,rpm:0.82}, events:[['Overnight','vehicle remained shut down for an extended period.'],['First start','driver recorded hesitation and abnormal readings.'],['Warm restart','The symptom was much less noticeable.']] },
    { id:'load-threshold', formatId:'fault_diagnosis', title:'The Load Threshold', weight:1, briefing:'The fault appears abruptly beyond a particular operating demand. Find the threshold rather than relying on one snapshot.', profile:{load:88,duration:12,ambient:2,rpm:1}, events:[['Routine operation','vehicle operated normally at light demand.'],['fleet operation increase','The fault appeared after demand crossed the usual operating range.'],['Load reduction','Symptoms reduced when demand was lowered.']] },
    { id:'short-cycle', formatId:'intermittent_failure', title:'The Short-Cycle Trap', weight:1, briefing:'drivers run the vehicle in short bursts. The reported issue may only emerge when cycles are repeated without enough recovery time.', profile:{load:76,duration:20,ambient:3,rpm:1}, events:[['Last week','Short isolated cycles appeared normal.'],['Two days ago','Repeated cycles began producing inconsistent results.'],['Current shift','The fault returned during a dense fleet operation schedule.']] },
    { id:'weather-exposure', formatId:'fault_diagnosis', title:'The Weather-Linked Incident', weight:1, briefing:'The problem began during a change in environmental conditions. Determine whether the environment is a trigger or merely a coincidence.', profile:{load:64,duration:14,ambient:14,rpm:0.94}, events:[['Earlier in month','No similar issue was recorded in mild conditions.'],['Weather change','drivers began reporting abnormal behaviour during hotter or more humid periods.'],['Current inspection','The vehicle is still showing symptoms under the reported conditions.']] },
    { id:'post-repair-comeback', formatId:'incorrect_previous_repair', title:'The Comeback Repair', weight:1, briefing:'A previous repair improved the vehicle briefly, but the complaint returned. Check whether the repair addressed a symptom instead of the cause.', profile:{load:82,duration:16,ambient:2,rpm:1}, events:[['Service visit','A component was replaced and the job was signed off.'],['Next operating day','Performance improved temporarily.'],['Today','The original complaint returned under fleet operation load.']] },
    { id:'wrong-part', formatId:'incorrect_previous_repair', title:'The Wrong-Part Installation', weight:1, briefing:'A replacement part was fitted, but its specification or compatibility is uncertain. Verify the installed system rather than trusting the invoice.', profile:{load:70,duration:15,ambient:0,rpm:0.9}, events:[['Parts request','A replacement was ordered using an incomplete description.'],['Installation','The vehicle was returned to service without a full comparison to the original specification.'],['Current shift','A new or persistent symptom was reported.']] },
    { id:'maintenance-debt', formatId:'incorrect_previous_repair', title:'Deferred Maintenance', weight:1, briefing:'Several minor maintenance actions were postponed. Determine which neglected condition has now become the primary failure.', profile:{load:78,duration:21,ambient:4,rpm:1}, events:[['Six weeks ago','A recommended inspection was deferred to avoid downtime.'],['Two weeks ago','An driver noted a small change but continued operation.'],['Today','The vehicle can no longer meet its normal duty.']] },
    { id:'sensor-trust', formatId:'conflicting_evidence', title:'Can the Sensor Be Trusted?', weight:1, briefing:'The control panel reports one condition while the driver and independent observations suggest another. Establish which evidence is trustworthy.', profile:{load:74,duration:13,ambient:1,rpm:1}, events:[['Last service','A sensor or instrument was recalibrated.'],['Yesterday','The panel reading disagreed with an driver observation.'],['Current shift','The vehicle was stopped pending independent verification.']] },
    { id:'paper-vs-vehicle', formatId:'conflicting_evidence', title:'The Paperwork Says Passed', weight:1, briefing:'The maintenance record says the vehicle passed, but the operating evidence tells a different story. Audit the test conditions and sign-off.', profile:{load:80,duration:17,ambient:0,rpm:1}, events:[['Service record','A post-maintenance check was marked complete.'],['fleet operation restart','The original symptom appeared under a different duty cycle.'],['Investigation','No raw measurement sheet was attached to the sign-off.']] },
    { id:'driver-workaround', formatId:'conflicting_evidence', title:'The Hidden Workaround', weight:1, briefing:'drivers have developed a workaround that masks the complaint. Reproduce the normal procedure before drawing conclusions.', profile:{load:66,duration:12,ambient:0,rpm:0.92}, events:[['Several weeks ago','drivers discovered a workaround that reduced the visible symptom.'],['Last week','The workaround became part of the normal operating routine.'],['Today','A new driver reported that the vehicle still feels wrong.']] },
    { id:'cascade', formatId:'multiple_interacting', title:'The Failure Cascade', weight:1, briefing:'One developing fault may have placed extra stress on another component. Identify both the initiating problem and the resulting damage.', profile:{load:86,duration:24,ambient:5,rpm:1}, events:[['Early warning','A minor abnormal reading was recorded but not investigated.'],['Progression','A second symptom appeared after continued operation.'],['Current condition','Both symptoms are now present under sustained load.']] },
    { id:'two-symptoms-one-cause', formatId:'multiple_interacting', title:'Two Symptoms, One Trail', weight:1, briefing:'Two complaints appeared close together. Do not assume they are independent; look for a shared physical cause and verify any secondary fault.', profile:{load:79,duration:19,ambient:2,rpm:0.98}, events:[['First report','drivers noticed a change in vehicle response.'],['Second report','A separate warning appeared during the same duty cycle.'],['Current shift','Both complaints occur together more often than not.']] },
    { id:'prototype-drift', formatId:'experimental_archive', title:'Prototype Calibration Drift', weight:1, briefing:'An inventor-era prototype has drifted away from its archived calibration. Compare current behaviour with the intended operating envelope.', profile:{load:83,duration:16,ambient:-2,rpm:1.04}, events:[['Archive entry','The last calibration values were recorded but not independently verified.'],['Recent run','The prototype began behaving differently near a transition point.'],['Current inspection','The archive and live readings no longer agree.']] },
    { id:'wrong-duty-cycle', formatId:'fault_diagnosis', title:'The Wrong Duty Cycle', weight:1, briefing:'The vehicle was designed for one duty cycle but is now being used differently. Decide whether the fault is damage, overload or a mismatch in application.', profile:{load:91,duration:23,ambient:3,rpm:1.02}, events:[['Original commissioning','The vehicle was specified for intermittent duty.'],['fleet operation change','Demand shifted toward longer continuous runs.'],['Current shift','The vehicle began failing before the end of the required cycle.']] },
    { id:'progressive-drift', formatId:'intermittent_failure', title:'The Slow Performance Drift', weight:1, briefing:'Performance has degraded gradually rather than failing suddenly. Compare old and new records to identify the trend.', profile:{load:69,duration:20,ambient:1,rpm:0.97}, events:[['One month ago','Output was within the normal operating band.'],['Two weeks ago','A small deviation appeared in routine readings.'],['Today','The accumulated drift is now affecting fleet operation.']] },
    { id:'restart-reset', formatId:'intermittent_failure', title:'The Restart Reset', weight:1, briefing:'A restart temporarily clears the symptom. Determine what changes during shutdown and what returns when the vehicle is loaded again.', profile:{load:73,duration:15,ambient:0,rpm:1}, events:[['First occurrence','Fault appeared during normal operation.'],['driver response','A restart restored normal behaviour temporarily.'],['Repeat occurrence','The fault returned after the same operating sequence.']] },
    { id:'boundary-condition', formatId:'conflicting_evidence', title:'The Boundary-Condition Test', weight:1, briefing:'Two test reports disagree because they were taken at different operating points. Recreate comparable conditions before interpreting the results.', profile:{load:84,duration:18,ambient:6,rpm:1.03}, events:[['Test A','A short test at low demand was recorded as passed.'],['Test B','A longer test at higher demand produced an abnormal result.'],['Current shift','The customer needs the vehicle to pass its actual duty cycle.']] },
    { id:'unusual-noise', formatId:'fault_diagnosis', title:'The Noise That Moves', weight:1, briefing:'An abnormal noise changes with speed or load. Use controlled operating changes to determine whether it follows rotation, pressure or temperature.', profile:{load:77,duration:14,ambient:0,rpm:1.08}, events:[['First report','A noise was noticed but could not be reproduced at idle.'],['Follow-up','The sound changed as operating speed increased.'],['Current shift','The driver can reproduce it under a specific duty condition.']] }
  ];

  function makeScenario(rng, formatId) {
    const choices = SCENARIO_ARCHETYPES.filter(x => x.formatId === formatId);
    return choices[Math.floor(rng() * choices.length)] || SCENARIO_ARCHETYPES[0];
  }

  const SCENARIO_METHODS = {
    'shift-change':['Compare two operating periods','Run a short baseline test, then compare it with the late-shift operating condition.'],
    'heat-soak':['Reproduce a hot condition','Compare a short cool run with a longer run; note when the readings begin to diverge.'],
    'cold-start':['Capture the first-start behaviour','Do not warm the vehicle before the baseline test. Compare cold-start and warm-restart behaviour.'],
    'load-threshold':['Find the failure threshold','Increase load in steps and identify the first operating point where the symptom appears.'],
    'short-cycle':['Compare isolated and repeated cycles','Run repeated cycles with and without recovery time; compare the trend across cycles.'],
    'weather-exposure':['Separate ambient effects from vehicle faults','Compare readings at different ambient conditions while keeping load and duration as consistent as possible.'],
    'post-repair-comeback':['Audit the previous repair','Check what was changed, then verify whether the original system condition was actually corrected.'],
    'wrong-part':['Verify part compatibility','Compare installed component specifications and system behaviour against the vehicle requirement.'],
    'maintenance-debt':['Trace deferred maintenance','Use service history to identify which neglected check is most relevant to the current symptoms.'],
    'sensor-trust':['Cross-check the instrument','Compare the panel value with an independent measurement before accepting either reading.'],
    'paper-vs-vehicle':['Audit the test sign-off','Recreate the recorded test conditions and determine whether the original acceptance test was representative.'],
    'driver-workaround':['Remove the workaround','Reproduce normal vehicle operation and compare it with the driver workaround.'],
    'cascade':['Identify the initiating fault','Separate the earliest abnormal reading from the later symptoms and test the likely causal sequence.'],
    'two-symptoms-one-cause':['Test for a shared cause','Look for one condition that changes both symptoms rather than treating each complaint independently.'],
    'prototype-drift':['Compare live and archived calibration','Check the current operating response against the archived reference points.'],
    'wrong-duty-cycle':['Recreate the actual duty cycle','Test the vehicle for the duration and demand the customer now requires, not only its original rating.'],
    'progressive-drift':['Compare historical trends','Use the timeline to compare earlier and current readings; look for a gradual change rather than a single outlier.'],
    'restart-reset':['Compare before and after restart','Capture the fault before shutdown, immediately after restart and after the original operating condition returns.'],
    'boundary-condition':['Standardise the test conditions','Repeat both tests at matched load, duration and ambient conditions before comparing results.'],
    'unusual-noise':['Isolate the variable linked to the noise','Change speed while holding load steady, then change load while holding speed steady.']
  };

  function buildScenarioHistory(scenario, hours) {
    const base = Math.max(2, Math.round(hours / 1200));
    return scenario.events.map((e, i) => [i === 0 ? `${base} weeks ago` : e[0], e[1]]);
  }

  const CLIENT_PROFILES = [
    'Northstar Motors — Customer Care',
    'Meridian City Taxi Fleet',
    'Apex Performance Garage',
    'Coastal Delivery Fleet',
    'Vanguard Rally Engineering',
    'The Inventor’s Private Motor Works'
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

    // Endless investigations are automotive-only. Legacy industrial definitions remain in
    // the database temporarily for save compatibility, but are never offered as new cases.
    const eligibleMachines = Object.values(global.FF_DB.MACHINE_DATABASE)
      .filter(m => m.unlockRank <= playerRank && /^Automotive\b/i.test(m.industry || ''));
    const first = fixedAttempt ?? 0;
    const last = fixedAttempt === null ? 40 : fixedAttempt + 1;

    // Each attempt has its own RNG stream, so attempt N always yields the same case.
    for (let attempt = first; attempt < last; attempt++) {
      const rng = createSeededRng(base + '#' + attempt);
      const format = pickWeighted(rng, INVESTIGATION_FORMATS);
      const scenario = makeScenario(rng, format.id);
      let machine = eligibleMachines[Math.floor(rng() * eligibleMachines.length)];
      if (format.id === 'experimental_archive') {
        machine = eligibleMachines.find(m => m.isExperimental && /drive|transmission/i.test(m.id));
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

      const ambientTemp = Math.max(8, Math.min(48, Math.round(18 + rng() * 20 + scenario.profile.ambient)));
      const operatingHours = Math.round(1200 + rng() * 14000);
      const defaultLoad = Math.max(25, Math.min(100, Math.round(machine.baseParams.ratedLoad * scenario.profile.load / 85)));
      const defaultDuration = Math.max(3, Math.min(30, Math.round(15 * scenario.profile.duration / 15)));
      const defaultRpm = Math.round(machine.baseParams.ratedRpm * scenario.profile.rpm);
      const client = machine.isExperimental
        ? 'Clandestine Vault Archive — Sector 7'
        : CLIENT_PROFILES[Math.floor(rng() * (CLIENT_PROFILES.length - 1))];

      const fingerprint = `${machine.id}:${primaryFault.id}:${compound ? compound.id : 'single'}:${scenario.id}`;
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
        vehicleId: machine.vehicleId || null,
        vehicleName: machine.vehicleId && global.FF_AUTO
          ? (global.FF_AUTO.getVehicle(machine.vehicleId) || {}).name || machine.name
          : machine.name,
        vehicleConfiguration: machine.vehicleId && global.FF_AUTO
          ? (global.FF_AUTO.getVehicle(machine.vehicleId) || {}).configuration || null
          : null,
        industry: machine.industry,
        isExperimental: !!machine.isExperimental,
        title: `${machine.name}: ${scenario.title}`,
        scenarioId: scenario.id,
        scenarioTitle: scenario.title,
        scenarioBriefing: scenario.briefing,
        scenarioMethod: SCENARIO_METHODS[scenario.id] || ['Investigate the operating pattern','Compare baseline and fault conditions before selecting a repair.'],
        scenarioHistory: buildScenarioHistory(scenario, operatingHours),
        scenarioProfile: { ...scenario.profile, defaultRpm },
        investigationObjective: scenario.briefing,
        primaryFaultId: primaryFault.id,
        compoundId: compound ? compound.id : null,
        operatingConditions: {
          ambientTemp,
          operatingHours,
          defaultLoad,
          defaultDuration,
          defaultRpm
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

  global.FF_GENERATOR = { generateCase, validateGeneratedCase, createSeededRng, parseSeed, SCENARIO_ARCHETYPES };
})(typeof window !== 'undefined' ? window : globalThis);
