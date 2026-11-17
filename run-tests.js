// Engine regression tests. Run: node tests/run-tests.js   (no dependencies)
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..'), ctx = { console }; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ['machine-database','fault-engine','simulation-engine','diagnostic-engine','difficulty-engine','acceptance-engine','case-generator','progression-engine','plain-language'])
  vm.runInContext(fs.readFileSync(path.join(root, f + '.js'), 'utf8'), ctx, { filename: f });
const { FF_PLAIN: PL, FF_GENERATOR: G, FF_DB: DB, FF_FAULTS: F, FF_ACCEPTANCE: A, FF_DIAG: D, FF_PROGRESSION: P } = ctx;
let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : (fail++, console.log('FAIL:', m)); };
const solution = c => {
  const pf = F.FAULT_CATALOG.find(f => f.id === c.primaryFaultId), s = [pf.repairs.find(r => r.fixes && r.fixes.includes(pf.id)).id];
  if (c.compoundId) s.push(F.COMPOUND_INTERACTIONS.find(x => x.id === c.compoundId).extraRepair.id);
  return s;
};
const cases = [], prints = new Set(), tiers = ['apprentice', 'investigator', 'master'];
for (const diff of tiers) for (const rank of [0, 1, 2, 3, 4]) for (let i = 0; i < 14; i++) {
  const seed = `FF-TEST${diff[0]}${rank}${i}`;
  let c; try { c = G.generateCase({ seed, difficulty: diff, playerRank: rank }); } catch (e) { ok(false, 'generation threw ' + seed + ' ' + e.message); continue; }
  cases.push(c); prints.add(c.fingerprint);
  ok(A.runAcceptanceSuite(c, []).passed === false, 'unrepaired case must fail: ' + c.seed);
  ok(A.runAcceptanceSuite(c, solution(c)).passed, 'solution must pass: ' + c.seed);
  const sol = solution(c);
  for (const r of c.repairOptions) if (!sol.includes(r.id)) ok(!A.runAcceptanceSuite(c, [r.id]).passed, 'decoy passes alone: ' + c.seed + ' ' + r.id);
  if (c.compoundId) { ok(!A.runAcceptanceSuite(c, [sol[0]]).passed && !A.runAcceptanceSuite(c, [sol[1]]).passed, 'compound needs both repairs: ' + c.seed);
    ok(c.repairOptions.find(r => r.id === sol[1]).fixesSecondary === true, 'compound repair mislabelled: ' + c.seed); }
  if (c.formatId === 'experimental_archive') ok(c.isExperimental, 'prototype format must use the prototype machine: ' + c.seed);
  ok(DB.MACHINE_DATABASE[c.machineId].unlockRank <= rank, 'locked machine generated: ' + c.seed);
  // replay: code must rebuild the identical case even when the fingerprint is in the recent list
  const again = G.generateCase({ seed: c.seed, recentFingerprints: [c.fingerprint], difficulty: 'master', playerRank: 0 });
  ok(JSON.stringify(again) === JSON.stringify(c), 'replay differs: ' + c.seed);
}
console.log('cases generated:', cases.length, '| distinct fingerprints:', prints.size);
ok(cases.length >= 200, 'expected 200+ cases');
// every tool of every machine must react to a fault (no silent always-nominal fallbacks)
for (const m of Object.values(DB.MACHINE_DATABASE)) for (const t of m.tools) {
  const r = D.runDiagnosticTool({ machineId: m.id, primaryFaultId: F.FAULT_CATALOG.find(f => f.machineId === m.id).id, compoundId: null, difficulty: 'investigator', operatingConditions: { ambientTemp: 25 } }, t, { load: 85, duration: 20 }, []);
  ok(!/Nominal diagnostic check completed/.test(r.summary), 'tool falls back to default: ' + m.id + '/' + t);
}
// repeated tests / wasted repairs lower the efficiency score; replay codes are sanitised
const c0 = cases.find(c => c.difficulty === 'investigator'), sol0 = solution(c0), wrong = c0.repairOptions.find(r => !sol0.includes(r.id));
const mk = (runs, reps) => P.buildDebrief(c0, { testsRun: runs, repairsApplied: reps }, { passed: true });
const t1 = { toolId: 'thermal_camera', load: 85, duration: 15 };
ok(mk([t1, t1, t1], sol0).efficiencyScore < mk([t1], sol0).efficiencyScore, 'repeated tests must cost efficiency');
ok(mk([t1], [...sol0, wrong.id]).wastedCost === wrong.cost, 'wasted cost must be tracked');
ok(G.parseSeed('<img src=x>').base === 'IMGSRCX', 'seed must be sanitised');
// plain-language layer
ok(/gear-matching ring \(synchroniser\)/.test(PL.simplify('Worn synchroniser cone')), 'glossary keeps the real term in brackets');
for (const m of Object.values(DB.MACHINE_DATABASE)) { ok(!!PL.story({ machineId: m.id, seed: 'FF-X~i0~0' }).who, 'story for ' + m.id); for (const tl of m.tools) ok(!!PL.TOOL_HELP[tl], 'plain help for tool ' + tl); }
const sess = { testsRun: [], repairsApplied: [], hints: 0 };
ok(PL.trust(c0, sess) === 100, 'fresh trust is 100');
ok(PL.trust(c0, { ...sess, hints: 2 }) === 92 && PL.trust(c0, { ...sess, repairsApplied: [wrong.id] }) === 88, 'trust drops with hints and wrong repairs');
ok([1, 2, 3].every(n => /^Mia:/.test(PL.hint(c0, { hints: n }))) && PL.hint(c0, { hints: 1 }) !== PL.hint(c0, { hints: 3 }), 'hints escalate');
ok(/Looks healthy/.test(PL.verdict({ detail: 'Vibration spectrum clean; rotating assembly balanced.', summary: 'RMS 2.0' })) && /off/.test(PL.verdict({ detail: 'Significant flow deficit recorded.', summary: 'x' })), 'verdict separates healthy from faulty readings');
console.log(`${pass} checks passed, ${fail} failed`); process.exit(fail ? 1 : 0);
