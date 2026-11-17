// machine-database.js
// Reusable databases for machines, components, operating condition templates, and lore fragments

(function(global) {
  const MACHINE_DATABASE = {
    diesel_generator: {
      id: 'diesel_generator',
      name: 'Compact Petrol Hatchback — Cooling System',
      industry: 'Automotive · Passenger Car',
      unlockRank: 0,
      baseParams: { ratedRpm: 3500, ratedLoad: 70, ambientTemp: 28, nominalPressure: 1.1, nominalFlow: 105, nominalVibration: 1.8 },
      components: {
        cooling_pump: {
          name: 'Engine-Driven Water Pump',
          role: 'Circulates coolant through engine water jackets and radiator core.',
          normalSpec: '90–120 L/min at 3500 RPM',
          dependencies: ['drive_belt', 'thermostat']
        },
        radiator_core: {
          name: 'Aluminium Cross-Flow Radiator',
          role: 'Rejects thermal energy from coolant to ambient air stream.',
          normalSpec: 'ΔT drop of 10–14°C across core at 85% load',
          dependencies: ['cooling_pump', 'cooling_fan']
        },
        thermostat: {
          name: 'Wax-Pellet Engine Thermostat',
          role: 'Regulates coolant bypass during warm-up, opening fully at 82°C.',
          normalSpec: 'Full open at 82–85°C',
          dependencies: ['cooling_pump']
        },
        fuel_injector_bank: {
          name: 'Electronic Fuel Injection Rail & Injectors',
          role: 'Meters petrol into the intake ports for clean combustion.',
          normalSpec: 'Fuel rail pressure 3.5 ± 0.2 bar; balanced cylinder fuelling',
          dependencies: ['fuel_filter', 'intake_manifold']
        },
        turbocharger: {
          name: 'Naturally Aspirated Intake Manifold',
          role: 'Distributes filtered intake air evenly to the engine cylinders.',
          normalSpec: 'Intake vacuum stable at warm idle',
          dependencies: ['air_filter', 'throttle_body']
        },
        avr_governor: {
          name: 'Engine ECU & Electronic Throttle Control',
          role: 'Maintains target idle speed and adjusts fuel injection to engine load.',
          normalSpec: 'Warm idle 800–900 RPM; stable commanded engine speed',
          dependencies: ['fuel_injector_bank']
        }
      },
      tools: ['thermal_camera', 'flow_meter', 'pressure_gauge', 'tachometer_sync', 'exhaust_gas_analyser', 'oscilloscope_ignition', 'smoke_leak_tester']
    },

    hydraulic_press: {
      id: 'hydraulic_press',
      name: '250-Ton Industrial Hydraulic Press',
      industry: 'Manufacturing · Heavy Forming',
      unlockRank: 0,
      baseParams: { ratedRpm: 1450, ratedLoad: 80, ambientTemp: 30, nominalPressure: 210, nominalFlow: 48, nominalVibration: 1.8 },
      components: {
        axial_piston_pump: {
          name: 'Variable-Displacement Axial Piston Pump',
          role: 'Converts motor shaft power into high-pressure hydraulic flow.',
          normalSpec: '46–50 L/min at 210 bar; volumetric efficiency > 92%',
          dependencies: ['suction_strainer', 'hydraulic_fluid']
        },
        proportional_relief_valve: {
          name: 'Proportional Pressure Relief Valve',
          role: 'Limits maximum system pressure and holds static forming pressure.',
          normalSpec: 'Cracks at 215 bar; zero bypass below 205 bar',
          dependencies: ['pilot_stage']
        },
        main_cylinder_seals: {
          name: 'Double-Acting Ram Cylinder & Piston Seals',
          role: 'Converts hydraulic pressure into linear pressing force.',
          normalSpec: 'Internal cross-port bypass < 0.03 L/min at 200 bar',
          dependencies: ['hydraulic_fluid']
        },
        directional_spool_valve: {
          name: '4/3 Closed-Center Directional Valve',
          role: 'Directs oil to extend, hold, or retract the main ram.',
          normalSpec: 'Spool leakage < 0.04 L/min in neutral hold',
          dependencies: ['pilot_stage']
        },
        oil_cooler: {
          name: 'Air-Blast Hydraulic Oil Cooler',
          role: 'Maintains fluid viscosity by keeping reservoir temperature below 55°C.',
          normalSpec: 'Oil temp 42–52°C under continuous cycling',
          dependencies: ['hydraulic_fluid']
        }
      },
      tools: ['pressure_gauge', 'flow_meter', 'ultrasonic_leak_detector', 'thermal_camera', 'oil_viscosity_tester', 'vibration_analyser']
    },

    manual_transmission: {
      id: 'manual_transmission',
      name: '6-Speed Heavy-Duty Manual Gearbox',
      industry: 'Automotive · Drivetrain',
      unlockRank: 0,
      baseParams: { ratedRpm: 3200, ratedLoad: 75, ambientTemp: 25, nominalPressure: 0.4, nominalFlow: 6, nominalVibration: 2.4 },
      components: {
        synchromesh_pack: {
          name: 'Multi-Cone Synchroniser Assembly',
          role: 'Matches gear and shaft rotational speeds prior to dog-clutch engagement.',
          normalSpec: 'Speed mismatch < 45 RPM within 0.25s shift',
          dependencies: ['gear_oil', 'clutch_release']
        },
        input_bearing: {
          name: 'Tapered Roller Input Shaft Bearing',
          role: 'Supports radial and axial thrust loads on the primary shaft.',
          normalSpec: 'Bearing temp < 75°C; vibration < 2.8 mm/s',
          dependencies: ['gear_oil']
        },
        selector_fork_rail: {
          name: 'Bronze-Tipped Selector Fork & Detent Rail',
          role: 'Positions sliding sleeves accurately into gear engagement.',
          normalSpec: 'Full 14.0 mm axial travel; zero detent slip',
          dependencies: ['synchromesh_pack']
        },
        clutch_actuation: {
          name: 'Hydraulic Clutch Slave & Release Bearing',
          role: 'Fully decouples engine torque during gear changes.',
          normalSpec: 'Residual input drag < 15 RPM when depressed',
          dependencies: ['synchromesh_pack']
        },
        oil_pump_lube: {
          name: 'Internal Gerotor Lubrication Pump',
          role: 'Feeds cooled gear oil to upper mainshaft bearings and cones.',
          normalSpec: '0.35–0.50 bar gallery pressure at 3000 RPM',
          dependencies: ['gear_oil']
        }
      },
      tools: ['tachometer_sync', 'vibration_analyser', 'thermal_camera', 'pressure_gauge', 'endoscope_camera', 'oil_spectroscopy']
    },

    petrol_efi_engine: {
      id: 'petrol_efi_engine',
      name: 'High-Output 4-Cylinder EFI Petrol Engine',
      industry: 'Automotive · Motorsport & Performance',
      unlockRank: 1,
      baseParams: { ratedRpm: 4500, ratedLoad: 70, ambientTemp: 26, nominalPressure: 3.5, nominalFlow: 140, nominalVibration: 2.0 },
      components: {
        fuel_injectors: {
          name: 'Sequential Port Fuel Injectors',
          role: 'Delivers metered fuel pulse width matched to intake air mass.',
          normalSpec: 'AFR 14.2–14.7 cruise; 12.8–13.4 high load',
          dependencies: ['fuel_pressure_regulator', 'maf_sensor']
        },
        fuel_pressure_regulator: {
          name: 'Vacuum-Referenced Fuel Pressure Regulator',
          role: 'Maintains constant differential pressure across injector nozzles.',
          normalSpec: '3.5 ± 0.15 bar differential pressure',
          dependencies: ['intake_manifold']
        },
        maf_sensor: {
          name: 'Hot-Wire Mass Air Flow Sensor',
          role: 'Measures incoming air mass for ECU fuel trim calculation.',
          normalSpec: 'Short/long term fuel trims within ±5%',
          dependencies: ['intake_manifold']
        },
        intake_manifold: {
          name: 'Variable-Runner Intake Manifold & Gaskets',
          role: 'Distributes air evenly to cylinders without unmetered vacuum leaks.',
          normalSpec: 'Idle vacuum -0.65 to -0.75 bar; zero leak',
          dependencies: ['maf_sensor']
        },
        ignition_coils: {
          name: 'Coil-on-Plug Ignition Modules',
          role: 'Generates high-voltage spark under high cylinder pressures.',
          normalSpec: '32 kV secondary output; zero misfire count',
          dependencies: ['fuel_injectors']
        }
      },
      tools: ['exhaust_gas_analyser', 'pressure_gauge', 'flow_meter', 'oscilloscope_ignition', 'smoke_leak_tester', 'thermal_camera']
    },

    rotary_screw_compressor: {
      id: 'rotary_screw_compressor',
      name: 'Oil-Flooded Rotary Screw Air Compressor',
      industry: 'Industrial · Pneumatic Plant',
      unlockRank: 2,
      baseParams: { ratedRpm: 2950, ratedLoad: 90, ambientTemp: 32, nominalPressure: 8.5, nominalFlow: 320, nominalVibration: 2.6 },
      components: {
        air_end_rotors: {
          name: 'Helical Male/Female Air-End Rotors',
          role: 'Compresses trapped air pockets while sealed by injected oil.',
          normalSpec: '8.5 bar discharge; volumetric output 310–330 CFM',
          dependencies: ['oil_separator', 'inlet_unloader']
        },
        oil_separator: {
          name: 'Coalescing Air/Oil Separator Element',
          role: 'Recovers lubricating oil from compressed discharge air.',
          normalSpec: 'Differential pressure < 0.25 bar across element',
          dependencies: ['scavenge_line']
        },
        thermostatic_bypass_valve: {
          name: 'Oil Cooler Thermostatic Bypass Valve',
          role: 'Routes oil through cooler once discharge exceeds 75°C.',
          normalSpec: 'Discharge temp 80–92°C under 90% load',
          dependencies: ['air_end_rotors']
        },
        inlet_unloader: {
          name: 'Modulating Intake Unloader Valve',
          role: 'Controls intake volume to match plant air demand.',
          normalSpec: 'Full open under load; clean blowdown unloaded',
          dependencies: ['pressure_transducer']
        },
        minimum_pressure_valve: {
          name: 'Minimum Pressure Check Valve (MPV)',
          role: 'Maintains internal oil circulation pressure during startup and prevents backflow.',
          normalSpec: 'Opens smoothly at 4.2 bar; zero reverse leakage',
          dependencies: ['oil_separator']
        }
      },
      tools: ['pressure_gauge', 'flow_meter', 'thermal_camera', 'vibration_analyser', 'ultrasonic_leak_detector', 'oil_viscosity_tester']
    },

    experimental_cvt_drive: {
      id: 'experimental_cvt_drive',
      name: 'Inventor’s Experimental Automotive Variable Drive (Prototype H-09)',
      industry: 'Automotive · Experimental Drivetrain',
      unlockRank: 3,
      isExperimental: true,
      baseParams: { ratedRpm: 2400, ratedLoad: 85, ambientTemp: 24, nominalPressure: 45, nominalFlow: 28, nominalVibration: 1.5 },
      components: {
        variator_sheaves: {
          name: 'Counter-Weighted Toroidal Variator Sheaves',
          role: 'Continuously alters effective drive ratio in response to torque demand.',
          normalSpec: 'Ratio span 0.65:1 to 2.40:1; slip < 1.5%',
          dependencies: ['clamp_pressure_servo', 'traction_fluid']
        },
        clamp_pressure_servo: {
          name: 'Servo-Controlled Hydraulic Clamping Actuator',
          role: 'Applies normal force proportional to transmitted torque to prevent micro-slip.',
          normalSpec: '42–48 bar clamp pressure; response < 80 ms',
          dependencies: ['traction_fluid']
        },
        harmonic_damper: {
          name: 'Tuned Torsional Harmonic Damper',
          role: 'Cancels resonant shaft oscillations at critical RPM bands.',
          normalSpec: 'Shaft vibration < 1.8 mm/s across 1500–3000 RPM',
          dependencies: ['variator_sheaves']
        },
        traction_fluid_circuit: {
          name: 'Elastohydrodynamic Traction Fluid Loop',
          role: 'Transmits shear force under high contact pressure while removing friction heat.',
          normalSpec: 'Fluid temp 55–68°C; shear viscosity index > 95%',
          dependencies: ['clamp_pressure_servo']
        }
      },
      tools: ['tachometer_sync', 'pressure_gauge', 'vibration_analyser', 'thermal_camera', 'flow_meter', 'oil_viscosity_tester']
    }
  };

  const TOOL_CATALOG = {
    thermal_camera: { id: 'thermal_camera', name: 'Infrared Thermal Imager', category: 'Thermal', unlockRank: 0, cost: 1 },
    flow_meter: { id: 'flow_meter', name: 'Inline Ultrasonic Flow Meter', category: 'Fluid', unlockRank: 0, cost: 1 },
    pressure_gauge: { id: 'pressure_gauge', name: 'Digital Differential Pressure Gauge', category: 'Pressure', unlockRank: 0, cost: 1 },
    vibration_analyser: { id: 'vibration_analyser', name: 'Tri-Axial FFT Vibration Analyser', category: 'Mechanical', unlockRank: 0, cost: 1 },
    exhaust_gas_analyser: { id: 'exhaust_gas_analyser', name: '5-Gas Wideband Exhaust Analyser', category: 'Combustion', unlockRank: 0, cost: 1 },
    tachometer_sync: { id: 'tachometer_sync', name: 'Dual-Channel Optical Tachometer', category: 'Kinematic', unlockRank: 0, cost: 1 },
    ultrasonic_leak_detector: { id: 'ultrasonic_leak_detector', name: 'Acoustic Ultrasonic Leak Probe', category: 'Acoustic', unlockRank: 1, cost: 2 },
    smoke_leak_tester: { id: 'smoke_leak_tester', name: 'Pressurised Intake Smoke Generator', category: 'Pneumatic', unlockRank: 1, cost: 1 },
    oil_viscosity_tester: { id: 'oil_viscosity_tester', name: 'Field Kinematic Viscometer', category: 'Tribology', unlockRank: 2, cost: 2 },
    oscilloscope_ignition: { id: 'oscilloscope_ignition', name: '4-Channel Lab Oscilloscope', category: 'Electrical', unlockRank: 2, cost: 2 },
    endoscope_camera: { id: 'endoscope_camera', name: 'Articulated Fibre-Optic Borescope', category: 'Visual', unlockRank: 2, cost: 2 },
    oil_spectroscopy: { id: 'oil_spectroscopy', name: 'Wear-Metal Oil Spectrometer', category: 'Tribology', unlockRank: 3, cost: 2 }
  };

  const ARCHIVE_LORE_POOL = [
    {
      title: 'Archive Fragment E-01 // Handwritten Margin Note',
      text: '“They keep replacing the parts that fail last. A seized bearing is an obituary, not a diagnosis. Look upstream at what starved it of film thickness.”'
    },
    {
      title: 'Archive Fragment E-02 // Blueprint Scrap (Dated 14 Nov)',
      text: '“Test rig 4 ran 19 hours before the harmonic oscillation tore the keyway. Standard handbooks assume steady load; real machines live in transients.”'
    },
    {
      title: 'Archive Fragment E-03 // Telemetry Tape Transcript',
      text: '“The customer swore the unit was serviced Tuesday. The filter date stamp was from three winters ago. Trust instruments first, paper second.”'
    },
    {
      title: 'Archive Fragment E-04 // Prototype H-09 Schematic Note',
      text: '“If clamping force tracks torque mechanically without electronic lag, slip vanishes—provided the fluid shear curve does not collapse above 72°C.”'
    },
    {
      title: 'Archive Fragment E-05 // Final Laboratory Ledger',
      text: '“Whoever finds these files: do not memorise symptoms. Two completely different faults can produce the exact same temperature rise. Isolate variables.”'
    }
  ];

  global.FF_DB = { MACHINE_DATABASE, TOOL_CATALOG, ARCHIVE_LORE_POOL };
})(typeof window !== 'undefined' ? window : globalThis);
