
/*
 * The Failure Files
 * Automotive Vehicle Database
 *
 * Defines vehicle platforms and their connected systems.
 * Vehicle specifications and connected systems are linked to the automotive case platform.
 */

(function (global) {
  const VEHICLE_DATABASE = {

    compact_hatchback_01: {
      id: "compact_hatchback_01",
      name: "Compact Petrol Hatchback",
      category: "Passenger Car",
      unlockRank: 0,

      configuration: {
        engine: "Naturally Aspirated Inline-4 Petrol",
        displacementCC: 1197,
        cylinders: 4,
        aspiration: "Naturally Aspirated",
        fuelSystem: "Electronic Fuel Injection",
        transmission: "5-Speed Manual",
        drivetrain: "Front-Wheel Drive",
        cooling: "Liquid Cooled",
        steering: "Electric Power Steering"
      },

      specifications: {
        ratedPowerKW: 61,
        ratedTorqueNm: 113,
        idleRPM: 850,
        redlineRPM: 6500,
        normalOperatingTemp: 92,
        fuelPressureBar: 3.5,
        coolantPressureBar: 1.1
      },

      systems: {

        engine: {
          name: "Engine and Combustion",
          components: [
            "engine_block",
            "cylinder_head",
            "pistons",
            "connecting_rods",
            "crankshaft",
            "camshaft",
            "valves",
            "timing_chain",
            "spark_plugs",
            "ignition_coils",
            "fuel_injectors",
            "fuel_rail",
            "throttle_body",
            "intake_manifold",
            "air_filter"
          ]
        },

        exhaust: {
          name: "Exhaust and Emissions",
          components: [
            "exhaust_manifold",
            "oxygen_sensor",
            "catalytic_converter",
            "muffler",
            "exhaust_pipe"
          ]
        },

        cooling: {
          name: "Cooling System",
          components: [
            "radiator",
            "water_pump",
            "thermostat",
            "cooling_fan",
            "coolant_hoses",
            "coolant_reservoir"
          ]
        },

        lubrication: {
          name: "Engine Lubrication",
          components: [
            "oil_pump",
            "oil_filter",
            "oil_sump",
            "oil_galleries"
          ]
        },

        transmission: {
          name: "Transmission and Drivetrain",
          components: [
            "clutch",
            "flywheel",
            "input_shaft",
            "gear_set",
            "synchronisers",
            "selector_fork",
            "differential",
            "driveshafts",
            "cv_joints"
          ]
        },

        braking: {
          name: "Braking System",
          components: [
            "brake_pedal",
            "brake_booster",
            "master_cylinder",
            "brake_fluid",
            "front_disc_rotors",
            "front_brake_pads",
            "rear_brake_drums",
            "abs_sensors"
          ]
        },

        suspension: {
          name: "Suspension and Steering",
          components: [
            "front_springs",
            "front_dampers",
            "control_arms",
            "ball_joints",
            "bushings",
            "steering_rack",
            "tie_rods",
            "wheel_bearings"
          ]
        },

        wheels: {
          name: "Wheels and Tyres",
          components: [
            "front_left_tyre",
            "front_right_tyre",
            "rear_left_tyre",
            "rear_right_tyre",
            "wheel_rims",
            "wheel_balance"
          ]
        },

        electrical: {
          name: "Electrical and Electronics",
          components: [
            "battery",
            "alternator",
            "starter_motor",
            "engine_ecu",
            "crankshaft_sensor",
            "camshaft_sensor",
            "coolant_temperature_sensor",
            "maf_sensor",
            "wiring_harness",
            "fuses",
            "relays"
          ]
        }

      }
    }

  };

  function getVehicle(vehicleId) {
    return VEHICLE_DATABASE[vehicleId] || null;
  }

  function getVehicleSystems(vehicleId) {
    const vehicle = getVehicle(vehicleId);
    return vehicle ? vehicle.systems : null;
  }

  function getVehicleComponents(vehicleId) {
    const vehicle = getVehicle(vehicleId);

    if (!vehicle) return [];

    return Object.values(vehicle.systems)
      .flatMap(system => system.components);
  }

  function validateVehicleDatabase() {
    const errors = [];

    for (const vehicle of Object.values(VEHICLE_DATABASE)) {

      if (!vehicle.id || !vehicle.name) {
        errors.push("Vehicle is missing its ID or name.");
      }

      if (!vehicle.configuration) {
        errors.push(vehicle.id + ": Missing configuration.");
      }

      if (!vehicle.systems || !Object.keys(vehicle.systems).length) {
        errors.push(vehicle.id + ": No vehicle systems defined.");
      }

      for (const [systemId, system] of Object.entries(vehicle.systems || {})) {
        if (!Array.isArray(system.components) ||
            system.components.length === 0) {
          errors.push(vehicle.id + ": Invalid system " + systemId);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  global.FF_AUTO = {
    VEHICLE_DATABASE,
    getVehicle,
    getVehicleSystems,
    getVehicleComponents,
    validateVehicleDatabase
  };

})(typeof window !== "undefined" ? window : globalThis);
