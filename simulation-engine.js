// simulation-engine.js
// Physics-grounded deterministic state simulation for procedural cases

(function(global) {
  function simulateMachineState(caseObj, operatingState, appliedRepairs = []) {
    const machine = global.FF_DB.MACHINE_DATABASE[caseObj.machineId];
    const base = machine.baseParams;
    const primaryFault = global.FF_FAULTS.FAULT_CATALOG.find(f => f.id === caseObj.primaryFaultId);
    const compound = caseObj.compoundId
      ? global.FF_FAULTS.COMPOUND_INTERACTIONS.find(c => c.id === caseObj.compoundId)
      : null;

    const primaryFixed = appliedRepairs.includes(
      primaryFault.repairs.find(r => r.fixes && r.fixes.includes(primaryFault.id)).id
    );
    const secondaryFixed = !compound || appliedRepairs.includes(compound.extraRepair.id);

    const loadPct = operatingState.load ?? base.ratedLoad;
    const loadRatio = loadPct / 100;
    const rpmSetting = operatingState.rpm ?? base.ratedRpm;
    const rpmRatio = rpmSetting / base.ratedRpm;
    const durationMin = operatingState.duration ?? 15;
    const ambient = operatingState.ambientTemp ?? caseObj.operatingConditions.ambientTemp;

    // Effective multipliers
    let flowFactor = 1.0;
    let tempRiseFactor = 1.0;
    let pressureFactor = 1.0;
    let vibFactor = 1.0;
    let decayRate = 1.2; // bar per 10s nominal
    let syncMismatch = 28; // RPM nominal
    let inputDragRpm = 8;
    let afrValue = 14.3;
    let idleRpm = 850;
    let slipPct = 0.8;
    let rpmDroop = 0;

    if (!primaryFixed) {
      const fx = primaryFault.secondaryEffects;
      // Condition-dependent scaling
      const condActive =
        primaryFault.conditionDependent === 'always' ||
        (primaryFault.conditionDependent === 'high_load' && loadPct >= 65) ||
        (primaryFault.conditionDependent === 'high_rpm' && rpmRatio >= 0.9) ||
        (primaryFault.conditionDependent === 'high_pressure' && loadPct >= 60) ||
        (primaryFault.conditionDependent === 'sustained_run' && durationMin >= 10) ||
        (primaryFault.conditionDependent === 'hot_run' && durationMin >= 12) ||
        (primaryFault.conditionDependent === 'fast_shift') ||
        (primaryFault.conditionDependent === 'idle_low_load' && loadPct <= 35);

      const severityScale = condActive ? 1.0 : 0.25;

      if (fx.flowFactor) flowFactor *= 1 - (1 - fx.flowFactor) * severityScale;
      if (fx.tempRiseFactor) tempRiseFactor *= 1 + (fx.tempRiseFactor - 1) * severityScale;
      if (fx.pressureFactor) pressureFactor *= 1 - (1 - fx.pressureFactor) * severityScale;
      if (fx.vibFactor) vibFactor *= 1 + (fx.vibFactor - 1) * severityScale;
      if (fx.decayRate) decayRate = 1.2 + (fx.decayRate - 1.2) * severityScale;
      if (fx.syncMismatch) syncMismatch = 28 + (fx.syncMismatch - 28) * severityScale;
      if (fx.inputDragRpm) inputDragRpm = 8 + (fx.inputDragRpm - 8) * severityScale;
      if (fx.afrOffset) afrValue += fx.afrOffset * severityScale;
      if (fx.idleOffset) idleRpm += fx.idleOffset * (loadPct <= 25 ? 1.0 : 0.2);
      if (fx.slipPct) slipPct = 0.8 + (fx.slipPct - 0.8) * severityScale;
      if (fx.rpmDroop) rpmDroop = fx.rpmDroop * severityScale;
    }

    if (compound && !secondaryFixed) {
      const cfx = compound.extraEffects;
      if (cfx.flowFactor) flowFactor *= cfx.flowFactor;
      if (cfx.tempRiseFactor) tempRiseFactor *= cfx.tempRiseFactor;
      if (cfx.pressureFactor) pressureFactor *= cfx.pressureFactor;
      if (cfx.syncMismatch) syncMismatch += cfx.syncMismatch;
      if (cfx.inputDragRpm) inputDragRpm += cfx.inputDragRpm;
    }

    // Compute physical outputs
    const actualRpm = Math.round(rpmSetting - rpmDroop * loadRatio);
    const actualFlow = +(base.nominalFlow * rpmRatio * flowFactor).toFixed(1);
    const actualPressure = +(base.nominalPressure * pressureFactor * ((0.85 + 0.15 * rpmRatio))).toFixed(2);

    const thermalLoad = (0.35 + 0.65 * loadRatio) * (0.6 + 0.4 * Math.min(1.5, durationMin / 15));
    const baseTempRise = machine.id === 'diesel_generator' ? 54 : 36;
    const actualTemp = +(ambient + baseTempRise * thermalLoad * tempRiseFactor).toFixed(1);

    const engineDeltaT = machine.id === 'diesel_generator'
      ? +((8.5 * (0.4 + 0.6 * loadRatio)) / Math.max(0.35, flowFactor)).toFixed(1)
      : +(6.2 * thermalLoad * tempRiseFactor).toFixed(1);

    const actualVibration = +(base.nominalVibration * vibFactor * (0.75 + 0.25 * rpmRatio)).toFixed(2);
    const outputTorque = +(145 * loadRatio * (1 - slipPct / 100) * (rpmDroop > 0 ? 0.86 : 1.0)).toFixed(1);

    return {
      machineId: machine.id,
      loadPct,
      durationMin,
      rpm: actualRpm,
      flow: actualFlow,
      pressure: actualPressure,
      temperature: actualTemp,
      engineDeltaT,
      vibration: actualVibration,
      decayRate: +decayRate.toFixed(1),
      syncMismatch: Math.round(syncMismatch),
      inputDragRpm: Math.round(inputDragRpm),
      afr: +afrValue.toFixed(1),
      idleRpm: Math.round(idleRpm),
      slipPct: +slipPct.toFixed(1),
      outputTorque,
      primaryFixed,
      secondaryFixed,
      allFaultsFixed: primaryFixed && secondaryFixed
    };
  }

  global.FF_SIM = { simulateMachineState };
})(typeof window !== 'undefined' ? window : globalThis);
