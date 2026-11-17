// acceptance-engine.js
// Independent post-repair simulation verification against measurable acceptance criteria

(function(global) {
  function buildAcceptanceCriteria(caseObj) {
    const machine = global.FF_DB.MACHINE_DATABASE[caseObj.machineId];
    const base = machine.baseParams;
    const tol = global.FF_DIFFICULTY.DIFFICULTY_TIERS[caseObj.difficulty].toleranceMultiplier;

    switch (machine.id) {
      case 'automotive_cooling_system':
        return [
          {
            id: 'crit_temp',
            name: 'Sustained Coolant Temperature (85% load, 20 min)',
            testLoad: 85,
            testDuration: 20,
            metric: 'temperature',
            targetText: `≤ ${(94 * tol).toFixed(1)}°C`,
            evaluate: sim => ({
              actual: `${sim.temperature}°C`,
              ok: sim.temperature <= 94 * tol,
              explanation: sim.temperature <= 94 * tol
                ? 'Thermal equilibrium stabilised safely below shutdown threshold.'
                : 'Coolant temperature exceeded safe limit under sustained high load.'
            })
          },
          {
            id: 'crit_flow',
            name: 'Coolant Circulation Rate',
            testLoad: 85,
            testDuration: 20,
            metric: 'flow',
            targetText: `≥ ${(95 / tol).toFixed(0)} L/min`,
            evaluate: sim => ({
              actual: `${sim.flow} L/min`,
              ok: sim.flow >= 95 / tol,
              explanation: sim.flow >= 95 / tol
                ? 'Mass flow rate adequate to carry full-load combustion heat.'
                : 'Circulation rate remains restricted; heat rejection is starved.'
            })
          },
          {
            id: 'crit_rpm',
            name: 'Engine Speed Stability',
            testLoad: 85,
            testDuration: 20,
            metric: 'rpm',
            targetText: '3300–3700 RPM',
            evaluate: sim => ({
              actual: `${sim.rpm} RPM`,
              ok: sim.rpm >= 3300 && sim.rpm <= 3700,
              explanation: sim.rpm >= 1485 && sim.rpm <= 1515
                ? 'Engine speed remains stable under the specified road-load test.'
                : 'Engine speed moved outside the expected operating range.'
            })
          }
        ];

      case 'manual_transmission':
        return [
          {
            id: 'crit_sync',
            name: '3rd-Gear Synchronisation Delta (0.25s shift)',
            testLoad: 75,
            testDuration: 10,
            metric: 'syncMismatch',
            targetText: `≤ ${Math.round(50 * tol)} RPM`,
            evaluate: sim => ({
              actual: `${sim.syncMismatch} RPM`,
              ok: sim.syncMismatch <= 50 * tol,
              explanation: sim.syncMismatch <= 50 * tol
                ? 'Dog teeth engage cleanly without clash or baulking.'
                : 'Residual speed differential still causes gear clash.'
            })
          },
          {
            id: 'crit_drag',
            name: 'Clutch-Released Input Shaft Drag',
            testLoad: 75,
            testDuration: 10,
            metric: 'inputDragRpm',
            targetText: `≤ ${Math.round(20 * tol)} RPM`,
            evaluate: sim => ({
              actual: `${sim.inputDragRpm} RPM`,
              ok: sim.inputDragRpm <= 20 * tol,
              explanation: sim.inputDragRpm <= 20 * tol
                ? 'Clutch disengages cleanly during gear transitions.'
                : 'Input shaft continues dragging when clutch is depressed.'
            })
          },
          {
            id: 'crit_vib',
            name: 'Gearbox Housing Vibration (3200 RPM)',
            testLoad: 75,
            testDuration: 10,
            metric: 'vibration',
            targetText: `≤ ${(3.2 * tol).toFixed(1)} mm/s`,
            evaluate: sim => ({
              actual: `${sim.vibration} mm/s`,
              ok: sim.vibration <= 3.2 * tol,
              explanation: sim.vibration <= 3.2 * tol
                ? 'Shaft bearings and gear mesh run smoothly.'
                : 'Abnormal bearing whine/vibration persists under load.'
            })
          }
        ];

      case 'petrol_efi_engine':
        return [
          {
            id: 'crit_afr_load',
            name: 'High-Load Air-Fuel Ratio (4500 RPM)',
            testLoad: 75,
            testDuration: 10,
            metric: 'afr',
            targetText: '13.2–14.8 : 1',
            evaluate: sim => ({
              actual: `${sim.afr}:1`,
              ok: sim.afr >= 13.2 && sim.afr <= 14.8,
              explanation: sim.afr >= 13.2 && sim.afr <= 14.8
                ? 'Mixture stoichiometry verified safe under load.'
                : 'Mixture remains lean under power—risk of detonation.'
            })
          },
          {
            id: 'crit_rail_press',
            name: 'Fuel Rail Differential Pressure',
            testLoad: 75,
            testDuration: 10,
            metric: 'pressure',
            targetText: '3.3–3.7 bar',
            evaluate: sim => ({
              actual: `${sim.pressure} bar`,
              ok: sim.pressure >= 3.3 && sim.pressure <= 3.7,
              explanation: sim.pressure >= 3.3 && sim.pressure <= 3.7
                ? 'Fuel rail maintains steady injection pressure.'
                : 'Rail pressure falls short under high fuel demand.'
            })
          },
          {
            id: 'crit_idle',
            name: 'Closed-Loop Idle Stability',
            testLoad: 10,
            testDuration: 5,
            metric: 'idleRpm',
            targetText: '800–920 RPM',
            evaluate: sim => ({
              actual: `${sim.idleRpm} RPM`,
              ok: sim.idleRpm >= 800 && sim.idleRpm <= 920,
              explanation: sim.idleRpm >= 800 && sim.idleRpm <= 920
                ? 'Idle speed settles cleanly with zero unmetered air leak.'
                : 'Idle speed remains elevated or unstable.'
            })
          }
        ];

      default: // experimental_cvt_drive
        return [
          {
            id: 'crit_cvt_slip',
            name: 'Variator Traction Slip (85% torque)',
            testLoad: 85,
            testDuration: 15,
            metric: 'slipPct',
            targetText: `≤ ${(1.8 * tol).toFixed(1)}%`,
            evaluate: sim => ({
              actual: `${sim.slipPct}%`,
              ok: sim.slipPct <= 1.8 * tol,
              explanation: sim.slipPct <= 1.8 * tol
                ? 'Elastohydrodynamic film transmits torque without gross slip.'
                : 'Micro-slip exceeds prototype traction threshold.'
            })
          },
          {
            id: 'crit_cvt_clamp',
            name: 'Servo Clamping Pressure',
            testLoad: 85,
            testDuration: 15,
            metric: 'pressure',
            targetText: '42–49 bar',
            evaluate: sim => ({
              actual: `${sim.pressure} bar`,
              ok: sim.pressure >= 42 && sim.pressure <= 49,
              explanation: sim.pressure >= 42 && sim.pressure <= 49
                ? 'Clamping force tracks torque demand accurately.'
                : 'Servo clamping pressure lags behind load.'
            })
          },
          {
            id: 'crit_cvt_temp',
            name: 'Traction Fluid Operating Temperature',
            testLoad: 85,
            testDuration: 20,
            metric: 'temperature',
            targetText: `≤ ${(72 * tol).toFixed(1)}°C`,
            evaluate: sim => ({
              actual: `${sim.temperature}°C`,
              ok: sim.temperature <= 72 * tol,
              explanation: sim.temperature <= 72 * tol
                ? 'Traction fluid shear stability preserved.'
                : 'Flash heating from slip is degrading traction fluid.'
            })
          }
        ];
    }
  }

  function runAcceptanceSuite(caseObj, appliedRepairs = []) {
    const criteria = buildAcceptanceCriteria(caseObj);
    const results = criteria.map(c => {
      const sim = global.FF_SIM.simulateMachineState(
        caseObj,
        { load: c.testLoad, duration: c.testDuration },
        appliedRepairs
      );
      const outcome = c.evaluate(sim);
      return {
        id: c.id,
        name: c.name,
        target: c.targetText,
        actual: outcome.actual,
        ok: outcome.ok,
        explanation: outcome.explanation
      };
    });

    return {
      passed: results.every(r => r.ok),
      passCount: results.filter(r => r.ok).length,
      totalCount: results.length,
      rows: results
    };
  }

  global.FF_ACCEPTANCE = { buildAcceptanceCriteria, runAcceptanceSuite };
})(typeof window !== 'undefined' ? window : globalThis);
