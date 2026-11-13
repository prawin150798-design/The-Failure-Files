// fault-engine.js
// Defines fault archetypes, physical interactions, misleading clues, and repair mappings

(function(global) {
  const FAULT_CATALOG = [
    // --- DIESEL GENERATOR FAULTS ---
    {
      id: 'gen_pump_slip',
      machineId: 'diesel_generator',
      primaryComponent: 'cooling_pump',
      faultType: 'Internal Wear / Impeller Slip',
      title: 'Sheared Impeller Key / Eroded Vanes',
      conditionDependent: 'high_load',
      symptoms: [
        'Coolant temperature climbs steadily above 70% load',
        'Idle temperature remains normal for 15+ minutes',
        'Radiator core shows uniform temperature with low ΔT drop'
      ],
      misleadingClues: [
        {
          source: 'Customer Report',
          text: '“We flushed the radiator and put a brand-new thermostat in yesterday, so the cooling loop is definitely fine.”',
          explanation: 'Replacing the thermostat does not restore circulation when the pump impeller slips on its shaft under thermal load.'
        },
        {
          source: 'Maintenance Log',
          text: 'Drive belt tension checked and passed at 420 N.',
          explanation: 'The pump pulley spins at full RPM externally, masking internal impeller slippage.'
        }
      ],
      secondaryEffects: { flowFactor: 0.42, tempRiseFactor: 1.55, pressureFactor: 0.95, vibFactor: 1.15 },
      repairs: [
        { id: 'rep_pump_impeller', label: 'Rebuild coolant pump & fit keyed impeller', fixes: ['gen_pump_slip'], cost: 320, time: 2 },
        { id: 'rep_thermostat', label: 'Replace thermostat assembly', fixes: [], cost: 95, time: 1 },
        { id: 'rep_radiator_flush', label: 'Chemical flush radiator core', fixes: [], cost: 140, time: 1.5 },
        { id: 'rep_fan_clutch', label: 'Lock cooling fan viscous hub', fixes: [], cost: 210, time: 1 }
      ],
      concept: 'Heat transfer rate Q = ṁ · c_p · ΔT. Low mass flow rate (ṁ) forces engine ΔT to spike even when the radiator is clean.'
    },
    {
      id: 'gen_radiator_fouling',
      machineId: 'diesel_generator',
      primaryComponent: 'radiator_core',
      faultType: 'Partial Internal Blockage',
      title: 'Silicate Scale Fouling in Radiator Tubes',
      conditionDependent: 'sustained_run',
      symptoms: [
        'Overheating after 10–15 minutes under sustained high load',
        'High coolant pressure on pump discharge side',
        'Pronounced cold spots across lower third of radiator core'
      ],
      misleadingClues: [
        {
          source: 'Technician Observation',
          text: 'Exterior radiator fins are spotless and airflow through the grille feels strong.',
          explanation: 'Internal mineral scale insulates and restricts coolant tubes from the inside without affecting exterior fin cleanliness.'
        }
      ],
      secondaryEffects: { flowFactor: 0.68, tempRiseFactor: 1.48, pressureFactor: 1.28, vibFactor: 1.02 },
      repairs: [
        { id: 'rep_radiator_rod', label: 'Rod & chemically descale radiator core', fixes: ['gen_radiator_fouling'], cost: 280, time: 2.5 },
        { id: 'rep_pump_impeller', label: 'Replace water pump assembly', fixes: [], cost: 320, time: 2 },
        { id: 'rep_thermostat', label: 'Remove thermostat for full flow', fixes: [], cost: 60, time: 0.5 }
      ],
      concept: 'Internal tube fouling reduces both convective heat transfer coefficient and cross-sectional flow area, elevating pump discharge pressure while lowering core ΔT.'
    },
    {
      id: 'gen_injector_overfuel',
      machineId: 'diesel_generator',
      primaryComponent: 'fuel_injector_bank',
      faultType: 'Incorrect Adjustment / Nozzle Wear',
      title: 'Leaking Injector Nozzle Causing Thermal Overload',
      conditionDependent: 'high_load',
      symptoms: [
        'Engine overheats under heavy load despite healthy coolant flow',
        'Dark exhaust haze and elevated exhaust gas temperature (EGT)',
        'Slight low-frequency vibration increase under load'
      ],
      misleadingClues: [
        {
          source: 'Operator Report',
          text: '“It’s definitely a cooling system failure—the temperature gauge hits the red zone every afternoon.”',
          explanation: 'Overheating is a thermal balance problem: after-burning from poor atomisation dumps excessive combustion heat into the water jacket, overwhelming a healthy cooling system.'
        }
      ],
      secondaryEffects: { flowFactor: 0.98, tempRiseFactor: 1.52, pressureFactor: 1.05, vibFactor: 1.42, egtBoost: 145 },
      repairs: [
        { id: 'rep_injectors', label: 'Calibrate & replace worn injector nozzles', fixes: ['gen_injector_overfuel'], cost: 450, time: 3 },
        { id: 'rep_radiator_rod', label: 'Flush & descale radiator', fixes: [], cost: 280, time: 2.5 },
        { id: 'rep_pump_impeller', label: 'Upgrade water pump impeller', fixes: [], cost: 320, time: 2 }
      ],
      concept: 'Not all overheating originates in the cooling system. Late combustion / over-fuelling increases heat rejection into cylinder walls beyond rated cooling capacity.'
    },
    {
      id: 'gen_turbo_boost_leak',
      machineId: 'diesel_generator',
      primaryComponent: 'turbocharger',
      faultType: 'Internal Leakage / Wastegate Creep',
      title: 'Stuck-Open Turbocharger Wastegate Actuator',
      conditionDependent: 'high_load',
      symptoms: [
        'RPM droops under heavy electrical load (>75%)',
        'High exhaust smoke and rising coolant temperature under load',
        'Unloaded idle speed and voltage appear completely normal'
      ],
      misleadingClues: [
        {
          source: 'Maintenance Record',
          text: 'Electronic governor recalibrated last month; fuel filter replaced 50 hours ago.',
          explanation: 'The governor adds more fuel to hold 1500 RPM, but without sufficient boost air mass, combustion turns rich and hot while losing peak torque.'
        }
      ],
      secondaryEffects: { flowFactor: 0.96, tempRiseFactor: 1.38, pressureFactor: 1.02, rpmDroop: 65, boostFactor: 0.58 },
      repairs: [
        { id: 'rep_wastegate', label: 'Repair wastegate linkage & set boost calibration', fixes: ['gen_turbo_boost_leak'], cost: 260, time: 1.5 },
        { id: 'rep_governor', label: 'Replace electronic speed governor', fixes: [], cost: 520, time: 2 },
        { id: 'rep_injectors', label: 'Replace fuel injector set', fixes: [], cost: 450, time: 3 }
      ],
      concept: 'Turbocharged diesels require air mass proportional to fuel delivery. Low boost starves combustion of oxygen, causing rich EGT spikes and torque droop.'
    },

    // --- HYDRAULIC PRESS FAULTS ---
    {
      id: 'hyd_relief_chatter',
      machineId: 'hydraulic_press',
      primaryComponent: 'proportional_relief_valve',
      faultType: 'Internal Leakage / Seat Erosion',
      title: 'Scored Proportional Relief Valve Pilot Seat',
      conditionDependent: 'high_pressure',
      symptoms: [
        'Ram approaches target pressure slowly, then bleeds down during hold phase',
        'Localized high temperature at relief valve return line to tank',
        'Zero external oil drips on floor or cylinder gland'
      ],
      misleadingClues: [
        {
          source: 'Operator Statement',
          text: '“The main cylinder seals must be blown—the ram creeps upward whenever we hold a 200-ton squeeze.”',
          explanation: 'Internal bypass across the relief valve dumps pressurised oil straight to the tank, mimicking cylinder seal bypass.'
        }
      ],
      secondaryEffects: { pressureFactor: 0.76, decayRate: 14.5, tempRiseFactor: 1.35, flowLoss: 11.5 },
      repairs: [
        { id: 'rep_relief_valve', label: 'Replace & calibrate proportional relief cartridge', fixes: ['hyd_relief_chatter'], cost: 340, time: 1.5 },
        { id: 'rep_cylinder_seals', label: 'Strip main ram & replace piston seals', fixes: [], cost: 780, time: 5 },
        { id: 'rep_main_pump', label: 'Overhaul axial piston pump', fixes: [], cost: 920, time: 4 }
      ],
      concept: 'Pressure drop across a partially open relief valve converts hydraulic power (P × Q) directly into localised heat in the tank return line.'
    },
    {
      id: 'hyd_piston_seal_bypass',
      machineId: 'hydraulic_press',
      primaryComponent: 'main_cylinder_seals',
      faultType: 'Component Wear',
      title: 'Extruded PTFE Piston Ring in Main Press Cylinder',
      conditionDependent: 'high_pressure',
      symptoms: [
        'Holding pressure decays rapidly under load',
        'Warm oil flow detected in cylinder rod-end return line during deadhead hold',
        'Relief valve return line remains cool and silent'
      ],
      misleadingClues: [
        {
          source: 'Previous Work Order',
          text: 'Directional control valve replaced 3 weeks ago after pressure complaints.',
          explanation: 'Replacing the directional valve could not stop internal cross-port leakage past the worn piston seal inside the barrel.'
        }
      ],
      secondaryEffects: { pressureFactor: 0.79, decayRate: 16.0, tempRiseFactor: 1.25, cylinderBypass: 10.8 },
      repairs: [
        { id: 'rep_cylinder_seals', label: 'Hone barrel & install heavy-duty piston seals', fixes: ['hyd_piston_seal_bypass'], cost: 780, time: 5 },
        { id: 'rep_relief_valve', label: 'Replace proportional relief valve', fixes: [], cost: 340, time: 1.5 },
        { id: 'rep_dir_valve', label: 'Replace 4/3 directional spool valve', fixes: [], cost: 490, time: 2 }
      ],
      concept: 'Isolating internal hydraulic bypass requires comparing return flow from the relief valve versus the cylinder annulus line under static hold.'
    },
    {
      id: 'hyd_oil_viscosity_breakdown',
      machineId: 'hydraulic_press',
      primaryComponent: 'oil_cooler',
      faultType: 'Temperature / Viscosity Degradation',
      title: 'Clogged Oil Cooler Core Causing Hot-Run Slip',
      conditionDependent: 'hot_run',
      symptoms: [
        'Press achieves full 210 bar when cold at start of shift',
        'After 25 minutes of cycling, pressure drops and cycle time slows',
        'Reservoir fluid temperature exceeds 68°C'
      ],
      misleadingClues: [
        {
          source: 'Operator Report',
          text: '“The pump is wearing out—it works fine at 7 AM and loses power by coffee break.”',
          explanation: 'Thermal thinning of ISO 46 hydraulic oil above 65°C increases internal clearances leakage across every valve and pump slipper.'
        }
      ],
      secondaryEffects: { pressureFactor: 0.82, decayRate: 9.5, tempRiseFactor: 1.65, viscosityFactor: 0.54 },
      repairs: [
        { id: 'rep_cooler_service', label: 'Clean oil cooler core & flush degraded fluid', fixes: ['hyd_oil_viscosity_breakdown'], cost: 310, time: 2 },
        { id: 'rep_main_pump', label: 'Replace axial piston pump', fixes: [], cost: 920, time: 4 },
        { id: 'rep_relief_valve', label: 'Increase relief valve preload', fixes: [], cost: 120, time: 1 }
      ],
      concept: 'Internal laminar leakage in hydraulic clearances scales inversely with fluid viscosity (Q_leak ∝ 1/μ). Overheated oil loses viscosity and pressure.'
    },

    // --- MANUAL TRANSMISSION FAULTS ---
    {
      id: 'tx_synchro_glaze',
      machineId: 'manual_transmission',
      primaryComponent: 'synchromesh_pack',
      faultType: 'Component Wear',
      title: 'Glazed Molybdenum Synchroniser Friction Cone (3rd/4th)',
      conditionDependent: 'fast_shift',
      symptoms: [
        'Clean crunch/grind on rapid upshifts into 3rd gear',
        'Double-declutching eliminates the grind completely',
        'Clutch releases cleanly with zero drag'
      ],
      misleadingClues: [
        {
          source: 'Driver Statement',
          text: '“The clutch master cylinder is failing—it won’t go into third when I’m overtaking.”',
          explanation: 'If the clutch were dragging, 1st and Reverse would baulk at standstill. Grinding isolated to a single gear during fast shifts points to that gear’s synchroniser.'
        }
      ],
      secondaryEffects: { syncMismatch: 245, vibFactor: 1.15, tempRiseFactor: 1.08 },
      repairs: [
        { id: 'rep_synchro_pack', label: 'Replace 3rd/4th synchroniser rings & hub sleeve', fixes: ['tx_synchro_glaze'], cost: 480, time: 4 },
        { id: 'rep_clutch_slave', label: 'Bleed & replace clutch slave cylinder', fixes: [], cost: 190, time: 1.5 },
        { id: 'rep_selector_fork', label: 'Replace 3rd/4th selector fork', fixes: [], cost: 290, time: 3 }
      ],
      concept: 'Synchroniser cones rely on boundary friction to shear the oil film and equalise shaft speeds within ~0.25s. Glazed cones fail to arrest speed differential.'
    },
    {
      id: 'tx_clutch_drag',
      machineId: 'manual_transmission',
      primaryComponent: 'clutch_actuation',
      faultType: 'Incorrect Adjustment / Hydraulic Air',
      title: 'Incomplete Clutch Release Causing Input Shaft Drag',
      conditionDependent: 'always',
      symptoms: [
        'Grinding across multiple gears, worst in 1st, Reverse, and rapid 2–3 shifts',
        'Optical tachometer shows input shaft spinning at 180+ RPM with clutch depressed',
        'Synchroniser friction surfaces show minimal wear'
      ],
      misleadingClues: [
        {
          source: 'Previous Workshop Note',
          text: 'Filled with thicker 85W-140 gear oil to quieten shift noise.',
          explanation: 'Higher-viscosity oil increases viscous drag on the input shaft, worsening the incomplete clutch release.'
        }
      ],
      secondaryEffects: { syncMismatch: 210, inputDragRpm: 195, vibFactor: 1.10 },
      repairs: [
        { id: 'rep_clutch_slave', label: 'Overhaul clutch release actuator & set pushrod travel', fixes: ['tx_clutch_drag'], cost: 190, time: 1.5 },
        { id: 'rep_synchro_pack', label: 'Replace all synchroniser rings', fixes: [], cost: 640, time: 5 },
        { id: 'rep_gear_oil', label: 'Drain and refill synthetic 75W-90 oil', fixes: [], cost: 95, time: 0.5 }
      ],
      concept: 'A synchroniser is sized to absorb only the inertia of the free-spinning clutch disc and input shaft—not continuous engine drag torque.'
    },
    {
      id: 'tx_input_bearing_spall',
      machineId: 'manual_transmission',
      primaryComponent: 'input_bearing',
      faultType: 'Excessive Friction / Bearing Spalling',
      title: 'Spalled Input Shaft Tapered Roller Bearing',
      conditionDependent: 'high_rpm',
      symptoms: [
        'High-frequency whine that scales with engine RPM in neutral (clutch engaged)',
        'Noise disappears completely when clutch pedal is depressed',
        'Elevated housing temperature near bellhousing nose'
      ],
      misleadingClues: [
        {
          source: 'Driver Statement',
          text: '“The release bearing is noisy—it whines whenever the engine is idling in traffic.”',
          explanation: 'A release bearing makes noise when loaded (pedal pressed). Noise in neutral with pedal released that stops when pressed is the gearbox input shaft bearing.'
        }
      ],
      secondaryEffects: { syncMismatch: 35, vibFactor: 2.35, tempRiseFactor: 1.42 },
      repairs: [
        { id: 'rep_input_bearing', label: 'Replace input shaft bearing & set preload shim', fixes: ['tx_input_bearing_spall'], cost: 360, time: 3.5 },
        { id: 'rep_clutch_slave', label: 'Replace clutch release bearing', fixes: [], cost: 210, time: 2 },
        { id: 'rep_synchro_pack', label: 'Replace 3rd-gear synchroniser', fixes: [], cost: 480, time: 4 }
      ],
      concept: 'Depressing the clutch in neutral decouples the transmission input shaft from the engine, cleanly separating input-shaft faults from engine/release-bearing faults.'
    },

    // --- PETROL EFI ENGINE FAULTS ---
    {
      id: 'efi_vacuum_leak',
      machineId: 'petrol_efi_engine',
      primaryComponent: 'intake_manifold',
      faultType: 'Leakage / Unmetered Air',
      title: 'Split Intake Plenum Gasket (Unmetered Air Leak)',
      conditionDependent: 'idle_low_load',
      symptoms: [
        'High, hunting idle speed (1,350+ RPM) and lean AFR at idle',
        'Long-term fuel trim pegged at +22% at idle, returning near 0% at wide-open throttle',
        'Fuel rail pressure is completely within specification'
      ],
      misleadingClues: [
        {
          source: 'Previous Mechanic Note',
          text: 'Replaced fuel pump and filter due to lean P0171 fault code.',
          explanation: 'A weak fuel pump causes leanness under high load/RPM when demand peaks; an intake vacuum leak causes leanness at idle when manifold vacuum is highest.'
        }
      ],
      secondaryEffects: { afrOffset: 2.6, idleOffset: 420, pressureFactor: 1.0, vibFactor: 1.35 },
      repairs: [
        { id: 'rep_intake_gasket', label: 'Replace intake manifold gaskets & vacuum hoses', fixes: ['efi_vacuum_leak'], cost: 180, time: 1.5 },
        { id: 'rep_fuel_pump_efi', label: 'Replace high-flow fuel pump & regulator', fixes: [], cost: 340, time: 2 },
        { id: 'rep_maf_sensor', label: 'Replace hot-wire MAF sensor', fixes: [], cost: 260, time: 0.5 }
      ],
      concept: 'Unmetered air entering downstream of the MAF sensor skews AFR leanest at idle (high manifold vacuum, low total airflow) and barely affects wide-open throttle.'
    },
    {
      id: 'efi_fuel_regulator_drop',
      machineId: 'petrol_efi_engine',
      primaryComponent: 'fuel_pressure_regulator',
      faultType: 'Reduced Efficiency / Spring Fatigue',
      title: 'Ruptured Fuel Pressure Regulator Diaphragm',
      conditionDependent: 'high_load',
      symptoms: [
        'Engine idles acceptably but stumbles and goes dangerously lean above 4000 RPM',
        'Fuel rail pressure drops from 3.5 bar to 2.1 bar under load',
        'Smoke test confirms intake manifold is completely sealed'
      ],
      misleadingClues: [
        {
          source: 'Owner Statement',
          text: '“I cleaned the MAF sensor and fitted new spark plugs, so ignition and air measurement are sorted.”',
          explanation: 'Injector flow scales with √ΔP; a 40% drop in rail pressure cuts fuel delivery by ~23% at peak demand.'
        }
      ],
      secondaryEffects: { afrOffset: 2.9, idleOffset: -140, pressureFactor: 0.61, vibFactor: 1.40 },
      repairs: [
        { id: 'rep_fpr', label: 'Replace fuel pressure regulator & verify rail pressure', fixes: ['efi_fuel_regulator_drop'], cost: 165, time: 1 },
        { id: 'rep_intake_gasket', label: 'Reseal intake manifold', fixes: [], cost: 180, time: 1.5 },
        { id: 'rep_ignition_coils', label: 'Replace coil-on-plug set', fixes: [], cost: 310, time: 1 }
      ],
      concept: 'Volumetric flow through a fixed injector orifice obeys Q ∝ √(P_rail − P_manifold). Insufficient rail pressure starves the engine at high RPM.'
    },

    // --- ROTARY SCREW COMPRESSOR FAULTS ---
    {
      id: 'comp_separator_clog',
      machineId: 'rotary_screw_compressor',
      primaryComponent: 'oil_separator',
      faultType: 'Partial Blockage',
      title: 'Saturated Air/Oil Separator Element',
      conditionDependent: 'high_load',
      symptoms: [
        'Internal sump pressure reads 10.2 bar while plant discharge is only 8.1 bar',
        'High motor amperage draw and elevated discharge temperature',
        'Oil carryover visible in downstream pneumatic filter bowl'
      ],
      misleadingClues: [
        {
          source: 'Plant Operator',
          text: '“The pressure transducer must be drifting—the controller shows 10.2 bar even though our shop line is low.”',
          explanation: 'Both gauges are accurate: a 2.1 bar pressure drop across a clogged separator element forces the air-end to over-compress against internal restriction.'
        }
      ],
      secondaryEffects: { pressureFactor: 0.94, internalDeltaP: 2.1, tempRiseFactor: 1.38, vibFactor: 1.22 },
      repairs: [
        { id: 'rep_separator', label: 'Replace coalescing separator element & scavenge orifice', fixes: ['comp_separator_clog'], cost: 290, time: 1.5 },
        { id: 'rep_unloader', label: 'Rebuild intake unloader valve', fixes: [], cost: 350, time: 2 },
        { id: 'rep_thermal_valve', label: 'Replace oil thermostatic bypass valve', fixes: [], cost: 195, time: 1 }
      ],
      concept: 'Every 1 bar of differential pressure across a clogged separator adds ~7% shaft power draw and drives discharge temperature upward.'
    },

    // --- EXPERIMENTAL PROTOTYPE H-09 FAULT ---
    {
      id: 'exp_clamp_servo_lag',
      machineId: 'experimental_cvt_drive',
      primaryComponent: 'clamp_pressure_servo',
      faultType: 'Incorrect Specification / Hydraulic Lag',
      title: 'Undersized Orifice in Clamping Servo Feed',
      conditionDependent: 'high_load',
      symptoms: [
        'At light load, toroidal variator tracks ratio smoothly with <1% slip',
        'Above 70% torque load, clamp pressure lags behind torque spikes causing micro-slip',
        'Traction fluid temperature spikes rapidly during slip events'
      ],
      misleadingClues: [
        {
          source: 'Inventor’s Margin Note',
          text: '“Suspected traction fluid shear breakdown at 60°C—consider reformulating additive package.”',
          explanation: 'The fluid overheats *because* of micro-slip; the root cause is insufficient clamping normal force (F_n = F_t / μ) under high torque.'
        }
      ],
      secondaryEffects: { pressureFactor: 0.64, slipPct: 8.4, tempRiseFactor: 1.58, vibFactor: 1.95 },
      repairs: [
        { id: 'rep_servo_orifice', label: 'Re-machine servo feed gallery & calibrate 46 bar clamp curve', fixes: ['exp_clamp_servo_lag'], cost: 420, time: 2.5 },
        { id: 'rep_traction_fluid', label: 'Flush & fill experimental traction fluid', fixes: [], cost: 280, time: 1 },
        { id: 'rep_harmonic_damper', label: 'Retune torsional harmonic damper', fixes: [], cost: 360, time: 2 }
      ],
      concept: 'Traction drives transmit torque via elastohydrodynamic shear. Clamping pressure must scale proportionally with torque to prevent gross slip and flash heating.'
    }
  ];

  // Compound / interacting fault pairings for Investigator & Master Engineer tiers
  const COMPOUND_INTERACTIONS = [
    {
      id: 'compound_gen_scale_and_thermostat',
      machineId: 'diesel_generator',
      primaryFaultId: 'gen_radiator_fouling',
      secondaryComponent: 'thermostat',
      secondaryTitle: 'Partially Sticking Thermostat (72% Lift)',
      extraEffects: { flowFactor: 0.85, tempRiseFactor: 1.18 },
      extraRepair: { id: 'rep_thermostat', label: 'Replace partially sticking thermostat', fixesSecondary: true, cost: 95, time: 1 },
      interactionNote: 'Fixing only the radiator leaves a 15% flow restriction at peak ambient heat; fixing only the thermostat leaves the fouled core unable to reject rated load.'
    },
    {
      id: 'compound_hyd_relief_and_cooler',
      machineId: 'hydraulic_press',
      primaryFaultId: 'hyd_relief_chatter',
      secondaryComponent: 'oil_cooler',
      secondaryTitle: 'Fouled Oil Cooler Fins from Continuous Relief Bypass Heat',
      extraEffects: { tempRiseFactor: 1.25, pressureFactor: 0.94 },
      extraRepair: { id: 'rep_cooler_service', label: 'Clean oil cooler core & refresh heat-stressed oil', fixesSecondary: true, cost: 310, time: 2 },
      interactionNote: 'Prolonged bypass through the scored relief valve cooked the hydraulic oil and fouled the cooler; both the valve and cooling capacity must be restored.'
    },
    {
      id: 'compound_tx_synchro_and_clutch',
      machineId: 'manual_transmission',
      primaryFaultId: 'tx_synchro_glaze',
      secondaryComponent: 'clutch_actuation',
      secondaryTitle: 'Slight Clutch Release Misadjustment (65 RPM Drag)',
      extraEffects: { syncMismatch: 85, inputDragRpm: 65 },
      extraRepair: { id: 'rep_clutch_slave', label: 'Adjust clutch release pushrod clearance', fixesSecondary: true, cost: 190, time: 1.5 },
      interactionNote: 'Residual clutch drag accelerated wear on the 3rd-gear synchroniser cone; replacing the cone without correcting clutch release leaves marginal shift timing.'
    }
  ];

  global.FF_FAULTS = { FAULT_CATALOG, COMPOUND_INTERACTIONS };
})(typeof window !== 'undefined' ? window : globalThis);
