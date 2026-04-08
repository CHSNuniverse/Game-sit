<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
const svg = d3.select('#usMap');
=======
const svg = document.getElementById('usMap');
>>>>>>> theirs
=======
const svg = document.getElementById('usMap');
>>>>>>> theirs
=======
const svg = document.getElementById('usMap');
>>>>>>> theirs
=======
const svg = document.getElementById('usMap');
>>>>>>> theirs
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const speedRange = document.getElementById('speedRange');
const speedValue = document.getElementById('speedValue');
const intensityRange = document.getElementById('intensityRange');
const intensityValue = document.getElementById('intensityValue');
const tickLabel = document.getElementById('tickLabel');
const selectedStateName = document.getElementById('selectedStateName');
const editor = document.getElementById('editor');
const leaderboard = document.getElementById('leaderboard');
const logView = document.getElementById('log');
const leaderTpl = document.getElementById('leaderItemTemplate');
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours

<<<<<<< ours
=======
=======
const relationsBoard = document.getElementById('relationsBoard');

>>>>>>> theirs
=======
const relationsBoard = document.getElementById('relationsBoard');

>>>>>>> theirs
=======
const relationsBoard = document.getElementById('relationsBoard');

>>>>>>> theirs
const presetSelect = document.getElementById('presetSelect');
const applyPresetBtn = document.getElementById('applyPresetBtn');
const exportBtn = document.getElementById('exportBtn');
const importArea = document.getElementById('importArea');
const importBtn = document.getElementById('importBtn');

<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
const dipA = document.getElementById('dipA');
const dipB = document.getElementById('dipB');
const allyBtn = document.getElementById('allyBtn');
const truceBtn = document.getElementById('truceBtn');
const betrayBtn = document.getElementById('betrayBtn');

<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
const controls = {
  military: document.getElementById('military'),
  economy: document.getElementById('economy'),
  industry: document.getElementById('industry'),
  culture: document.getElementById('culture'),
  demography: document.getElementById('demography'),
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
  tactic: document.getElementById('tactic')
};

<<<<<<< ours
const stateData = new Map();
const stateNodes = new Map();
let stateFeatures = [];
let neighbors = [];
let selectedId = null;
let running = false;
let tick = 0;
let loopHandle;

const tacticMods = {
  blitz: { attack: 1.25, defense: 0.9, attrition: 1.0 },
  economic: { attack: 1.0, defense: 1.05, attrition: 1.3 },
  defensive: { attack: 0.85, defense: 1.3, attrition: 0.9 },
  insurgency: { attack: 1.1, defense: 1.0, attrition: 1.2 }
};

function randStat(min = 30, max = 85) {
  return Math.round(min + Math.random() * (max - min));
}

function addLog(message) {
  const time = new Date().toLocaleTimeString();
  const line = document.createElement('div');
  line.textContent = `[${time}] ${message}`;
  logView.prepend(line);
  while (logView.children.length > 80) {
    logView.removeChild(logView.lastChild);
  }
}

function initStateModel(feature) {
  stateData.set(feature.id, {
    id: feature.id,
    name: feature.properties.name,
    controller: feature.id,
    territory: 1,
    military: randStat(),
    economy: randStat(),
    industry: randStat(),
    culture: randStat(20, 95),
    demography: randStat(10, 90),
    tactic: ['blitz', 'economic', 'defensive', 'insurgency'][Math.floor(Math.random() * 4)],
    losses: 0
  });
}

function coalitionOf(controllerId) {
  return [...stateData.values()].filter((s) => s.controller === controllerId);
}

function computePower(side) {
  const agg = side.reduce(
    (acc, s) => {
      acc.military += s.military;
      acc.economy += s.economy;
      acc.industry += s.industry;
      acc.culture += s.culture;
      acc.demography += s.demography;
      acc.territory += s.territory;
      return acc;
    },
    { military: 0, economy: 0, industry: 0, culture: 0, demography: 0, territory: 0 }
  );
  const avgCulture = agg.culture / side.length;
  const avgDemography = agg.demography / side.length;
  return (
    agg.military * 0.45 +
    agg.economy * 0.2 +
    agg.industry * 0.2 +
    avgCulture * 0.12 -
    avgDemography * 0.08 +
    agg.territory * 8
  );
}

function resolveBattle(attackerId, defenderId) {
  const intensity = Number(intensityRange.value);
  const attackSide = coalitionOf(attackerId);
  const defenseSide = coalitionOf(defenderId);
  const attackerMain = stateData.get(attackerId);
  const defenderMain = stateData.get(defenderId);

  const atkMod = tacticMods[attackerMain.tactic];
  const defMod = tacticMods[defenderMain.tactic];

  let attackPower = computePower(attackSide) * atkMod.attack;
  let defensePower = computePower(defenseSide) * defMod.defense;

  const randomSwing = 0.8 + Math.random() * 0.5;
  attackPower *= randomSwing * intensity;
  defensePower *= 2 - intensity / 2;

  if (attackPower <= defensePower) {
    const loss = Math.round((defensePower - attackPower) / 120);
    attackerMain.losses += loss;
    attackerMain.military = Math.max(5, attackerMain.military - loss);
    return false;
  }

  const candidates = [...stateData.values()].filter((s) => s.controller === defenderId);
  const captured = candidates[Math.floor(Math.random() * candidates.length)];
  captured.controller = attackerId;
  captured.territory = 1;
  attackerMain.territory += 1;

  const collapseCost = Math.round((attackPower - defensePower) / 180);
  attackerMain.losses += collapseCost;
  attackerMain.military = Math.max(5, attackerMain.military - collapseCost);
  defenderMain.losses += collapseCost;
  defenderMain.military = Math.max(5, defenderMain.military - collapseCost);

  return captured;
}

function chooseTargets() {
  const engagements = [];
  for (const [index, links] of neighbors.entries()) {
    const fromFeature = stateFeatures[index];
    const fromState = stateData.get(fromFeature.id);
    const fromController = fromState.controller;
    if (Math.random() > 0.17) continue;

    const enemyNeighbor = links
      .map((idx) => stateFeatures[idx])
      .find((f) => stateData.get(f.id).controller !== fromController);

    if (!enemyNeighbor) continue;

    engagements.push({ attacker: fromController, defender: stateData.get(enemyNeighbor.id).controller });
  }
  return engagements;
}

function renderLeaderboard() {
  const scoreboard = new Map();
  for (const st of stateData.values()) {
    const item = scoreboard.get(st.controller) || {
      id: st.controller,
      name: stateData.get(st.controller)?.name || st.name,
      territory: 0,
      power: 0
    };
    item.territory += 1;
    scoreboard.set(st.controller, item);
  }

  for (const item of scoreboard.values()) {
    const side = coalitionOf(item.id);
    item.power = Math.round(computePower(side));
  }

  const ranked = [...scoreboard.values()].sort((a, b) => b.territory - a.territory || b.power - a.power);
  leaderboard.innerHTML = '';

  ranked.slice(0, 12).forEach((row) => {
    const node = leaderTpl.content.firstElementChild.cloneNode(true);
    node.querySelector('.state').textContent = row.name;
    node.querySelector('.score').textContent = `${row.territory}州 / P${row.power}`;
    leaderboard.appendChild(node);
  });

  if (ranked[0] && ranked[0].territory === stateFeatures.length) {
    running = false;
    clearTimeout(loopHandle);
    addLog(`🏆 ${ranked[0].name} 已完成统一。`);
=======
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
  land: document.getElementById('land'),
  air: document.getElementById('air'),
  navy: document.getElementById('navy'),
  tactic: document.getElementById('tactic')
};

<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
const STATE_LAYOUT = [
  ['WA', 'Washington', 1, 1], ['OR', 'Oregon', 1, 2], ['CA', 'California', 1, 3], ['ID', 'Idaho', 2, 2],
  ['NV', 'Nevada', 2, 3], ['UT', 'Utah', 3, 3], ['AZ', 'Arizona', 2, 4], ['MT', 'Montana', 3, 1],
  ['WY', 'Wyoming', 4, 2], ['CO', 'Colorado', 4, 3], ['NM', 'New Mexico', 4, 4], ['ND', 'North Dakota', 5, 1],
  ['SD', 'South Dakota', 5, 2], ['NE', 'Nebraska', 5, 3], ['KS', 'Kansas', 5, 4], ['OK', 'Oklahoma', 5, 5],
  ['TX', 'Texas', 4, 6], ['MN', 'Minnesota', 6, 1], ['IA', 'Iowa', 6, 2], ['MO', 'Missouri', 6, 3],
  ['AR', 'Arkansas', 6, 4], ['LA', 'Louisiana', 6, 6], ['WI', 'Wisconsin', 7, 1], ['IL', 'Illinois', 7, 2],
  ['MI', 'Michigan', 8, 1], ['IN', 'Indiana', 8, 2], ['OH', 'Ohio', 9, 2], ['KY', 'Kentucky', 8, 3],
  ['TN', 'Tennessee', 8, 4], ['MS', 'Mississippi', 7, 5], ['AL', 'Alabama', 8, 5], ['GA', 'Georgia', 9, 5],
  ['FL', 'Florida', 10, 6], ['SC', 'South Carolina', 10, 5], ['NC', 'North Carolina', 10, 4], ['VA', 'Virginia', 10, 3],
  ['WV', 'West Virginia', 9, 3], ['PA', 'Pennsylvania', 10, 2], ['NY', 'New York', 11, 2], ['VT', 'Vermont', 12, 1],
  ['NH', 'New Hampshire', 13, 1], ['ME', 'Maine', 14, 1], ['MA', 'Massachusetts', 12, 2], ['CT', 'Connecticut', 12, 3],
  ['RI', 'Rhode Island', 13, 3], ['NJ', 'New Jersey', 11, 3], ['DE', 'Delaware', 11, 4], ['MD', 'Maryland', 10, 4.5],
  ['AK', 'Alaska', 1, 7], ['HI', 'Hawaii', 2, 7]
];

<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
=======
const COASTAL_STATES = new Set(['WA', 'OR', 'CA', 'TX', 'LA', 'MS', 'AL', 'FL', 'GA', 'SC', 'NC', 'VA', 'MD', 'DE', 'NJ', 'NY', 'CT', 'RI', 'MA', 'NH', 'ME', 'AK', 'HI']);
>>>>>>> theirs
=======
const COASTAL_STATES = new Set(['WA', 'OR', 'CA', 'TX', 'LA', 'MS', 'AL', 'FL', 'GA', 'SC', 'NC', 'VA', 'MD', 'DE', 'NJ', 'NY', 'CT', 'RI', 'MA', 'NH', 'ME', 'AK', 'HI']);
>>>>>>> theirs
=======
const COASTAL_STATES = new Set(['WA', 'OR', 'CA', 'TX', 'LA', 'MS', 'AL', 'FL', 'GA', 'SC', 'NC', 'VA', 'MD', 'DE', 'NJ', 'NY', 'CT', 'RI', 'MA', 'NH', 'ME', 'AK', 'HI']);
>>>>>>> theirs
const CELL_W = 62;
const CELL_H = 52;

const tacticMods = {
  blitz: { attack: 1.25, defense: 0.88 },
  economic: { attack: 1.0, defense: 1.1 },
  defensive: { attack: 0.86, defense: 1.3 },
  insurgency: { attack: 1.12, defense: 0.98 }
};

const stateData = new Map();
const grid = new Map();
const stateColor = new Map();
const occupations = new Map();
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
=======
const relations = new Map();
>>>>>>> theirs
=======
const relations = new Map();
>>>>>>> theirs
=======
const relations = new Map();
>>>>>>> theirs
let selectedId = null;
let running = false;
let tick = 0;
let loopHandle = null;

<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
=======
const relationKey = (a, b) => [a, b].sort().join('|');

>>>>>>> theirs
=======
const relationKey = (a, b) => [a, b].sort().join('|');

>>>>>>> theirs
=======
const relationKey = (a, b) => [a, b].sort().join('|');

>>>>>>> theirs
function randStat(min = 25, max = 90) {
  return Math.round(min + Math.random() * (max - min));
}

function controllerColor(id) {
  if (!stateColor.has(id)) {
    const hue = (id.charCodeAt(0) * 47 + id.charCodeAt(1) * 23) % 360;
    stateColor.set(id, `hsl(${hue} 78% 50%)`);
  }
  return stateColor.get(id);
}

function addLog(message) {
  const line = document.createElement('div');
  line.textContent = `[T${tick}] ${message}`;
  logView.prepend(line);
  while (logView.children.length > 120) logView.removeChild(logView.lastChild);
}

<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
function getActiveControllers() {
  return [...new Set([...stateData.values()].map((s) => s.controller))];
}

function updateDiplomacyOptions() {
  const controllers = getActiveControllers();
  const optionHtml = controllers
    .map((id) => `<option value="${id}">${stateData.get(id)?.name || id}</option>`)
    .join('');
  dipA.innerHTML = optionHtml;
  dipB.innerHTML = optionHtml;
  if (controllers.length > 1) dipB.value = controllers[1];
  renderRelationsBoard();
}

function renderRelationsBoard() {
  const controllers = getActiveControllers();
  const rows = [];
  for (let i = 0; i < controllers.length; i++) {
    for (let j = i + 1; j < controllers.length; j++) {
      const a = controllers[i], b = controllers[j];
      const rel = relations.get(relationKey(a, b)) || 'war';
      if (rel !== 'war') rows.push(`${stateData.get(a).name} ↔ ${stateData.get(b).name}: ${rel === 'ally' ? '同盟' : '停战'}`);
    }
  }
  relationsBoard.textContent = rows.length ? rows.join('\n') : '当前无同盟/停战关系';
}

function setRelation(a, b, type) {
  if (!a || !b || a === b) return;
  const key = relationKey(a, b);
  if (type === 'war') relations.delete(key);
  else relations.set(key, type);
  renderRelationsBoard();
}

function getRelation(a, b) {
  if (a === b) return 'self';
  return relations.get(relationKey(a, b)) || 'war';
}

<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
function initializeStates() {
  stateData.clear();
  grid.clear();
  occupations.clear();
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
=======
  relations.clear();
>>>>>>> theirs
=======
  relations.clear();
>>>>>>> theirs
=======
  relations.clear();
>>>>>>> theirs

  for (const [id, name, gx, gy] of STATE_LAYOUT) {
    stateData.set(id, {
      id,
      name,
      x: gx,
      y: gy,
      controller: id,
      military: randStat(),
      economy: randStat(),
      industry: randStat(),
      culture: randStat(20, 95),
      demography: randStat(10, 90),
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
=======
      land: randStat(20, 90),
      air: randStat(20, 90),
      navy: randStat(15, 90),
>>>>>>> theirs
=======
      land: randStat(20, 90),
      air: randStat(20, 90),
      navy: randStat(15, 90),
>>>>>>> theirs
=======
      land: randStat(20, 90),
      air: randStat(20, 90),
      navy: randStat(15, 90),
>>>>>>> theirs
      tactic: ['blitz', 'economic', 'defensive', 'insurgency'][Math.floor(Math.random() * 4)]
    });
    grid.set(`${gx},${gy}`, id);
  }
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
=======
  updateDiplomacyOptions();
>>>>>>> theirs
=======
  updateDiplomacyOptions();
>>>>>>> theirs
=======
  updateDiplomacyOptions();
>>>>>>> theirs
}

function applyPreset(type) {
  const tacticPool = ['blitz', 'economic', 'defensive', 'insurgency'];
  for (const st of stateData.values()) {
    if (type === 'balanced') {
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
      st.military = randStat(40, 70);
      st.economy = randStat(40, 70);
      st.industry = randStat(40, 70);
      st.culture = randStat(40, 70);
      st.demography = randStat(30, 60);
    } else if (type === 'military') {
      st.military = randStat(60, 95);
      st.industry = randStat(55, 90);
      st.economy = randStat(30, 65);
      st.culture = randStat(30, 70);
      st.demography = randStat(25, 70);
      st.tactic = Math.random() > 0.5 ? 'blitz' : 'defensive';
    } else if (type === 'economy') {
      st.economy = randStat(60, 95);
      st.industry = randStat(55, 90);
      st.military = randStat(30, 65);
      st.culture = randStat(45, 85);
      st.demography = randStat(20, 55);
      st.tactic = Math.random() > 0.5 ? 'economic' : 'defensive';
    } else if (type === 'fracture') {
      st.culture = randStat(20, 55);
      st.demography = randStat(55, 95);
      st.military = randStat(35, 75);
      st.economy = randStat(30, 70);
      st.industry = randStat(30, 70);
      st.tactic = tacticPool[Math.floor(Math.random() * tacticPool.length)];
    }
    st.controller = st.id;
  }
  occupations.clear();
  tick = 0;
  refreshMap();
  addLog(`已应用预设：${type}`);
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
      st.military = randStat(40, 70); st.economy = randStat(40, 70); st.industry = randStat(40, 70);
      st.culture = randStat(40, 70); st.demography = randStat(30, 60);
      st.land = randStat(35, 75); st.air = randStat(35, 75); st.navy = randStat(35, 75);
    } else if (type === 'military') {
      st.military = randStat(60, 95); st.industry = randStat(55, 90); st.economy = randStat(30, 65);
      st.culture = randStat(30, 70); st.demography = randStat(25, 70);
      st.land = randStat(60, 95); st.air = randStat(50, 88); st.navy = randStat(35, 80); st.tactic = Math.random() > 0.5 ? 'blitz' : 'defensive';
    } else if (type === 'economy') {
      st.economy = randStat(60, 95); st.industry = randStat(55, 90); st.military = randStat(30, 65);
      st.culture = randStat(45, 85); st.demography = randStat(20, 55);
      st.land = randStat(30, 70); st.air = randStat(45, 85); st.navy = randStat(35, 80); st.tactic = Math.random() > 0.5 ? 'economic' : 'defensive';
    } else if (type === 'fracture') {
      st.culture = randStat(20, 55); st.demography = randStat(55, 95);
      st.military = randStat(35, 75); st.economy = randStat(30, 70); st.industry = randStat(30, 70);
      st.land = randStat(30, 80); st.air = randStat(20, 70); st.navy = randStat(20, 70); st.tactic = tacticPool[Math.floor(Math.random() * tacticPool.length)];
    }
    st.controller = st.id;
  }
  occupations.clear(); relations.clear(); tick = 0;
  updateDiplomacyOptions(); refreshMap(); addLog(`已应用预设：${type}`);
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
}

function exportConfig() {
  const payload = {
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
    tick,
    intensity: Number(intensityRange.value),
    speed: Number(speedRange.value),
    states: [...stateData.values()].map((s) => ({
      id: s.id,
      controller: s.controller,
      military: s.military,
      economy: s.economy,
      industry: s.industry,
      culture: s.culture,
      demography: s.demography,
      tactic: s.tactic
    }))
=======
    tick, intensity: Number(intensityRange.value), speed: Number(speedRange.value), relations: [...relations.entries()],
    states: [...stateData.values()].map((s) => ({ ...s }))
>>>>>>> theirs
=======
    tick, intensity: Number(intensityRange.value), speed: Number(speedRange.value), relations: [...relations.entries()],
    states: [...stateData.values()].map((s) => ({ ...s }))
>>>>>>> theirs
=======
    tick, intensity: Number(intensityRange.value), speed: Number(speedRange.value), relations: [...relations.entries()],
    states: [...stateData.values()].map((s) => ({ ...s }))
>>>>>>> theirs
  };
  importArea.value = JSON.stringify(payload, null, 2);
  addLog('已导出当前配置到文本框。');
}

function importConfig() {
  try {
    const payload = JSON.parse(importArea.value);
    if (!payload.states || !Array.isArray(payload.states)) throw new Error('缺少 states 数组');
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours

    const lookup = new Map(payload.states.map((s) => [s.id, s]));
    for (const st of stateData.values()) {
      const src = lookup.get(st.id);
      if (!src) continue;
      st.controller = stateData.has(src.controller) ? src.controller : st.id;
      st.military = Number(src.military) || st.military;
      st.economy = Number(src.economy) || st.economy;
      st.industry = Number(src.industry) || st.industry;
      st.culture = Number(src.culture) || st.culture;
      st.demography = Number(src.demography) || st.demography;
      st.tactic = tacticMods[src.tactic] ? src.tactic : st.tactic;
    }

=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
    const lookup = new Map(payload.states.map((s) => [s.id, s]));

    for (const st of stateData.values()) {
      const src = lookup.get(st.id); if (!src) continue;
      for (const key of ['controller', 'military', 'economy', 'industry', 'culture', 'demography', 'land', 'air', 'navy', 'tactic']) {
        if (src[key] !== undefined) st[key] = key === 'tactic' ? (tacticMods[src[key]] ? src[key] : st[key]) : Number(src[key]) || st[key];
      }
      if (!stateData.has(st.controller)) st.controller = st.id;
    }

    relations.clear();
    if (Array.isArray(payload.relations)) payload.relations.forEach(([k, v]) => relations.set(k, v));
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
    tick = Number(payload.tick) || 0;
    if (payload.intensity) intensityRange.value = String(payload.intensity);
    if (payload.speed) speedRange.value = String(payload.speed);
    speedValue.textContent = `${speedRange.value}x`;
    intensityValue.textContent = Number(intensityRange.value).toFixed(1);

    occupations.clear();
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
    refreshMap();
    addLog('配置导入成功。');
  } catch (err) {
    addLog(`导入失败：${err.message}`);
  }
=======
    updateDiplomacyOptions(); refreshMap(); addLog('配置导入成功。');
  } catch (err) { addLog(`导入失败：${err.message}`); }
>>>>>>> theirs
=======
    updateDiplomacyOptions(); refreshMap(); addLog('配置导入成功。');
  } catch (err) { addLog(`导入失败：${err.message}`); }
>>>>>>> theirs
=======
    updateDiplomacyOptions(); refreshMap(); addLog('配置导入成功。');
  } catch (err) { addLog(`导入失败：${err.message}`); }
>>>>>>> theirs
}

function getNeighbors(id) {
  const s = stateData.get(id);
  const offsets = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]];
  return offsets.map(([dx, dy]) => grid.get(`${s.x + dx},${s.y + dy}`)).filter(Boolean);
}

<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
function coalition(controller) {
  return [...stateData.values()].filter((s) => s.controller === controller);
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
function alliedGroup(controller) {
  const seen = new Set([controller]);
  const queue = [controller];
  while (queue.length) {
    const cur = queue.shift();
    for (const other of getActiveControllers()) {
      if (!seen.has(other) && getRelation(cur, other) === 'ally') {
        seen.add(other);
        queue.push(other);
      }
    }
  }
  return seen;
}

function coalition(controller) {
  const allies = alliedGroup(controller);
  return [...stateData.values()].filter((s) => allies.has(s.controller));
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
}

function computePower(side) {
  const total = side.reduce((acc, s) => {
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
    acc.m += s.military;
    acc.e += s.economy;
    acc.i += s.industry;
    acc.c += s.culture;
    acc.d += s.demography;
    return acc;
  }, { m: 0, e: 0, i: 0, c: 0, d: 0 });

  const size = Math.max(1, side.length);
  return total.m * 0.44 + total.e * 0.2 + total.i * 0.2 + (total.c / size) * 0.15 - (total.d / size) * 0.1 + size * 7;
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
    acc.m += s.military; acc.e += s.economy; acc.i += s.industry; acc.c += s.culture; acc.d += s.demography;
    acc.land += s.land; acc.air += s.air; acc.navy += s.navy;
    return acc;
  }, { m: 0, e: 0, i: 0, c: 0, d: 0, land: 0, air: 0, navy: 0 });

  const size = Math.max(1, side.length);
  return total.m * 0.34 + total.e * 0.16 + total.i * 0.14 + total.land * 0.14 + total.air * 0.12 + total.navy * 0.1 + (total.c / size) * 0.12 - (total.d / size) * 0.1 + size * 7;
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
}

function pickBattles() {
  const fights = [];
  for (const st of stateData.values()) {
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
    if (Math.random() > 0.2) continue;
    const enemy = getNeighbors(st.id)
      .map((id) => stateData.get(id))
      .find((n) => n.controller !== st.controller && !occupations.has(n.id));
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
    if (Math.random() > 0.22) continue;
    const enemy = getNeighbors(st.id)
      .map((id) => stateData.get(id))
      .find((n) => n.controller !== st.controller && !occupations.has(n.id) && getRelation(st.controller, n.controller) === 'war');
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
    if (!enemy) continue;
    fights.push([st.controller, enemy.controller]);
  }
  return fights;
}

function resolveBattle(attackerCtrl, defenderCtrl) {
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
  if (attackerCtrl === defenderCtrl) return null;

  const atkMain = stateData.get(attackerCtrl);
  const defMain = stateData.get(defenderCtrl);
=======
  if (attackerCtrl === defenderCtrl || getRelation(attackerCtrl, defenderCtrl) !== 'war') return null;
  const atkMain = stateData.get(attackerCtrl); const defMain = stateData.get(defenderCtrl);
>>>>>>> theirs
=======
  if (attackerCtrl === defenderCtrl || getRelation(attackerCtrl, defenderCtrl) !== 'war') return null;
  const atkMain = stateData.get(attackerCtrl); const defMain = stateData.get(defenderCtrl);
>>>>>>> theirs
=======
  if (attackerCtrl === defenderCtrl || getRelation(attackerCtrl, defenderCtrl) !== 'war') return null;
  const atkMain = stateData.get(attackerCtrl); const defMain = stateData.get(defenderCtrl);
>>>>>>> theirs
  if (!atkMain || !defMain) return null;

  const atk = computePower(coalition(attackerCtrl)) * tacticMods[atkMain.tactic].attack;
  const def = computePower(coalition(defenderCtrl)) * tacticMods[defMain.tactic].defense;
  const intensity = Number(intensityRange.value);
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours

=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
  const attackScore = atk * (0.8 + Math.random() * 0.45) * intensity;
  const defenseScore = def * (1.05 - (intensity - 1) * 0.2);
  if (attackScore <= defenseScore) return null;

  const defenderTerritories = [...stateData.values()].filter((s) => s.controller === defenderCtrl && !occupations.has(s.id));
  if (defenderTerritories.length === 0) return null;
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours

  return defenderTerritories[Math.floor(Math.random() * defenderTerritories.length)];
}

function startOccupation(target, attackerCtrl) {
  const attacker = stateData.get(attackerCtrl);
  const dx = target.x - attacker.x;
  const dy = target.y - attacker.y;
  occupations.set(target.id, {
    targetId: target.id,
    from: target.controller,
    to: attackerCtrl,
    progress: 0,
    direction: Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'leftToRight' : 'rightToLeft') : (dy >= 0 ? 'topToBottom' : 'bottomToTop')
  });
}

function advanceOccupations() {
  const step = 0.08 * Number(intensityRange.value) * Number(speedRange.value) * 0.6;
  for (const [targetId, occ] of occupations.entries()) {
    occ.progress = Math.min(1, occ.progress + step);
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
  return defenderTerritories[Math.floor(Math.random() * defenderTerritories.length)];
}

function chooseFronts(target, attacker) {
  const fronts = new Set();
  fronts.add(target.x >= attacker.x ? 'left' : 'right');
  fronts.add(target.y >= attacker.y ? 'top' : 'bottom');
  const all = ['left', 'right', 'top', 'bottom'];
  while (fronts.size < 3) fronts.add(all[Math.floor(Math.random() * all.length)]);
  return [...fronts];
}

function startOccupation(target, attackerCtrl) {
  const attacker = stateData.get(attackerCtrl);
  occupations.set(target.id, {
    targetId: target.id,
    to: attackerCtrl,
    progress: 0,
    fronts: chooseFronts(target, attacker)
  });
}

function occupationStep(occ) {
  const attackerStates = coalition(occ.to);
  const avg = attackerStates.reduce((a, s) => ({ land: a.land + s.land, air: a.air + s.air, navy: a.navy + s.navy }), { land: 0, air: 0, navy: 0 });
  const n = Math.max(1, attackerStates.length);
  const land = avg.land / n;
  const air = avg.air / n;
  const navy = avg.navy / n;
  const target = stateData.get(occ.targetId);
  const navalBoost = COASTAL_STATES.has(target.id) ? navy * 0.0022 : navy * 0.0008;
  return 0.04 + land * 0.002 + air * 0.0018 + navalBoost;
}

function advanceOccupations() {
  const worldSpeed = Number(intensityRange.value) * Number(speedRange.value) * 0.45;
  for (const [targetId, occ] of occupations.entries()) {
    occ.progress = Math.min(1, occ.progress + occupationStep(occ) * worldSpeed);
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
    if (occ.progress >= 1) {
      const target = stateData.get(targetId);
      target.controller = occ.to;
      occupations.delete(targetId);
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
=======
      updateDiplomacyOptions();
>>>>>>> theirs
=======
      updateDiplomacyOptions();
>>>>>>> theirs
=======
      updateDiplomacyOptions();
>>>>>>> theirs
      addLog(`${stateData.get(occ.to).name} 完成对 ${target.name} 的蚕食占领。`);
    }
  }
}

function renderLeaderboard() {
  const ranking = new Map();
  for (const st of stateData.values()) {
    const row = ranking.get(st.controller) || { id: st.controller, name: stateData.get(st.controller)?.name || st.controller, territories: 0, power: 0 };
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
    row.territories += 1;
    ranking.set(st.controller, row);
  }

=======
    row.territories += 1; ranking.set(st.controller, row);
  }
>>>>>>> theirs
=======
    row.territories += 1; ranking.set(st.controller, row);
  }
>>>>>>> theirs
=======
    row.territories += 1; ranking.set(st.controller, row);
  }
>>>>>>> theirs
  for (const row of ranking.values()) row.power = Math.round(computePower(coalition(row.id)));
  const sorted = [...ranking.values()].sort((a, b) => b.territories - a.territories || b.power - a.power);

  leaderboard.innerHTML = '';
  sorted.slice(0, 12).forEach((row) => {
    const li = leaderTpl.content.firstElementChild.cloneNode(true);
    li.querySelector('.state').textContent = row.name;
    li.querySelector('.score').textContent = `${row.territories}州 / P${row.power}`;
    leaderboard.appendChild(li);
  });

  if (sorted[0]?.territories === stateData.size && occupations.size === 0) {
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
    running = false;
    clearTimeout(loopHandle);
    addLog(`🏆 ${sorted[0].name} 完成统一。`);
=======
    running = false; clearTimeout(loopHandle); addLog(`🏆 ${sorted[0].name} 完成统一。`);
>>>>>>> theirs
=======
    running = false; clearTimeout(loopHandle); addLog(`🏆 ${sorted[0].name} 完成统一。`);
>>>>>>> theirs
=======
    running = false; clearTimeout(loopHandle); addLog(`🏆 ${sorted[0].name} 完成统一。`);
>>>>>>> theirs
  }
}

function applyOccupationOverlay(state) {
  const occ = occupations.get(state.id);
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
  const overlay = document.getElementById(`overlay-${state.id}`);
  if (!overlay) return;

  if (!occ) {
    overlay.setAttribute('width', 0);
    overlay.setAttribute('height', 0);
    return;
  }

  const width = (CELL_W - 6) * occ.progress;
  const height = (CELL_H - 6) * occ.progress;
  overlay.setAttribute('fill', controllerColor(occ.to));

  const x = state.x * CELL_W;
  const y = state.y * CELL_H;
  if (occ.direction === 'leftToRight') {
    overlay.setAttribute('x', x);
    overlay.setAttribute('y', y);
    overlay.setAttribute('width', width);
    overlay.setAttribute('height', CELL_H - 6);
  } else if (occ.direction === 'rightToLeft') {
    overlay.setAttribute('x', x + (CELL_W - 6 - width));
    overlay.setAttribute('y', y);
    overlay.setAttribute('width', width);
    overlay.setAttribute('height', CELL_H - 6);
  } else if (occ.direction === 'topToBottom') {
    overlay.setAttribute('x', x);
    overlay.setAttribute('y', y);
    overlay.setAttribute('width', CELL_W - 6);
    overlay.setAttribute('height', height);
  } else {
    overlay.setAttribute('x', x);
    overlay.setAttribute('y', y + (CELL_H - 6 - height));
    overlay.setAttribute('width', CELL_W - 6);
    overlay.setAttribute('height', height);
>>>>>>> theirs
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
  const overlay = {
    left: document.getElementById(`overlay-left-${state.id}`),
    right: document.getElementById(`overlay-right-${state.id}`),
    top: document.getElementById(`overlay-top-${state.id}`),
    bottom: document.getElementById(`overlay-bottom-${state.id}`)
  };

  const x = state.x * CELL_W;
  const y = state.y * CELL_H;
  const fullW = CELL_W - 6;
  const fullH = CELL_H - 6;

  Object.values(overlay).forEach((el) => {
    el.setAttribute('width', 0);
    el.setAttribute('height', 0);
  });

  if (!occ) return;
  const color = controllerColor(occ.to);
  const p = occ.progress;

  if (occ.fronts.includes('left')) {
    overlay.left.setAttribute('fill', color);
    overlay.left.setAttribute('x', x);
    overlay.left.setAttribute('y', y);
    overlay.left.setAttribute('width', fullW * p);
    overlay.left.setAttribute('height', fullH);
  }
  if (occ.fronts.includes('right')) {
    const w = fullW * p;
    overlay.right.setAttribute('fill', color);
    overlay.right.setAttribute('x', x + fullW - w);
    overlay.right.setAttribute('y', y);
    overlay.right.setAttribute('width', w);
    overlay.right.setAttribute('height', fullH);
  }
  if (occ.fronts.includes('top')) {
    overlay.top.setAttribute('fill', color);
    overlay.top.setAttribute('x', x);
    overlay.top.setAttribute('y', y);
    overlay.top.setAttribute('width', fullW);
    overlay.top.setAttribute('height', fullH * p);
  }
  if (occ.fronts.includes('bottom')) {
    const h = fullH * p;
    overlay.bottom.setAttribute('fill', color);
    overlay.bottom.setAttribute('x', x);
    overlay.bottom.setAttribute('y', y + fullH - h);
    overlay.bottom.setAttribute('width', fullW);
    overlay.bottom.setAttribute('height', h);
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
  }
}

function refreshMap() {
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
  svg.selectAll('path.state').attr('fill', (d) => {
    const controller = stateData.get(d.id).controller;
    return d3.interpolateTurbo((controller % 56) / 56);
  });
=======
  for (const st of stateData.values()) {
    const rect = document.getElementById(`state-${st.id}`);
    if (!rect) continue;

=======
  for (const st of stateData.values()) {
    const rect = document.getElementById(`state-${st.id}`);
    if (!rect) continue;
>>>>>>> theirs
=======
  for (const st of stateData.values()) {
    const rect = document.getElementById(`state-${st.id}`);
    if (!rect) continue;
>>>>>>> theirs
=======
  for (const st of stateData.values()) {
    const rect = document.getElementById(`state-${st.id}`);
    if (!rect) continue;
>>>>>>> theirs
    rect.setAttribute('fill', controllerColor(st.controller));
    rect.classList.toggle('selected', st.id === selectedId);
    applyOccupationOverlay(st);
  }

  if (selectedId) {
    const selected = stateData.get(selectedId);
    const occ = occupations.get(selectedId);
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
    const occText = occ ? ` | 蚕食进度 ${(occ.progress * 100).toFixed(0)}%` : '';
    selectedStateName.textContent = `${selected.name}（当前联盟：${stateData.get(selected.controller).name}）${occText}`;
  }

>>>>>>> theirs
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
    const occText = occ ? ` | 蚕食进度 ${(occ.progress * 100).toFixed(0)}% | 战线 ${occ.fronts.join('+')}` : '';
    selectedStateName.textContent = `${selected.name}（当前联盟：${stateData.get(selected.controller).name}）${occText}`;
  }

<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
  tickLabel.textContent = `Tick: ${tick}`;
  renderLeaderboard();
}

function gameTick() {
  if (!running) return;
  tick += 1;

<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
  const fights = chooseTargets();
  fights.forEach(({ attacker, defender }) => {
    if (attacker === defender) return;
    const result = resolveBattle(attacker, defender);
    if (result) {
      addLog(`${stateData.get(attacker).name} 夺取 ${result.name}（原属 ${stateData.get(defender).name}）。`);
    }
  });

  refreshMap();
  const speed = Number(speedRange.value);
  loopHandle = setTimeout(gameTick, Math.max(50, 700 / speed));
}

function bindEditor() {
  for (const [key, input] of Object.entries(controls)) {
    input.addEventListener('input', () => {
      if (selectedId === null) return;
      const st = stateData.get(selectedId);
      st[key] = key === 'tactic' ? input.value : Number(input.value);
    });
  }
}

function showStateEditor(stateId) {
  const st = stateData.get(stateId);
  selectedId = stateId;
  selectedStateName.textContent = `${st.name}（当前控制联盟：${stateData.get(st.controller).name}）`;
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
  for (const [atk, def] of pickBattles()) {
    const result = resolveBattle(atk, def);
    if (result && !occupations.has(result.id)) {
      startOccupation(result, atk);
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
      addLog(`${stateData.get(atk).name} 正在蚕食 ${result.name}...`);
=======
      addLog(`${stateData.get(atk).name} 正在从多方向蚕食 ${result.name}...`);
>>>>>>> theirs
=======
      addLog(`${stateData.get(atk).name} 正在从多方向蚕食 ${result.name}...`);
>>>>>>> theirs
=======
      addLog(`${stateData.get(atk).name} 正在从多方向蚕食 ${result.name}...`);
>>>>>>> theirs
    }
  }

  advanceOccupations();
  refreshMap();
  loopHandle = setTimeout(gameTick, Math.max(40, 650 / Number(speedRange.value)));
}

function showEditor(id) {
  selectedId = id;
  const st = stateData.get(id);
  selectedStateName.textContent = `${st.name}（当前联盟：${stateData.get(st.controller).name}）`;
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
  editor.classList.remove('hidden');

  controls.military.value = st.military;
  controls.economy.value = st.economy;
  controls.industry.value = st.industry;
  controls.culture.value = st.culture;
  controls.demography.value = st.demography;
  controls.tactic.value = st.tactic;

<<<<<<< ours
  d3.selectAll('.state').classed('selected', (d) => d.id === stateId);
}

function resetSimulation() {
  running = false;
  clearTimeout(loopHandle);
  tick = 0;
  selectedId = null;
  selectedStateName.textContent = '点击地图州块后编辑参数';
  editor.classList.add('hidden');

  stateData.clear();
  stateFeatures.forEach(initStateModel);
  addLog('已重置模拟数据。');
  refreshMap();
}

function wireActions() {
=======
=======
  editor.classList.remove('hidden');
  for (const [key, input] of Object.entries(controls)) input.value = st[key];
>>>>>>> theirs
=======
  editor.classList.remove('hidden');
  for (const [key, input] of Object.entries(controls)) input.value = st[key];
>>>>>>> theirs
=======
  editor.classList.remove('hidden');
  for (const [key, input] of Object.entries(controls)) input.value = st[key];
>>>>>>> theirs
  refreshMap();
}

function shortName(name) {
  return name.length <= 10 ? name : `${name.slice(0, 10)}…`;
}

function renderMap() {
  svg.innerHTML = '';
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours

  for (const st of stateData.values()) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
  for (const st of stateData.values()) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const overlays = ['left', 'right', 'top', 'bottom'].map((side) => {
      const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      r.setAttribute('id', `overlay-${side}-${st.id}`);
      r.setAttribute('class', 'overlay');
      r.setAttribute('rx', 7);
      return r;
    });

<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
    const abbr = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const name = document.createElementNS('http://www.w3.org/2000/svg', 'text');

    const x = st.x * CELL_W;
    const y = st.y * CELL_H;

    rect.setAttribute('id', `state-${st.id}`);
    rect.setAttribute('class', 'state');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', CELL_W - 6);
    rect.setAttribute('height', CELL_H - 6);
    rect.setAttribute('rx', 7);

<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
    overlay.setAttribute('id', `overlay-${st.id}`);
    overlay.setAttribute('class', 'overlay');
    overlay.setAttribute('x', x);
    overlay.setAttribute('y', y);
    overlay.setAttribute('width', 0);
    overlay.setAttribute('height', 0);
    overlay.setAttribute('rx', 7);

=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
    abbr.setAttribute('x', x + 8);
    abbr.setAttribute('y', y + 21);
    abbr.setAttribute('class', 'abbr');
    abbr.textContent = st.id;

    name.setAttribute('x', x + 8);
    name.setAttribute('y', y + 38);
    name.setAttribute('class', 'state-name');
    name.textContent = shortName(st.name);

    g.appendChild(rect);
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
    g.appendChild(overlay);
=======
    overlays.forEach((o) => g.appendChild(o));
>>>>>>> theirs
=======
    overlays.forEach((o) => g.appendChild(o));
>>>>>>> theirs
=======
    overlays.forEach((o) => g.appendChild(o));
>>>>>>> theirs
    g.appendChild(abbr);
    g.appendChild(name);
    g.addEventListener('click', () => showEditor(st.id));
    svg.appendChild(g);
  }
}

function bindControls() {
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
  startBtn.addEventListener('click', () => {
    if (running) return;
    running = true;
    addLog('模拟开始。');
    gameTick();
  });

  pauseBtn.addEventListener('click', () => {
    running = false;
    clearTimeout(loopHandle);
    addLog('模拟暂停。');
  });

<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
  resetBtn.addEventListener('click', resetSimulation);

  speedRange.addEventListener('input', () => {
    speedValue.textContent = `${speedRange.value}x`;
  });

  intensityRange.addEventListener('input', () => {
    intensityValue.textContent = Number(intensityRange.value).toFixed(1);
  });
}

async function bootstrap() {
  const us = await d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json');
  stateFeatures = topojson.feature(us, us.objects.states).features;
  neighbors = topojson.neighbors(us.objects.states.geometries);

  stateFeatures.forEach(initStateModel);

  const projection = d3.geoAlbersUsa().fitSize([975, 610], { type: 'FeatureCollection', features: stateFeatures });
  const path = d3.geoPath(projection);

  svg
    .selectAll('path')
    .data(stateFeatures)
    .join('path')
    .attr('class', 'state')
    .attr('d', path)
    .on('click', (_, d) => showStateEditor(d.id))
    .each(function (d) {
      stateNodes.set(d.id, this);
    });

  wireActions();
  bindEditor();
  refreshMap();
  addLog('加载完成，可开始模拟。');
}

bootstrap().catch((err) => {
  addLog(`地图加载失败：${err.message}`);
});
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
  resetBtn.addEventListener('click', () => {
    running = false;
    clearTimeout(loopHandle);
    tick = 0;
    selectedId = null;
    selectedStateName.textContent = '点击地图州块后编辑参数';
    editor.classList.add('hidden');
    initializeStates();
    renderMap();
    refreshMap();
    addLog('已重置模拟。');
  });

  applyPresetBtn.addEventListener('click', () => applyPreset(presetSelect.value));
  exportBtn.addEventListener('click', exportConfig);
  importBtn.addEventListener('click', importConfig);

<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
  allyBtn.addEventListener('click', () => {
    setRelation(dipA.value, dipB.value, 'ally');
    addLog(`${stateData.get(dipA.value).name} 与 ${stateData.get(dipB.value).name} 结盟。`);
  });
  truceBtn.addEventListener('click', () => {
    setRelation(dipA.value, dipB.value, 'truce');
    addLog(`${stateData.get(dipA.value).name} 与 ${stateData.get(dipB.value).name} 达成停战。`);
  });
  betrayBtn.addEventListener('click', () => {
    setRelation(dipA.value, dipB.value, 'war');
    addLog(`${stateData.get(dipA.value).name} 对 ${stateData.get(dipB.value).name} 背刺，关系回到战争。`);
  });

<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
  speedRange.addEventListener('input', () => (speedValue.textContent = `${speedRange.value}x`));
  intensityRange.addEventListener('input', () => (intensityValue.textContent = Number(intensityRange.value).toFixed(1)));

  for (const [key, input] of Object.entries(controls)) {
    input.addEventListener('input', () => {
      if (!selectedId) return;
      const st = stateData.get(selectedId);
      st[key] = key === 'tactic' ? input.value : Number(input.value);
    });
  }
}

function bootstrap() {
  initializeStates();
  renderMap();
  bindControls();
  refreshMap();
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
  addLog('加载完成：支持州名标注、蚕食占领、预设场景、配置导入导出。');
}

bootstrap();
>>>>>>> theirs
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
  addLog('加载完成：支持多方向蚕食 + 外交系统 + 陆海空兵种。');
}

bootstrap();
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
