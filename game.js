"use strict";

const CONFIG = Object.freeze({
  WIDTH: 960,
  HEIGHT: 540,
  TAU: Math.PI * 2,
  MAX_DELTA: 0.034,
  MAX_CAPTURE_SLOTS: 6,
  BOSS_TIME: 60,
  COLORS: {
    space: "#030615",
    blue: "#40f8ff",
    red: "#ff45a8",
    white: "#f5ffff",
    yellow: "#ffe86b",
  },
  PLAYER: {
    x: 140,
    y: 270,
    radius: 18,
    hitbox: 5,
    hp: 3,
    speed: 330,
    captureSpeed: 155,
    invincibility: 1.4,
    fireInterval: 0.17,
    shotSpeed: 690,
    shotDamage: 2,
  },
  CAPTURE: {
    offsetX: 58,
    radius: 46,
    score: 25,
    orbitRadius: 48,
    orbitSpeed: 1.8,
    mergeProtection: 0.28,
  },
  ENEMY: { spawnEarly: 1.8, spawnLate: 0.85, bulletSpeed: 170, bossHp: 1600 },
  MAX_CAPTURE_LEVEL: 4,
  COUNTER_TYPES: {
    blue: {
      name: "LANCE",
      levels: {
        1: {
          description: "PRECISION STRIKE",
          spawnOffset: 34,
          speed: 790,
          radius: 5,
          damage: 20,
          lifetime: 1.5,
          penetrationCount: 0,
          bossMultiplier: 1.1,
          needleSpeed: 0,
          needleAngle: 0,
          needleDamage: 0,
          needleRadius: 0,
          needleLifetime: 0,
          bulletClearWidth: 0,
          trailLength: 34,
          trailWidth: 3,
        },
        2: {
          description: "DOUBLE PIERCE",
          spawnOffset: 36,
          speed: 820,
          radius: 7,
          damage: 34,
          lifetime: 1.65,
          penetrationCount: 1,
          bossMultiplier: 1.2,
          needleSpeed: 0,
          needleAngle: 0,
          needleDamage: 0,
          needleRadius: 0,
          needleLifetime: 0,
          bulletClearWidth: 0,
          trailLength: 48,
          trailWidth: 4,
        },
        3: {
          description: "PIERCE + SPLIT",
          spawnOffset: 38,
          speed: 850,
          radius: 8,
          damage: 52,
          lifetime: 1.75,
          penetrationCount: 3,
          bossMultiplier: 1.35,
          needleSpeed: 530,
          needleAngle: 0.48,
          needleDamage: 13,
          needleRadius: 3,
          needleLifetime: 0.8,
          bulletClearWidth: 0,
          trailLength: 62,
          trailWidth: 5,
        },
        4: {
          description: "FORTRESS BREAKER",
          spawnOffset: 42,
          speed: 900,
          radius: 15,
          damage: 92,
          lifetime: 1.9,
          penetrationCount: 7,
          bossMultiplier: 1.85,
          needleSpeed: 0,
          needleAngle: 0,
          needleDamage: 0,
          needleRadius: 0,
          needleLifetime: 0,
          bulletClearWidth: 11,
          trailLength: 105,
          trailWidth: 9,
        },
      },
    },
    red: {
      name: "BOMB",
      levels: {
        1: {
          description: "QUICK CLEAR",
          forwardOffset: 82,
          initialRadius: 44,
          maximumRadius: 58,
          duration: 0.14,
          damage: 7,
          damageInterval: 0.3,
          scorePerClearedBullet: 0,
          screenShake: 4,
          expansionTime: 0.09,
          fadeTime: 0.08,
          pulseSpeed: 8,
          pulseAmount: 2,
          clearsBullets: true,
          convertsBulletsToScore: false,
        },
        2: {
          description: "CLEAR FIELD",
          forwardOffset: 102,
          initialRadius: 58,
          maximumRadius: 86,
          duration: 1.35,
          damage: 10,
          damageInterval: 0.44,
          scorePerClearedBullet: 0,
          screenShake: 6,
          expansionTime: 0.28,
          fadeTime: 0.35,
          pulseSpeed: 7,
          pulseAmount: 3,
          clearsBullets: true,
          convertsBulletsToScore: false,
        },
        3: {
          description: "CONVERSION ZONE",
          forwardOffset: 120,
          initialRadius: 76,
          maximumRadius: 116,
          duration: 2.25,
          damage: 14,
          damageInterval: 0.42,
          scorePerClearedBullet: 75,
          screenShake: 9,
          expansionTime: 0.4,
          fadeTime: 0.5,
          pulseSpeed: 6,
          pulseAmount: 4,
          clearsBullets: true,
          convertsBulletsToScore: true,
        },
        4: {
          description: "FORWARD SANCTUARY",
          forwardOffset: 140,
          initialRadius: 92,
          maximumRadius: 154,
          duration: 5.2,
          damage: 21,
          damageInterval: 0.38,
          scorePerClearedBullet: 100,
          screenShake: 13,
          expansionTime: 0.55,
          fadeTime: 1.2,
          pulseSpeed: 5,
          pulseAmount: 5,
          clearsBullets: true,
          convertsBulletsToScore: true,
        },
      },
    },
  },
});

const gameState = {
  phase: "start",
  nextId: 1,
  time: 0,
  score: 0,
  player: null,
  boss: null,
  enemies: [],
  enemyBullets: [],
  playerBullets: [],
  capturedBullets: [],
  blueLances: [],
  blueNeedles: [],
  redBombFields: [],
  particles: [],
  rings: [],
  texts: [],
  stars: [],
  mergeQueue: [],
  mergingCapturedIds: new Set(),
  selectedCapturedId: null,
  capture: { active: false, fullFlash: 0 },
  input: {
    keys: new Set(),
    pointerX: 140,
    pointerY: 270,
    pointerActive: false,
    captureRequested: false,
    useRequested: false,
    nextRequested: false,
    previousRequested: false,
    slotRequested: null,
  },
  spawnTimer: 0.6,
  shotTimer: 0,
  screenShake: 0,
  flash: 0,
  lastFrame: 0,
  animationFrame: null,
  listenersBound: false,
  dom: {},
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const distanceSq = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const overlaps = (a, b, pad = 0) =>
  distanceSq(a, b) <= (a.radius + b.radius + pad) ** 2;
const id = () => gameState.nextId++;
const colorValue = (t) => CONFIG.COLORS[t] || CONFIG.COLORS.white;

function cacheDom() {
  [
    "game-canvas",
    "score",
    "hp",
    "stage-time",
    "captured-count",
    "highest-level",
    "blue-count",
    "red-count",
    "boss-hud",
    "boss-health-text",
    "boss-health-fill",
    "selected-slot",
    "selected-color-level",
    "selected-family",
    "selected-effect",
    "start-overlay",
    "result-overlay",
    "result-kicker",
    "result-title",
    "final-score",
    "start-button",
    "restart-button",
    "select-prev",
    "select-next",
    "use-button",
  ].forEach((k) => (gameState.dom[k] = document.getElementById(k)));
}
function resetGame() {
  gameState.phase = "playing";
  gameState.nextId = 1;
  gameState.time = 0;
  gameState.score = 0;
  gameState.player = {
    id: id(),
    active: true,
    x: CONFIG.PLAYER.x,
    y: CONFIG.PLAYER.y,
    radius: CONFIG.PLAYER.radius,
    hp: CONFIG.PLAYER.hp,
    invincibility: 0,
    recoil: 0,
  };
  gameState.boss = null;
  [
    "enemies",
    "enemyBullets",
    "playerBullets",
    "capturedBullets",
    "blueLances",
    "blueNeedles",
    "redBombFields",
    "particles",
    "rings",
    "texts",
    "mergeQueue",
  ].forEach((k) => (gameState[k] = []));
  gameState.mergingCapturedIds = new Set();
  gameState.selectedCapturedId = null;
  gameState.capture = { active: false, fullFlash: 0 };
  gameState.input.keys.clear();
  Object.assign(gameState.input, {
    pointerX: 140,
    pointerY: 270,
    pointerActive: false,
    captureRequested: false,
    useRequested: false,
    nextRequested: false,
    previousRequested: false,
    slotRequested: null,
  });
  gameState.spawnTimer = 0.5;
  gameState.shotTimer = 0;
  gameState.screenShake = 0;
  gameState.flash = 0;
  gameState.stars = Array.from({ length: 85 }, () => ({
    x: Math.random() * 960,
    y: Math.random() * 540,
    s: 0.4 + Math.random() * 1.8,
    d: 15 + Math.random() * 50,
  }));
  gameState.dom["start-overlay"].classList.add("hidden");
  gameState.dom["result-overlay"].classList.add("hidden");
}
function bindEvents() {
  if (gameState.listenersBound) return;
  gameState.listenersBound = true;
  const c = gameState.dom["game-canvas"];
  const point = (e) => {
    const r = c.getBoundingClientRect();
    gameState.input.pointerX = ((e.clientX - r.left) * 960) / r.width;
    gameState.input.pointerY = ((e.clientY - r.top) * 540) / r.height;
  };
  c.addEventListener("pointermove", (e) => {
    point(e);
    gameState.input.pointerActive = true;
  });
  c.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    point(e);
    if (e.button === 0) gameState.input.captureRequested = true;
    if (e.button === 2) gameState.input.useRequested = true;
  });
  window.addEventListener("pointerup", (e) => {
    if (e.button === 0) gameState.input.captureRequested = false;
  });
  c.addEventListener("contextmenu", (e) => e.preventDefault());
  c.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      e.deltaY > 0
        ? (gameState.input.nextRequested = true)
        : (gameState.input.previousRequested = true);
    },
    { passive: false },
  );
  window.addEventListener("keydown", (e) => {
    if (
      [
        "Space",
        "KeyQ",
        "KeyE",
        "ShiftLeft",
        "ShiftRight",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ].includes(e.code)
    )
      e.preventDefault();
    gameState.input.keys.add(e.code);
    if (e.repeat) return;
    if (e.code === "Space") gameState.input.useRequested = true;
    if (e.code === "KeyQ") gameState.input.previousRequested = true;
    if (e.code === "KeyE") gameState.input.nextRequested = true;
    if (/^Digit[1-6]$/.test(e.code))
      gameState.input.slotRequested = Number(e.code.slice(5)) - 1;
  });
  window.addEventListener("keyup", (e) => gameState.input.keys.delete(e.code));
  const ui = (el, fn) =>
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      fn();
    });
  ui(
    gameState.dom["select-prev"],
    () => (gameState.input.previousRequested = true),
  );
  ui(
    gameState.dom["select-next"],
    () => (gameState.input.nextRequested = true),
  );
  ui(gameState.dom["use-button"], () => (gameState.input.useRequested = true));
  gameState.dom["start-button"].addEventListener("click", resetGame);
  gameState.dom["restart-button"].addEventListener("click", resetGame);
}

function getActiveCapturedBullets() {
  return gameState.capturedBullets
    .filter((c) => c?.active)
    .sort((a, b) => a.orbitSlot - b.orbitSlot);
}
function getSelectedCapturedBullet() {
  return (
    gameState.capturedBullets.find(
      (c) => c?.active && c.id === gameState.selectedCapturedId,
    ) || null
  );
}
function getCapturedIndexById(v) {
  return getActiveCapturedBullets().findIndex((c) => c.id === v);
}
function selectCapturedById(v) {
  const c = gameState.capturedBullets.find((x) => x?.active && x.id === v);
  if (!c) return false;
  gameState.selectedCapturedId = c.id;
  return true;
}
function selectCapturedBySlot(slot) {
  const a = getActiveCapturedBullets();
  return Number.isInteger(slot) && slot >= 0 && slot < a.length
    ? selectCapturedById(a[slot].id)
    : false;
}
function selectNextCaptured() {
  const a = getActiveCapturedBullets();
  if (!a.length) return normalizeCapturedSelection();
  const i = a.findIndex((c) => c.id === gameState.selectedCapturedId);
  return selectCapturedById(a[(i + 1 + a.length) % a.length].id);
}
function selectPreviousCaptured() {
  const a = getActiveCapturedBullets();
  if (!a.length) return normalizeCapturedSelection();
  const i = a.findIndex((c) => c.id === gameState.selectedCapturedId);
  return selectCapturedById(a[(i < 0 ? 0 : i - 1 + a.length) % a.length].id);
}
function normalizeCapturedSelection(preferredSlot = null, previousId = null) {
  const a = getActiveCapturedBullets();
  if (!a.length) {
    gameState.selectedCapturedId = null;
    return false;
  }
  if (a.some((c) => c.id === gameState.selectedCapturedId)) return true;
  let c = Number.isInteger(preferredSlot)
    ? a.find((x) => x.orbitSlot === preferredSlot)
    : null;
  if (!c && previousId !== null) {
    const i = a.findIndex((x) => x.id === previousId);
    c = i > 0 ? a[i - 1] : null;
  }
  gameState.selectedCapturedId = (c || a[0]).id;
  return true;
}
function normalizeOrbitSlots() {
  getActiveCapturedBullets().forEach((c, i) => (c.orbitSlot = i));
}
function removeCapturedBulletById(v) {
  const c = gameState.capturedBullets.find((x) => x?.active && x.id === v);
  if (!c) return null;
  const oldSlot = c.orbitSlot;
  c.active = false;
  normalizeOrbitSlots();
  normalizeCapturedSelection(oldSlot, v);
  return c;
}
function createCapturedBullet(colorType, level = 1, protection = 0) {
  if (
    !CONFIG.COUNTER_TYPES[colorType]?.levels[level] ||
    getActiveCapturedBullets().length >= CONFIG.MAX_CAPTURE_SLOTS
  )
    return null;
  const c = {
    id: id(),
    active: true,
    colorType,
    level,
    orbitSlot: getActiveCapturedBullets().length,
    mergeProtection: protection,
    x: 0,
    y: 0,
    radius: 5 + level * 2,
  };
  gameState.capturedBullets.push(c);
  if (gameState.selectedCapturedId === null)
    gameState.selectedCapturedId = c.id;
  return c;
}

function createBlueLance(captured, values) {
  const p = gameState.player;
  if (!p?.active) return null;
  return {
    id: id(),
    type: "blueLance",
    active: true,
    level: captured.level,
    x: p.x + values.spawnOffset,
    y: p.y,
    vx: values.speed,
    vy: 0,
    radius: values.radius,
    damage: values.damage,
    lifetime: values.lifetime,
    penetrationRemaining: values.penetrationCount,
    bossDamageMultiplier: values.bossMultiplier,
    alreadyHitIds: new Set(),
  };
}
function createBlueNeedles(parent, x, y) {
  const v = CONFIG.COUNTER_TYPES.blue.levels[parent.level];
  if (!v?.needleSpeed) return;
  [-1, 1].forEach((sign) =>
    gameState.blueNeedles.push({
      id: id(),
      type: "blueNeedle",
      active: true,
      parentId: parent.id,
      x,
      y,
      vx: Math.cos(v.needleAngle) * v.needleSpeed,
      vy: sign * Math.sin(v.needleAngle) * v.needleSpeed,
      radius: v.needleRadius,
      damage: v.needleDamage,
      lifetime: v.needleLifetime,
      alreadyHitIds: new Set(),
    }),
  );
}
function createRedBombField(level, v, x, y) {
  return {
    id: id(),
    type: "redBombField",
    active: true,
    level,
    x,
    y,
    radius: v.initialRadius,
    targetRadius: v.maximumRadius,
    duration: v.duration,
    maxDuration: v.duration,
    damage: v.damage,
    damageInterval: v.damageInterval,
    clearsBullets: v.clearsBullets,
    convertsBulletsToScore: v.convertsBulletsToScore,
    scorePerClearedBullet: v.scorePerClearedBullet,
    hitTimersByEnemyId: new Map(),
    clearedBulletCount: 0,
    initialProcessed: false,
  };
}
function convertClearedBulletsToScore(field, count) {
  if (field.convertsBulletsToScore && count > 0) {
    gameState.score += count * field.scorePerClearedBullet;
    spawnText(field.x, field.y - 34, `CLEAR ×${count}`, CONFIG.COLORS.red);
  }
}
function clearEnemyBulletsInField(field, radius = field.radius) {
  let n = 0;
  for (const b of gameState.enemyBullets) {
    if (
      b.active &&
      (b.x - field.x) ** 2 + (b.y - field.y) ** 2 <= (radius + b.radius) ** 2
    ) {
      b.active = false;
      n++;
      spawnParticles(b.x, b.y, CONFIG.COLORS.red, 2);
    }
  }
  field.clearedBulletCount += n;
  convertClearedBulletsToScore(field, n);
  return n;
}
function damageEnemiesInRedField(field, initial = false) {
  const targets = [
    ...gameState.enemies,
    ...(gameState.boss?.active ? [gameState.boss] : []),
  ];
  for (const e of targets) {
    if (!e.active || !overlaps(field, e)) continue;
    const timer = field.hitTimersByEnemyId.get(e.id) ?? 0;
    if (initial || timer <= 0) {
      damageTarget(e, field.damage);
      field.hitTimersByEnemyId.set(e.id, field.damageInterval);
      spawnParticles(e.x, e.y, CONFIG.COLORS.red, 5);
    }
  }
}
function activateRedBomb(captured, v) {
  const p = gameState.player;
  if (!p?.active) return false;
  const x = clamp(
      p.x + v.forwardOffset,
      v.initialRadius,
      CONFIG.WIDTH - v.initialRadius,
    ),
    y = clamp(p.y, v.initialRadius, CONFIG.HEIGHT - v.initialRadius);
  const f = createRedBombField(captured.level, v, x, y);
  gameState.redBombFields.push(f);
  clearEnemyBulletsInField(f, v.initialRadius);
  damageEnemiesInRedField(f, true);
  f.initialProcessed = true;
  gameState.rings.push({
    id: id(),
    active: true,
    x,
    y,
    radius: v.initialRadius,
    target: v.maximumRadius,
    life: 0.55,
    maxLife: 0.55,
    color: CONFIG.COLORS.red,
  });
  spawnText(x, y - 20, `RED BOMB Lv${captured.level}`, CONFIG.COLORS.red);
  gameState.screenShake = Math.max(gameState.screenShake, v.screenShake);
  return true;
}
function useSelectedCapturedBullet() {
  if (gameState.phase !== "playing") return false;
  const c = getSelectedCapturedBullet();
  if (!c?.active) return false;
  const family = CONFIG.COUNTER_TYPES[c.colorType],
    v = family?.levels?.[c.level];
  if (!family || !v || !(c.colorType === "blue" || c.colorType === "red"))
    return false;
  let effect;
  if (c.colorType === "blue") {
    effect = createBlueLance(c, v);
    if (effect) gameState.blueLances.push(effect);
  } else effect = gameState.player?.active ? true : false;
  if (!effect) return false;
  const slot = c.orbitSlot;
  removeCapturedBulletById(c.id);
  if (c.colorType === "red") activateRedBomb(c, v);
  normalizeOrbitSlots();
  normalizeCapturedSelection(slot, c.id);
  gameState.player.recoil = 0.16;
  gameState.screenShake = Math.max(gameState.screenShake, 5);
  gameState.flash = 0.09;
  spawnParticles(
    gameState.player.x + 28,
    gameState.player.y,
    colorValue(c.colorType),
    12,
  );
  return true;
}

function spawnEnemy() {
  const tough = Math.random() < 0.35;
  gameState.enemies.push({
    id: id(),
    active: true,
    kind: tough ? "spreader" : "shooter",
    x: 1010,
    y: 45 + Math.random() * 450,
    radius: tough ? 24 : 18,
    hp: tough ? 30 : 12,
    maxHp: tough ? 30 : 12,
    vx: tough ? -48 : -66,
    phase: Math.random() * 6,
    fire: 0.5 + Math.random(),
    colorFlip: Math.random() < 0.5 ? 0 : 1,
    score: tough ? 650 : 300,
  });
}
function spawnBoss() {
  gameState.boss = {
    id: id(),
    active: true,
    isBoss: true,
    x: 1040,
    y: 270,
    radius: 66,
    hp: CONFIG.ENEMY.bossHp,
    maxHp: CONFIG.ENEMY.bossHp,
    fire: 0.7,
    phase: 0,
  };
}
function spawnEnemyBullet(x, y, vx, vy, colorType) {
  gameState.enemyBullets.push({
    id: id(),
    active: true,
    x,
    y,
    vx,
    vy,
    radius: 6,
    colorType,
  });
}
function fireAtPlayer(e, count = 1, spread = 0.18) {
  const p = gameState.player;
  if (!p) return;
  const a = Math.atan2(p.y - e.y, p.x - e.x);
  for (let i = 0; i < count; i++) {
    const q = a + (i - (count - 1) / 2) * spread,
      colorType = e.colorFlip++ % 2 ? "red" : "blue";
    spawnEnemyBullet(
      e.x,
      e.y,
      Math.cos(q) * CONFIG.ENEMY.bulletSpeed,
      Math.sin(q) * CONFIG.ENEMY.bulletSpeed,
      colorType,
    );
  }
}
function updatePlayer(dt) {
  const p = gameState.player;
  if (!p?.active) return;
  p.invincibility = Math.max(0, p.invincibility - dt);
  p.recoil = Math.max(0, p.recoil - dt);
  const k = gameState.input.keys;
  gameState.capture.active =
    gameState.input.captureRequested ||
    k.has("ShiftLeft") ||
    k.has("ShiftRight");
  let dx =
      (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0) -
      (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0),
    dy =
      (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0) -
      (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0);
  if (gameState.input.pointerActive && !dx && !dy) {
    const tx = gameState.input.pointerX,
      ty = gameState.input.pointerY;
    dx = clamp((tx - p.x) / 35, -1, 1);
    dy = clamp((ty - p.y) / 35, -1, 1);
  }
  const l = Math.hypot(dx, dy) || 1,
    speed = gameState.capture.active
      ? CONFIG.PLAYER.captureSpeed
      : CONFIG.PLAYER.speed;
  p.x = clamp(p.x + (dx / l) * speed * dt, 25, 935);
  p.y = clamp(p.y + (dy / l) * speed * dt, 25, 515);
  gameState.shotTimer -= dt;
  if (gameState.shotTimer <= 0) {
    gameState.shotTimer = CONFIG.PLAYER.fireInterval;
    gameState.playerBullets.push({
      id: id(),
      active: true,
      x: p.x + 24,
      y: p.y,
      vx: CONFIG.PLAYER.shotSpeed,
      radius: 3,
      damage: CONFIG.PLAYER.shotDamage,
    });
  }
}
function updateSpawning(dt) {
  if (!gameState.boss && gameState.time >= CONFIG.BOSS_TIME) {
    spawnBoss();
    return;
  }
  if (gameState.boss) return;
  gameState.spawnTimer -= dt;
  if (gameState.spawnTimer <= 0) {
    spawnEnemy();
    const t = clamp(gameState.time / CONFIG.BOSS_TIME, 0, 1);
    gameState.spawnTimer =
      CONFIG.ENEMY.spawnEarly +
      (CONFIG.ENEMY.spawnLate - CONFIG.ENEMY.spawnEarly) * t;
  }
}
function updateEnemies(dt) {
  for (const e of gameState.enemies) {
    e.x += e.vx * dt;
    e.phase += dt;
    e.y += Math.sin(e.phase * 1.6) * 24 * dt;
    e.fire -= dt;
    if (e.fire <= 0) {
      fireAtPlayer(e, e.kind === "spreader" ? 3 : 1);
      e.fire = e.kind === "spreader" ? 1.65 : 1.35;
    }
    if (e.x < -50) e.active = false;
    if (e.active && overlaps(e, gameState.player)) {
      damagePlayer();
      e.active = false;
    }
  }
  const b = gameState.boss;
  if (b?.active) {
    b.phase += dt;
    if (b.x > 820) b.x -= 80 * dt;
    b.y = 270 + Math.sin(b.phase * 0.9) * 145;
    b.fire -= dt;
    if (b.fire <= 0) {
      fireAtPlayer(b, 7, 0.12);
      b.fire = 0.65;
    }
    if (overlaps(b, gameState.player)) damagePlayer();
  }
}
function updateEnemyBullets(dt) {
  const p = gameState.player;
  for (const b of gameState.enemyBullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x < -30 || b.x > 990 || b.y < -30 || b.y > 570) b.active = false;
    if (!b.active) continue;
    if (
      gameState.capture.active &&
      getActiveCapturedBullets().length < CONFIG.MAX_CAPTURE_SLOTS
    ) {
      const cx = p.x + CONFIG.CAPTURE.offsetX;
      if ((b.x - cx) ** 2 + (b.y - p.y) ** 2 <= CONFIG.CAPTURE.radius ** 2) {
        b.active = false;
        createCapturedBullet(b.colorType);
        gameState.score += CONFIG.CAPTURE.score;
        spawnParticles(b.x, b.y, colorValue(b.colorType), 7);
        continue;
      }
    }
    if (overlaps(b, { ...p, radius: CONFIG.PLAYER.hitbox })) {
      b.active = false;
      damagePlayer();
    }
    for (const c of getActiveCapturedBullets()) {
      if (b.active && overlaps(b, c)) {
        b.active = false;
        c.active = false;
        spawnParticles(c.x, c.y, colorValue(c.colorType), 8);
        normalizeOrbitSlots();
        normalizeCapturedSelection(c.orbitSlot, c.id);
      }
    }
  }
}
function updateCapturedBullets(dt) {
  const a = getActiveCapturedBullets(),
    p = gameState.player;
  a.forEach((c, i) => {
    c.mergeProtection = Math.max(0, c.mergeProtection - dt);
    c.orbitSlot = i;
    const angle =
      gameState.time * CONFIG.CAPTURE.orbitSpeed +
      (i * CONFIG.TAU) / Math.max(1, a.length);
    c.x = p.x + Math.cos(angle) * CONFIG.CAPTURE.orbitRadius;
    c.y = p.y + Math.sin(angle) * CONFIG.CAPTURE.orbitRadius;
  });
  queueMerges();
  processMergeQueue();
}
function queueMerges() {
  const a = getActiveCapturedBullets();
  for (let i = 0; i < a.length; i++)
    for (let j = i + 1; j < a.length; j++) {
      const x = a[i],
        y = a[j];
      if (
        x.level >= CONFIG.MAX_CAPTURE_LEVEL ||
        x.mergeProtection > 0 ||
        y.mergeProtection > 0 ||
        x.colorType !== y.colorType ||
        x.level !== y.level ||
        gameState.mergingCapturedIds.has(x.id) ||
        gameState.mergingCapturedIds.has(y.id)
      )
        continue;
      gameState.mergingCapturedIds.add(x.id);
      gameState.mergingCapturedIds.add(y.id);
      gameState.mergeQueue.push({
        a: x.id,
        b: y.id,
        selected:
          gameState.selectedCapturedId === x.id ||
          gameState.selectedCapturedId === y.id,
      });
    }
}
function processMergeQueue() {
  for (const m of gameState.mergeQueue) {
    const a = gameState.capturedBullets.find((c) => c.active && c.id === m.a),
      b = gameState.capturedBullets.find((c) => c.active && c.id === m.b);
    if (
      a &&
      b &&
      a.colorType === b.colorType &&
      a.level === b.level &&
      a.level < CONFIG.MAX_CAPTURE_LEVEL
    ) {
      const slot = Math.min(a.orbitSlot, b.orbitSlot);
      a.active = b.active = false;
      const n = createCapturedBullet(
        a.colorType,
        a.level + 1,
        CONFIG.CAPTURE.mergeProtection,
      );
      if (n) {
        n.orbitSlot = slot;
        if (m.selected) gameState.selectedCapturedId = n.id;
        gameState.score += 150 * n.level;
        spawnText(
          (a.x + b.x) / 2,
          (a.y + b.y) / 2,
          `MERGE Lv${n.level}`,
          colorValue(n.colorType),
        );
      }
    }
    gameState.mergingCapturedIds.delete(m.a);
    gameState.mergingCapturedIds.delete(m.b);
  }
  gameState.mergeQueue = [];
  normalizeOrbitSlots();
  normalizeCapturedSelection();
}
function damageTarget(e, amount) {
  e.hp -= amount;
  if (e.hp <= 0) {
    e.active = false;
    gameState.score += e.isBoss ? 10000 : e.score;
    spawnParticles(e.x, e.y, CONFIG.COLORS.white, e.isBoss ? 50 : 18);
    if (e.isBoss) endGame(true);
  }
}
function damagePlayer() {
  const p = gameState.player;
  if (!p?.active || p.invincibility > 0) return;
  p.hp--;
  p.invincibility = CONFIG.PLAYER.invincibility;
  gameState.screenShake = 11;
  spawnParticles(p.x, p.y, CONFIG.COLORS.red, 18);
  if (p.hp <= 0) {
    p.active = false;
    endGame(false);
  }
}
function checkBlueLanceCollisions(l) {
  const targets = [
    ...gameState.enemies,
    ...(gameState.boss?.active ? [gameState.boss] : []),
  ];
  for (const e of targets) {
    if (!l.active || !e.active || l.alreadyHitIds.has(e.id) || !overlaps(l, e))
      continue;
    damageTarget(e, l.damage * (e.isBoss ? l.bossDamageMultiplier : 1));
    l.alreadyHitIds.add(e.id);
    l.penetrationRemaining--;
    spawnParticles(l.x, l.y, CONFIG.COLORS.blue, 8);
    if (l.level === 3) createBlueNeedles(l, e.x, e.y);
    if (l.penetrationRemaining < 0) l.active = false;
  }
  const v = CONFIG.COUNTER_TYPES.blue.levels[l.level];
  if (v.bulletClearWidth > 0)
    for (const b of gameState.enemyBullets) {
      if (
        b.active &&
        Math.abs(b.y - l.y) <= v.bulletClearWidth + b.radius &&
        b.x >= l.x - v.trailLength &&
        b.x <= l.x + l.radius * 2
      ) {
        b.active = false;
        spawnParticles(b.x, b.y, CONFIG.COLORS.blue, 2);
      }
    }
}
function updateBlueLances(dt) {
  for (const l of gameState.blueLances) {
    l.x += l.vx * dt;
    l.y += l.vy * dt;
    l.lifetime = Math.max(0, l.lifetime - dt);
    if (!l.lifetime || l.x > 1080) l.active = false;
    if (l.active) checkBlueLanceCollisions(l);
  }
}
function checkBlueNeedleCollisions(n) {
  for (const e of [
    ...gameState.enemies,
    ...(gameState.boss?.active ? [gameState.boss] : []),
  ])
    if (n.active && e.active && !n.alreadyHitIds.has(e.id) && overlaps(n, e)) {
      n.alreadyHitIds.add(e.id);
      damageTarget(e, n.damage);
      n.active = false;
      spawnParticles(n.x, n.y, CONFIG.COLORS.blue, 4);
    }
}
function updateBlueNeedles(dt) {
  for (const n of gameState.blueNeedles) {
    n.x += n.vx * dt;
    n.y += n.vy * dt;
    n.lifetime = Math.max(0, n.lifetime - dt);
    if (!n.lifetime || n.x > 1000 || n.y < 0 || n.y > 540) n.active = false;
    if (n.active) checkBlueNeedleCollisions(n);
  }
}
function updateRedBombFields(dt) {
  const activeEnemyIds = new Set(
    [...gameState.enemies, ...(gameState.boss?.active ? [gameState.boss] : [])]
      .filter((e) => e.active)
      .map((e) => e.id),
  );
  for (const f of gameState.redBombFields) {
    const v = CONFIG.COUNTER_TYPES.red.levels[f.level];
    f.duration = Math.max(0, f.duration - dt);
    const elapsed = f.maxDuration - f.duration,
      expand = clamp(elapsed / v.expansionTime, 0, 1),
      fade = v.fadeTime ? clamp(f.duration / v.fadeTime, 0, 1) : 1;
    f.radius = v.initialRadius + (f.targetRadius - v.initialRadius) * expand;
    if (f.level === 4) f.radius *= 0.72 + 0.28 * fade;
    for (const [eid, t] of f.hitTimersByEnemyId) {
      if (!activeEnemyIds.has(eid)) f.hitTimersByEnemyId.delete(eid);
      else f.hitTimersByEnemyId.set(eid, Math.max(0, t - dt));
    }
    if (f.clearsBullets) clearEnemyBulletsInField(f);
    damageEnemiesInRedField(f);
    if (!f.duration) f.active = false;
  }
}
function updatePlayerBullets(dt) {
  for (const s of gameState.playerBullets) {
    s.x += s.vx * dt;
    if (s.x > 990) s.active = false;
    for (const e of [
      ...gameState.enemies,
      ...(gameState.boss?.active ? [gameState.boss] : []),
    ])
      if (s.active && e.active && overlaps(s, e)) {
        damageTarget(e, s.damage);
        s.active = false;
      }
  }
}
function updateEffects(dt) {
  for (const p of gameState.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life = Math.max(0, p.life - dt);
    p.active = p.life > 0;
  }
  for (const r of gameState.rings) {
    r.life = Math.max(0, r.life - dt);
    r.radius += (r.target - r.radius) * 8 * dt;
    r.active = r.life > 0;
  }
  for (const t of gameState.texts) {
    t.y -= 28 * dt;
    t.life = Math.max(0, t.life - dt);
    t.active = t.life > 0;
  }
  gameState.screenShake = Math.max(0, gameState.screenShake - 28 * dt);
  gameState.flash = Math.max(0, gameState.flash - dt);
}
function spawnParticles(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * CONFIG.TAU,
      s = 35 + Math.random() * 170;
    gameState.particles.push({
      id: id(),
      active: true,
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 0.25 + Math.random() * 0.45,
      maxLife: 0.7,
      color,
      size: 1 + Math.random() * 3,
    });
  }
}
function spawnText(x, y, text, color) {
  gameState.texts.push({
    id: id(),
    active: true,
    x,
    y,
    text,
    color,
    life: 1,
    maxLife: 1,
  });
}
function cleanup() {
  [
    "enemies",
    "enemyBullets",
    "playerBullets",
    "capturedBullets",
    "blueLances",
    "blueNeedles",
    "redBombFields",
    "particles",
    "rings",
    "texts",
  ].forEach((k) => (gameState[k] = gameState[k].filter((e) => e?.active)));
  normalizeOrbitSlots();
  normalizeCapturedSelection();
  for (const x of [...gameState.mergingCapturedIds])
    if (!gameState.capturedBullets.some((c) => c.id === x))
      gameState.mergingCapturedIds.delete(x);
}
function processInput() {
  if (gameState.input.previousRequested) selectPreviousCaptured();
  if (gameState.input.nextRequested) selectNextCaptured();
  if (gameState.input.slotRequested !== null)
    selectCapturedBySlot(gameState.input.slotRequested);
  if (gameState.input.useRequested) useSelectedCapturedBullet();
  Object.assign(gameState.input, {
    previousRequested: false,
    nextRequested: false,
    slotRequested: null,
    useRequested: false,
  });
}
function update(dt) {
  if (gameState.phase !== "playing") return;
  gameState.time += dt;
  processInput();
  updatePlayer(dt);
  updateSpawning(dt);
  updateEnemies(dt);
  updatePlayerBullets(dt);
  updateEnemyBullets(dt);
  updateCapturedBullets(dt);
  updateBlueLances(dt);
  updateBlueNeedles(dt);
  updateRedBombFields(dt);
  updateEffects(dt);
  cleanup();
  syncHud();
}
function endGame(won) {
  if (gameState.phase !== "playing") return;
  gameState.phase = "gameover";
  gameState.dom["result-kicker"].textContent = won
    ? "MISSION COMPLETE"
    : "SIGNAL LOST";
  gameState.dom["result-title"].textContent = won
    ? "FORTRESS SHATTERED"
    : "WING DESTROYED";
  gameState.dom["final-score"].textContent = String(gameState.score).padStart(
    6,
    "0",
  );
  gameState.dom["result-overlay"].classList.remove("hidden");
}

function syncSelectedCounterHud() {
  const s = getSelectedCapturedBullet(),
    a = getActiveCapturedBullets();
  if (!s) {
    gameState.dom["selected-slot"].textContent = "0 / 0";
    gameState.dom["selected-color-level"].textContent = "EMPTY";
    gameState.dom["selected-family"].textContent = "CAPTURE ENEMY FIRE";
    gameState.dom["selected-effect"].textContent = "Q / E TO SELECT";
    return;
  }
  const f = CONFIG.COUNTER_TYPES[s.colorType],
    v = f?.levels[s.level],
    i = a.findIndex((c) => c.id === s.id);
  gameState.dom["selected-slot"].textContent = `${i + 1} / ${a.length}`;
  gameState.dom["selected-color-level"].textContent =
    `${s.colorType.toUpperCase()} Lv${s.level}`;
  gameState.dom["selected-family"].textContent = f?.name || "INVALID";
  gameState.dom["selected-effect"].textContent =
    v?.description || "CONFIG ERROR";
}
function syncHud() {
  const a = getActiveCapturedBullets(),
    p = gameState.player,
    set = (k, v) => (gameState.dom[k].textContent = v);
  set("score", String(gameState.score).padStart(6, "0"));
  set("hp", p ? "◆ ".repeat(Math.max(0, p.hp)).trim() : "—");
  set(
    "stage-time",
    `${String(Math.floor(gameState.time / 60)).padStart(2, "0")}:${String(Math.floor(gameState.time % 60)).padStart(2, "0")}`,
  );
  set("captured-count", a.length);
  set(
    "highest-level",
    a.length ? `Lv${Math.max(...a.map((c) => c.level))}` : "—",
  );
  set("blue-count", a.filter((c) => c.colorType === "blue").length);
  set("red-count", a.filter((c) => c.colorType === "red").length);
  syncSelectedCounterHud();
  const b = gameState.boss;
  gameState.dom["boss-hud"].classList.toggle("hidden", !b?.active);
  if (b) {
    const q = clamp(b.hp / b.maxHp, 0, 1);
    set("boss-health-text", `${Math.ceil(q * 100)}%`);
    gameState.dom["boss-health-fill"].style.width = `${q * 100}%`;
  }
}
function renderBackground(ctx) {
  ctx.fillStyle = "#030615";
  ctx.fillRect(0, 0, 960, 540);
  ctx.strokeStyle = "#102a55";
  ctx.lineWidth = 1;
  const scroll = (gameState.time * 35) % 48;
  for (let x = -scroll; x < 960; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 540);
    ctx.stroke();
  }
  for (let y = 0; y < 540; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(960, y);
    ctx.stroke();
  }
  for (const s of gameState.stars) {
    const x = (s.x - ((gameState.time * s.d) % 1040) + 1040) % 1040;
    ctx.fillStyle = `rgba(140,210,255,${s.s / 2})`;
    ctx.fillRect(x, s.y, s.s, s.s);
  }
}
function renderPlayer(ctx) {
  const p = gameState.player;
  if (!p?.active) return;
  ctx.save();
  ctx.translate(p.x - (p.recoil ? 7 : 0), p.y);
  if (p.invincibility && Math.floor(p.invincibility * 12) % 2)
    ctx.globalAlpha = 0.35;
  ctx.shadowBlur = 16;
  ctx.shadowColor = CONFIG.COLORS.blue;
  ctx.fillStyle = CONFIG.COLORS.blue;
  ctx.beginPath();
  ctx.moveTo(24, 0);
  ctx.lineTo(-15, -13);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-15, 13);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = CONFIG.COLORS.white;
  ctx.fillRect(-4, -3, 20, 6);
  ctx.restore();
}
function renderCaptureField(ctx) {
  if (!gameState.capture.active || !gameState.player?.active) return;
  const p = gameState.player,
    x = p.x + CONFIG.CAPTURE.offsetX;
  ctx.save();
  ctx.strokeStyle = CONFIG.COLORS.blue;
  ctx.shadowBlur = 13;
  ctx.shadowColor = CONFIG.COLORS.blue;
  ctx.globalAlpha = 0.65;
  ctx.setLineDash([5, 6]);
  ctx.beginPath();
  ctx.arc(x, p.y, CONFIG.CAPTURE.radius, 0, CONFIG.TAU);
  ctx.stroke();
  ctx.restore();
}
function renderSelectedCapturedMarker(ctx, c) {
  const pulse = 1 + Math.sin(gameState.time * 8) * 0.1,
    r = c.radius + 9;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.strokeStyle = CONFIG.COLORS.white;
  ctx.shadowColor = CONFIG.COLORS.white;
  ctx.shadowBlur = 16;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r * pulse, 0, CONFIG.TAU);
  ctx.stroke();
  ctx.rotate(gameState.time * 2.4);
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(r + 4, -5);
    ctx.lineTo(r + 4, 5);
    ctx.lineTo(r + 10, 5);
    ctx.stroke();
  }
  ctx.rotate(-gameState.time * 2.4);
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = CONFIG.COLORS.white;
  ctx.fillText(`${c.colorType.toUpperCase()} Lv${c.level}`, 0, -r - 8);
  ctx.restore();
}
function renderCaptured(ctx) {
  for (const c of getActiveCapturedBullets()) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.shadowBlur = 14;
    ctx.shadowColor = colorValue(c.colorType);
    ctx.fillStyle = colorValue(c.colorType);
    ctx.beginPath();
    ctx.arc(0, 0, c.radius, 0, CONFIG.TAU);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-2, -2, Math.max(2, c.radius * 0.35), 0, CONFIG.TAU);
    ctx.fill();
    ctx.fillStyle = "#061021";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText(c.level, 0, 3);
    ctx.restore();
    if (c.id === gameState.selectedCapturedId)
      renderSelectedCapturedMarker(ctx, c);
  }
}
function renderBlueLance(ctx, l) {
  const v = CONFIG.COUNTER_TYPES.blue.levels[l.level];
  ctx.save();
  ctx.translate(l.x, l.y);
  ctx.shadowBlur = l.level === 4 ? 20 : 12;
  ctx.shadowColor = CONFIG.COLORS.blue;
  const g = ctx.createLinearGradient(-v.trailLength, 0, 10, 0);
  g.addColorStop(0, "transparent");
  g.addColorStop(1, CONFIG.COLORS.blue);
  ctx.strokeStyle = g;
  ctx.lineWidth = v.trailWidth;
  ctx.beginPath();
  ctx.moveTo(-v.trailLength, 0);
  ctx.lineTo(0, 0);
  ctx.stroke();
  ctx.fillStyle = CONFIG.COLORS.blue;
  ctx.beginPath();
  ctx.moveTo(l.radius * 2.8, 0);
  ctx.lineTo(-l.radius, -l.radius);
  ctx.lineTo(-l.radius * 0.25, 0);
  ctx.lineTo(-l.radius, l.radius);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillRect(-l.radius, -2, l.radius * 2.7, 4);
  ctx.restore();
}
function renderBlueNeedle(ctx, n) {
  ctx.save();
  ctx.strokeStyle = CONFIG.COLORS.blue;
  ctx.shadowBlur = 8;
  ctx.shadowColor = CONFIG.COLORS.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(n.x - n.vx * 0.035, n.y - n.vy * 0.035);
  ctx.lineTo(n.x, n.y);
  ctx.stroke();
  ctx.restore();
}
function renderRedBombField(ctx, f) {
  const v = CONFIG.COUNTER_TYPES.red.levels[f.level],
    alpha = clamp(f.duration / v.fadeTime, 0, 1),
    pulse = Math.sin(gameState.time * v.pulseSpeed) * v.pulseAmount;
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.globalAlpha = 0.12 * alpha;
  ctx.fillStyle = CONFIG.COLORS.red;
  ctx.beginPath();
  ctx.arc(0, 0, f.radius + pulse, 0, CONFIG.TAU);
  ctx.fill();
  ctx.globalAlpha = 0.65 * alpha;
  ctx.strokeStyle = CONFIG.COLORS.red;
  ctx.shadowBlur = 15;
  ctx.shadowColor = CONFIG.COLORS.red;
  ctx.lineWidth = f.level === 4 ? 3 : 2;
  ctx.beginPath();
  ctx.arc(0, 0, f.radius + pulse, 0, CONFIG.TAU);
  ctx.stroke();
  ctx.globalAlpha = 0.22 * alpha;
  for (let r = 24; r < f.radius; r += 24) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, CONFIG.TAU);
    ctx.stroke();
  }
  if (f.level === 4) {
    ctx.setLineDash([4, 8]);
    for (let x = -f.radius; x < f.radius; x += 22) {
      const h = Math.sqrt(Math.max(0, f.radius * f.radius - x * x));
      ctx.beginPath();
      ctx.moveTo(x, -h);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  }
  ctx.restore();
}
function renderWorld(ctx) {
  renderBackground(ctx);
  for (const b of gameState.enemyBullets) {
    ctx.fillStyle = colorValue(b.colorType);
    ctx.shadowColor = colorValue(b.colorType);
    ctx.shadowBlur = 9;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, CONFIG.TAU);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  for (const s of gameState.playerBullets) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(s.x - 5, s.y - 1, 10, 2);
  }
  for (const e of gameState.enemies) renderEnemy(ctx, e);
  if (gameState.boss?.active) renderEnemy(ctx, gameState.boss);
  for (const f of gameState.redBombFields) renderRedBombField(ctx, f);
  for (const l of gameState.blueLances) renderBlueLance(ctx, l);
  for (const n of gameState.blueNeedles) renderBlueNeedle(ctx, n);
  renderPlayer(ctx);
  renderCaptureField(ctx);
  renderCaptured(ctx);
  for (const r of gameState.rings) {
    ctx.globalAlpha = r.life / r.maxLife;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, CONFIG.TAU);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (const p of gameState.particles) {
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "center";
  ctx.font = "bold 13px monospace";
  for (const t of gameState.texts) {
    ctx.globalAlpha = t.life / t.maxLife;
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}
function renderEnemy(ctx, e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.strokeStyle = e.isBoss
    ? CONFIG.COLORS.red
    : e.kind === "spreader"
      ? CONFIG.COLORS.red
      : CONFIG.COLORS.blue;
  ctx.fillStyle = "#111b3c";
  ctx.shadowBlur = 12;
  ctx.shadowColor = ctx.strokeStyle;
  ctx.lineWidth = e.isBoss ? 5 : 3;
  const sides = e.isBoss ? 8 : 6;
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = (i * CONFIG.TAU) / sides,
      r = e.radius * (i % 2 ? 0.78 : 1),
      x = Math.cos(a) * r,
      y = Math.sin(a) * r;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(0, 0, e.isBoss ? 12 : 5, 0, CONFIG.TAU);
  ctx.fill();
  ctx.restore();
}
function renderRedBombFields(ctx) {
  for (const f of gameState.redBombFields) renderRedBombField(ctx, f);
}
function render() {
  const c = gameState.dom["game-canvas"],
    ctx = c.getContext("2d");
  ctx.save();
  if (gameState.screenShake) {
    ctx.translate(
      (Math.random() - 0.5) * gameState.screenShake,
      (Math.random() - 0.5) * gameState.screenShake,
    );
  }
  renderWorld(ctx);
  ctx.restore();
  if (gameState.flash) {
    ctx.fillStyle = `rgba(255,255,255,${gameState.flash * 3})`;
    ctx.fillRect(0, 0, 960, 540);
  }
}
function frame(t) {
  if (!gameState.lastFrame) gameState.lastFrame = t;
  const dt = Math.min(CONFIG.MAX_DELTA, (t - gameState.lastFrame) / 1000);
  gameState.lastFrame = t;
  update(dt);
  render();
  gameState.animationFrame = requestAnimationFrame(frame);
}
function init() {
  cacheDom();
  bindEvents();
  gameState.player = {
    id: 0,
    active: true,
    x: 140,
    y: 270,
    radius: 18,
    hp: 3,
    invincibility: 0,
    recoil: 0,
  };
  gameState.stars = Array.from({ length: 85 }, () => ({
    x: Math.random() * 960,
    y: Math.random() * 540,
    s: 0.4 + Math.random() * 1.8,
    d: 15 + Math.random() * 50,
  }));
  syncHud();
  if (gameState.animationFrame === null)
    gameState.animationFrame = requestAnimationFrame(frame);
}
init();
