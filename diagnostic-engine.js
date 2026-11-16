// diagnostic-engine.js
// Generates contextual, condition-sensitive diagnostic instrument readings

(function(global) {
  function runDiagnosticTool(caseObj, toolId, operatingState, appliedRepairs = []) {
    const sim = global.FF_SIM.simulateMachineState(caseObj, operatingState, appliedRepairs);
    const machine = global.FF_DB.MACHINE_DATABASE[caseObj.machineId];
    const primaryFault = global.FF_FAULTS.FAULT_CATALOG.find(f => f.id === caseObj.primaryFaultId);

    switch (toolId) {
      case 'thermal_camera':
        return {
          toolId,
          label: 'Infrared Thermal Imager',
          summary: `Core/housing temp: ${sim.temperature}°C | Circuit ΔT: ${sim.engineDeltaT}°C at ${sim.loadPct}% load (${sim.durationMin} min).`,
          detail: sim.temperature > 96
            ? 'Thermal hotspot detected. Compare inlet vs outlet ΔT to distinguish flow starvation from heat-exchanger fouling.'
            : 'Temperatures within normal operating envelope under current load/duration.'
        };

      case 'flow_meter':
        return {
          toolId,
          label: 'Inline Ultrasonic Flow Meter',
          summary: `Measured flow: ${sim.flow} L/min (Nominal spec: ${(machine.baseParams.nominalFlow * 0.9).toFixed(0)}–${(machine.baseParams.nominalFlow * 1.1).toFixed(0)} L/min).`,
          detail: sim.flow < machine.baseParams.nominalFlow * 0.8
            ? 'Significant flow deficit recorded under current operating conditions.'
            : 'Volumetric circulation meets nominal specification.'
        };

      case 'pressure_gauge':
        if (machine.id === 'hydraulic_press') {
          return {
            toolId,
            label: 'Digital Differential Pressure Gauge',
            summary: `Peak pressure: ${sim.pressure} bar | 10s hold decay: ${sim.decayRate} bar lost.`,
            detail: sim.decayRate > 5.0
              ? 'Excessive pressure decay during static hold indicates internal bypass.'
              : 'System holds pressure cleanly within tolerance.'
          };
        }
        return {
          toolId,
          label: 'Digital Differential Pressure Gauge',
          summary: `Operating pressure: ${sim.pressure} bar (Nominal: ${machine.baseParams.nominalPressure} bar).`,
          detail: Math.abs(sim.pressure - machine.baseParams.nominalPressure) > machine.baseParams.nominalPressure * 0.18
            ? 'Pressure deviates significantly from specification.'
            : 'Pressure reading within expected band.'
        };

      case 'vibration_analyser':
        return {
          toolId,
          label: 'Tri-Axial FFT Vibration Analyser',
          summary: `RMS Vibration: ${sim.vibration} mm/s at ${sim.rpm} RPM.`,
          detail: sim.vibration > machine.baseParams.nominalVibration * 1.45
            ? 'Elevated harmonic vibration amplitude detected—check bearings, coupling alignment, or stick-slip.'
            : 'Vibration spectrum clean; rotating assembly balanced.'
        };

      case 'exhaust_gas_analyser':
        if (machine.id === 'petrol_efi_engine') {
          return {
            toolId,
            label: '5-Gas Wideband Exhaust Analyser',
            summary: `AFR: ${sim.afr}:1 at ${sim.loadPct}% load | Idle speed: ${sim.idleRpm} RPM.`,
            detail: sim.afr > 15.2
              ? 'Lean air-fuel mixture detected. Compare idle vs high-load AFR to separate vacuum leaks from fuel delivery limits.'
              : 'Stoichiometric combustion balanced across load range.'
          };
        }
        return {
          toolId,
          label: '5-Gas Wideband Exhaust Analyser',
          summary: `Exhaust temp: ${sim.temperature > 95 ? '640°C (High)' : '430°C (Normal)'} | O₂: ${sim.rpm < 1470 ? '3.1% (Rich/Smoke)' : '8.4% (Clean)'}.`,
          detail: sim.rpm < 1470 || sim.temperature > 95
            ? 'Elevated thermal combustion signature—verify air-to-fuel ratio and boost pressure.'
            : 'Combustion efficiency nominal.'
        };

      case 'tachometer_sync':
        if (machine.id === 'manual_transmission') {
          return {
            toolId,
            label: 'Dual-Channel Optical Tachometer',
            summary: `Shift speed mismatch: ${sim.syncMismatch} RPM | Clutch-released input drag: ${sim.inputDragRpm} RPM.`,
            detail: sim.syncMismatch > 50
              ? (sim.inputDragRpm > 45
                  ? 'Input shaft exhibits residual drag with clutch pedal depressed.'
                  : 'Clutch releases cleanly, but synchroniser cone fails to match shaft speeds within shift window.')
              : 'Shaft speeds synchronise smoothly (< 50 RPM delta).'
          };
        }
        return {
          toolId,
          label: 'Dual-Channel Optical Tachometer',
          summary: `Input: ${sim.rpm} RPM | Output torque: ${sim.outputTorque} Nm | Effective slip: ${sim.slipPct}%.`,
          detail: sim.slipPct > 2.5
            ? 'Traction slip spikes under load—verify clamping servo pressure.'
            : 'Drive ratio and slip within specification.'
        };

      case 'ultrasonic_leak_detector':
        return {
          toolId,
          label: 'Acoustic Ultrasonic Leak Probe',
          summary: sim.decayRate > 5.0
            ? `High-frequency internal bypass hiss localised at: ${primaryFault.primaryComponent.replace(/_/g, ' ')}.`
            : 'No abnormal internal bypass turbulence detected.',
          detail: 'Acoustic probe isolates internal fluid bypass without full teardown.'
        };

      case 'smoke_leak_tester':
        return {
          toolId,
          label: 'Pressurised Intake Smoke Generator',
          summary: (!sim.primaryFixed && primaryFault.id === 'efi_vacuum_leak')
            ? 'Visible smoke plume escaping from intake plenum flange gasket.'
            : 'Intake tract holds 0.5 bar test smoke with zero leakage.',
          detail: 'Definitive test for unmetered air ingress downstream of airflow meter.'
        };

      case 'oil_viscosity_tester':
        return {
          toolId,
          label: 'Field Kinematic Viscometer',
          summary: sim.temperature > 65
            ? `Kinematic viscosity degraded to 21 cSt at ${sim.temperature}°C (sheared/overheated).`
            : `Kinematic viscosity nominal at 44 cSt.`,
          detail: 'Confirms whether thermal breakdown is compromising film thickness and internal sealing.'
        };

      case 'oil_spectroscopy': {
        const vibHigh = sim.vibration > machine.baseParams.nominalVibration * 1.4;
        const fe = Math.round(6 + Math.max(0, sim.temperature - 70) * 1.1 + (vibHigh ? 18 : 0) + (machine.id === 'manual_transmission' && sim.syncMismatch > 50 ? 22 : 0));
        return {
          toolId,
          label: 'Wear-Metal Oil Spectrometer',
          summary: `Fe ${fe} ppm · Cu ${Math.round(fe * 0.35)} ppm · Si 6 ppm.`,
          detail: fe > 35 ? 'Elevated wear metals: abnormal rubbing contact or sustained overheating.' : 'Wear-metal levels normal for this service interval.'
        };
      }

      case 'endoscope_camera': {
        const glazed = sim.syncMismatch > 50 && sim.inputDragRpm <= 45;
        const spalled = sim.vibration > machine.baseParams.nominalVibration * 1.45;
        return {
          toolId,
          label: 'Articulated Fibre-Optic Borescope',
          summary: machine.id === 'manual_transmission'
            ? (glazed ? 'Third-gear synchroniser cone is glazed: polished, shiny friction surface.'
              : spalled ? 'Input-shaft bearing race shows pitting and discolouration.'
              : 'Cones, hubs and bearing races show a normal wear pattern.')
            : 'Internal surfaces visible; no abnormal wear pattern.',
          detail: 'Visual access without gearbox teardown.'
        };
      }

      case 'oscilloscope_ignition': {
        const misfires = sim.afr > 15.5 ? Math.round((sim.afr - 15.5) * 6) : 0;
        return {
          toolId,
          label: '4-Channel Lab Oscilloscope',
          summary: `Coil dwell 3.1 ms · spark burn 1.4 ms · ${misfires} misfire events/min.`,
          detail: misfires
            ? 'Misfires appear only when the mixture is lean: the ignition system itself is healthy; look upstream of the spark.'
            : 'Ignition waveform is clean: coil and plug are not the cause.'
        };
      }

      default:
        return {
          toolId,
          label: toolId.replace(/_/g, ' '),
          summary: `Nominal diagnostic check completed at ${sim.loadPct}% load.`,
          detail: 'No anomalies flagged on this channel.'
        };
    }
  }

  global.FF_DIAG = { runDiagnosticTool };
})(typeof window !== 'undefined' ? window : globalThis);
