const svg = document.getElementById('usMap');
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
const relationsBoard = document.getElementById('relationsBoard');

const presetSelect = document.getElementById('presetSelect');
const applyPresetBtn = document.getElementById('applyPresetBtn');
const exportBtn = document.getElementById('exportBtn');
const importArea = document.getElementById('importArea');
const importBtn = document.getElementById('importBtn');

const dipA = document.getElementById('dipA');
const dipB = document.getElementById('dipB');
const allyBtn = document.getElementById('allyBtn');
const truceBtn = document.getElementById('truceBtn');
const betrayBtn = document.getElementById('betrayBtn');

const controls = {
  military: document.getElementById('military'),
  economy: document.getElementById('economy'),
  industry: document.getElementById('industry'),
  culture: document.getElementById('culture'),
  demography: document.getElementById('demography'),
  land: document.getElementById('land'),
  air: document.getElementById('air'),
  navy: document.getElementById('navy'),
  tactic: document.getElementById('tactic')
};

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

const COASTAL_STATES = new Set(['WA', 'OR', 'CA', 'TX', 'LA', 'MS', 'AL', 'FL', 'GA', 'SC', 'NC', 'VA', 'MD', 'DE', 'NJ', 'NY', 'CT', 'RI', 'MA', 'NH', 'ME', 'AK', 'HI']);
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
const relations = new Map();
let selectedId = null;
let running = false;
let tick = 0;
let loopHandle = null;

const relationKey = (a, b) => [a, b].sort().join('|');

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

function initializeStates() {
  stateData.clear();
  grid.clear();
  occupations.clear();
  relations.clear();

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
      land: randStat(20, 90),
      air: randStat(20, 90),
      navy: randStat(15, 90),
      tactic: ['blitz', 'economic', 'defensive', 'insurgency'][Math.floor(Math.random() * 4)]
    });
    grid.set(`${gx},${gy}`, id);
  }
  updateDiplomacyOptions();
}

function applyPreset(type) {
  const tacticPool = ['blitz', 'economic', 'defensive', 'insurgency'];
  for (const st of stateData.values()) {
    if (type === 'balanced') {
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
}

function exportConfig() {
  const payload = {
    tick, intensity: Number(intensityRange.value), speed: Number(speedRange.value), relations: [...relations.entries()],
    states: [...stateData.values()].map((s) => ({ ...s }))
  };
  importArea.value = JSON.stringify(payload, null, 2);
  addLog('已导出当前配置到文本框。');
}

function importConfig() {
  try {
    const payload = JSON.parse(importArea.value);
    if (!payload.states || !Array.isArray(payload.states)) throw new Error('缺少 states 数组');
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
    tick = Number(payload.tick) || 0;
    if (payload.intensity) intensityRange.value = String(payload.intensity);
    if (payload.speed) speedRange.value = String(payload.speed);
    speedValue.textContent = `${speedRange.value}x`;
    intensityValue.textContent = Number(intensityRange.value).toFixed(1);

    occupations.clear();
    updateDiplomacyOptions(); refreshMap(); addLog('配置导入成功。');
  } catch (err) { addLog(`导入失败：${err.message}`); }
}

function getNeighbors(id) {
  const s = stateData.get(id);
  const offsets = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]];
  return offsets.map(([dx, dy]) => grid.get(`${s.x + dx},${s.y + dy}`)).filter(Boolean);
}

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
}

function computePower(side) {
  const total = side.reduce((acc, s) => {
    acc.m += s.military; acc.e += s.economy; acc.i += s.industry; acc.c += s.culture; acc.d += s.demography;
    acc.land += s.land; acc.air += s.air; acc.navy += s.navy;
    return acc;
  }, { m: 0, e: 0, i: 0, c: 0, d: 0, land: 0, air: 0, navy: 0 });

  const size = Math.max(1, side.length);
  return total.m * 0.34 + total.e * 0.16 + total.i * 0.14 + total.land * 0.14 + total.air * 0.12 + total.navy * 0.1 + (total.c / size) * 0.12 - (total.d / size) * 0.1 + size * 7;
}

function pickBattles() {
  const fights = [];
  for (const st of stateData.values()) {
    if (Math.random() > 0.22) continue;
    const enemy = getNeighbors(st.id)
      .map((id) => stateData.get(id))
      .find((n) => n.controller !== st.controller && !occupations.has(n.id) && getRelation(st.controller, n.controller) === 'war');
    if (!enemy) continue;
    fights.push([st.controller, enemy.controller]);
  }
  return fights;
}

function resolveBattle(attackerCtrl, defenderCtrl) {
  if (attackerCtrl === defenderCtrl || getRelation(attackerCtrl, defenderCtrl) !== 'war') return null;
  const atkMain = stateData.get(attackerCtrl); const defMain = stateData.get(defenderCtrl);
  if (!atkMain || !defMain) return null;

  const atk = computePower(coalition(attackerCtrl)) * tacticMods[atkMain.tactic].attack;
  const def = computePower(coalition(defenderCtrl)) * tacticMods[defMain.tactic].defense;
  const intensity = Number(intensityRange.value);
  const attackScore = atk * (0.8 + Math.random() * 0.45) * intensity;
  const defenseScore = def * (1.05 - (intensity - 1) * 0.2);
  if (attackScore <= defenseScore) return null;

  const defenderTerritories = [...stateData.values()].filter((s) => s.controller === defenderCtrl && !occupations.has(s.id));
  if (defenderTerritories.length === 0) return null;
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
    if (occ.progress >= 1) {
      const target = stateData.get(targetId);
      target.controller = occ.to;
      occupations.delete(targetId);
      updateDiplomacyOptions();
      addLog(`${stateData.get(occ.to).name} 完成对 ${target.name} 的蚕食占领。`);
    }
  }
}

function renderLeaderboard() {
  const ranking = new Map();
  for (const st of stateData.values()) {
    const row = ranking.get(st.controller) || { id: st.controller, name: stateData.get(st.controller)?.name || st.controller, territories: 0, power: 0 };
    row.territories += 1; ranking.set(st.controller, row);
  }
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
    running = false; clearTimeout(loopHandle); addLog(`🏆 ${sorted[0].name} 完成统一。`);
  }
}

function applyOccupationOverlay(state) {
  const occ = occupations.get(state.id);
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
  }
}

function refreshMap() {
  for (const st of stateData.values()) {
    const rect = document.getElementById(`state-${st.id}`);
    if (!rect) continue;
    rect.setAttribute('fill', controllerColor(st.controller));
    rect.classList.toggle('selected', st.id === selectedId);
    applyOccupationOverlay(st);
  }

  if (selectedId) {
    const selected = stateData.get(selectedId);
    const occ = occupations.get(selectedId);
    const occText = occ ? ` | 蚕食进度 ${(occ.progress * 100).toFixed(0)}% | 战线 ${occ.fronts.join('+')}` : '';
    selectedStateName.textContent = `${selected.name}（当前联盟：${stateData.get(selected.controller).name}）${occText}`;
  }

  tickLabel.textContent = `Tick: ${tick}`;
  renderLeaderboard();
}

function gameTick() {
  if (!running) return;
  tick += 1;

  for (const [atk, def] of pickBattles()) {
    const result = resolveBattle(atk, def);
    if (result && !occupations.has(result.id)) {
      startOccupation(result, atk);
      addLog(`${stateData.get(atk).name} 正在从多方向蚕食 ${result.name}...`);
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
  editor.classList.remove('hidden');
  for (const [key, input] of Object.entries(controls)) input.value = st[key];
  refreshMap();
}

function shortName(name) {
  return name.length <= 10 ? name : `${name.slice(0, 10)}…`;
}

function renderMap() {
  svg.innerHTML = '';
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

    abbr.setAttribute('x', x + 8);
    abbr.setAttribute('y', y + 21);
    abbr.setAttribute('class', 'abbr');
    abbr.textContent = st.id;

    name.setAttribute('x', x + 8);
    name.setAttribute('y', y + 38);
    name.setAttribute('class', 'state-name');
    name.textContent = shortName(st.name);

    g.appendChild(rect);
    overlays.forEach((o) => g.appendChild(o));
    g.appendChild(abbr);
    g.appendChild(name);
    g.addEventListener('click', () => showEditor(st.id));
    svg.appendChild(g);
  }
}

function bindControls() {
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
  addLog('加载完成：支持多方向蚕食 + 外交系统 + 陆海空兵种。');
}

bootstrap();
