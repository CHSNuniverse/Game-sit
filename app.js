const svg = d3.select('#usMap');
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

const controls = {
  military: document.getElementById('military'),
  economy: document.getElementById('economy'),
  industry: document.getElementById('industry'),
  culture: document.getElementById('culture'),
  demography: document.getElementById('demography'),
  tactic: document.getElementById('tactic')
};

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
  }
}

function refreshMap() {
  svg.selectAll('path.state').attr('fill', (d) => {
    const controller = stateData.get(d.id).controller;
    return d3.interpolateTurbo((controller % 56) / 56);
  });
  tickLabel.textContent = `Tick: ${tick}`;
  renderLeaderboard();
}

function gameTick() {
  if (!running) return;
  tick += 1;

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
  editor.classList.remove('hidden');

  controls.military.value = st.military;
  controls.economy.value = st.economy;
  controls.industry.value = st.industry;
  controls.culture.value = st.culture;
  controls.demography.value = st.demography;
  controls.tactic.value = st.tactic;

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
