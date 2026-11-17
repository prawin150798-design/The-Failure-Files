// plain-language.js
// Friendly layer: "Simple words" translation, customer stories, tool explanations, verdicts, trust meter and hints.
(function(global) {
  const GLOSSARY = [
    ['synchroniser', 'gear-matching ring'], ['selector fork', 'gear-shifting fork'], ['detent', 'gear-holding spring'],
    ['impeller', 'pump blades'], ['relief valve', 'safety pressure valve'], ['directional (?:control )?valve', 'oil-direction valve'],
    ['bypass', 'leak-through'], ['air-fuel ratio', 'fuel-to-air mix'], ['AFR', 'fuel-to-air mix'], ['stoichiometr\\w*', 'ideal fuel mix'],
    ['torque', 'twisting force'], ['viscosity', 'oil thickness'], ['borescope', 'tiny inspection camera'], ['oscilloscope', 'signal viewer'],
    ['spectrometer', 'metal-dust oil tester'], ['coalescing separator', 'oil-filter element'], ['governor', 'speed controller'],
    ['turbocharger', 'air booster'], ['wastegate', 'boost release valve'], ['cavitation', 'bubble damage'], ['harmonic', 'vibration pattern'],
    ['piston seals?', 'piston rubber seals'], ['bearing race', 'bearing track'], ['spall\\w*', 'chipped surface']
  ].map(([t, p]) => [new RegExp('\\b(' + t + ')(?![\\w-])', 'i'), p]);
  const DELTA = [/ΔT/, 'temperature difference'];

  function simplify(text) {
    let out = text;
    for (const [re, plain] of GLOSSARY) {
      out = out.replace(re, m => (m[0] === m[0].toUpperCase() && m[0] !== m[0].toLowerCase() && m.length > 3 ? plain[0].toUpperCase() + plain.slice(1) : plain) + ' (' + m + ')');
    }
    return out.replace(DELTA[0], DELTA[1]);
  }

  const TOOL_HELP = {
    thermal_camera: 'Shows how hot things are', flow_meter: 'Measures how much liquid is moving', pressure_gauge: 'Checks how hard the fluid pushes',
    vibration_analyser: 'Feels for shaking and rattles', exhaust_gas_analyser: 'Sniffs the exhaust to judge the fuel mix',
    tachometer_sync: 'Compares how fast shafts spin', ultrasonic_leak_detector: 'Listens for hidden leaks', smoke_leak_tester: 'Puffs smoke to reveal air leaks',
    oil_viscosity_tester: 'Checks the oil is still thick enough', oil_spectroscopy: 'Finds metal dust in the oil',
    endoscope_camera: 'A tiny camera to peek inside', oscilloscope_ignition: 'Watches the spark signal'
  };

  const STORIES = {
    diesel_generator: [['The night manager at St. Aldric Hospital', 'our backup generator keeps overheating when the wards need it most', 'a power cut tonight would be dangerous'], ['A festival organiser', 'the stage generator shuts itself off an hour into every show', 'the headline act goes on at nine']],
    hydraulic_press: [['Marta, who runs a small metal-stamping shop', 'the press feels weaker the longer it holds', 'a rush order of car brackets ships Friday'], ['The foreman at a bicycle-frame factory', 'the press slowly loses squeeze and ruins parts', 'every ruined part costs real money']],
    manual_transmission: [['A taxi driver called Joe', 'the gearbox crunches and fights him on certain shifts', 'he cannot earn a living while it is in the garage'], ['A rally-team mechanic', 'the car will not slot into gear cleanly', 'race day is in two days']],
    petrol_efi_engine: [['A courier on a delivery bike', 'the engine stumbles, then hesitates when she twists the throttle', 'she loses pay for every late parcel'], ['A weekend rider', 'it idles roughly and runs out of breath at speed', 'the group tour leaves on Saturday']],
    rotary_screw_compressor: [['The plant manager at a bottling factory', 'the air compressor runs hot and struggles to keep pressure', 'the whole filling line runs on that air']],
    experimental_cvt_drive: [['A mysterious letter, unsigned', 'this strange drive keeps slipping and nobody can say why', 'it belongs to the inventor you have been following']]
  };
  const hash = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  function story(c) {
    const list = STORIES[c.machineId] || STORIES.diesel_generator, [who, line, stake] = list[hash(c.seed) % list.length];
    return { who, line, stake };
  }

  const same = (t, u) => t.toolId === u.toolId && t.load === u.load && t.duration === u.duration;
  function trust(c, s) {
    const runs = s.testsRun, rep = runs.filter((t, i) => runs.findIndex(u => same(t, u)) < i).length, uniq = runs.length - rep;
    const wrong = s.repairsApplied.filter(id => { const r = c.repairOptions.find(x => x.id === id); return r && !(r.fixes && r.fixes.includes(c.primaryFaultId)) && !r.fixesSecondary; }).length;
    return Math.max(20, Math.round(100 - wrong * 12 - rep * 6 - Math.max(0, uniq - 4) * 4 - (s.hints || 0) * 4));
  }
  const OK = /\b(normal|nominal|within|clean|balanced|no abnormal|zero leakage|holds|adequate|healthy|good condition|meets)\b/i;
  const verdict = res => OK.test(res.detail || '') && !/\b(elevated|deficit|excessive|hotspot|lean|degraded|deviates|abnormal harmonic)\b/i.test((res.detail || '') + ' ' + (res.summary || ''))
    ? '<b class="p">🟢 Looks healthy</b>' : '<b class="fl">🟠 Something is off here</b>';

  function hint(c, s) {
    const f = global.FF_FAULTS.FAULT_CATALOG.find(x => x.id === c.primaryFaultId), n = Math.min(3, s.hints || 1);
    return [
      'Mia: Some faults hide until the machine is working hard. Try the same tool at low load and again at high load, and compare.',
      `Mia: Think about what kind of problem this is: ${String(f.faultType || 'wear').replace(/_/g, ' ')}. Which parts could cause that?`,
      `Mia: Spend your tests around the ${String(f.primaryComponent).replace(/_/g, ' ')}. Does a reading there look wrong?`
    ][n - 1];
  }

  global.FF_PLAIN = { simplify, TOOL_HELP, story, trust, verdict, hint };

  if (typeof document === 'undefined') return;
  // "Simple words" toggle: rewrites technical terms on screen, keeping the original in brackets so players learn them.
  const KEY = 'ffSimple', orig = new WeakMap(), shown = new WeakMap();
  let on = true; try { on = localStorage.getItem(KEY) !== '0'; } catch (e) {}
  function run() {
    const root = document.querySelector('main'); if (!root) return;
    obs.disconnect();
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) {
      if (/^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentNode.nodeName) || !n.nodeValue.trim()) continue;
      const base = shown.get(n) === n.nodeValue && orig.has(n) ? orig.get(n) : n.nodeValue, out = on ? simplify(base) : base;
      if (out !== n.nodeValue) n.nodeValue = out;
      orig.set(n, base); shown.set(n, out);
    }
    obs.observe(root, { childList: true, subtree: true, characterData: true });
  }
  let timer; const obs = new MutationObserver(() => { clearTimeout(timer); timer = setTimeout(run, 0); });
  function init() {
    const hdr = document.querySelector('header');
    if (hdr && !document.getElementById('simpleBtn')) {
      const b = document.createElement('button'); b.id = 'simpleBtn'; b.style.padding = '6px 10px';
      const paint = () => { b.textContent = on ? '🗣 Simple words: ON' : '🔧 Technical: ON'; };
      b.onclick = () => { on = !on; try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {} paint(); run(); };
      paint(); hdr.insertBefore(b, hdr.lastElementChild);
    }
    run();
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0)) : setTimeout(init, 0);
  global.FF_PLAIN.refresh = run;
})(typeof window !== 'undefined' ? window : globalThis);
