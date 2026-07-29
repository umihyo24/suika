"use strict";

const CONFIG = Object.freeze({
  WIDTH: 960,
  HEIGHT: 540,
  MAX_DELTA: 0.034,
  TAU: Math.PI * 2,
  CLEANUP_MARGIN: 120,
  MAX_CAPTURE_LEVEL: 4,
  MAX_CAPTURE_SLOTS: 6,
  BOSS_TIME: 60,
  COLORS: {
    space: "#030615",
    navy: "#07102b",
    cyan: "#40f8ff",
    magenta: "#ff45d4",
    white: "#f4ffff",
    red: "#ff5277",
    yellow: "#ffe86b",
    grid: "#1b4776",
  },
  PLAYER: {
    X: 140,
    Y: 270,
    RADIUS: 18,
    HITBOX: 5,
    HP: 3,
    SPEED: 330,
    CAPTURE_SPEED: 155,
    POINTER_RESPONSE: 12,
    INVINCIBILITY: 1.5,
    FIRE_INTERVAL: 0.18,
    SHOT_SPEED: 680,
    SHOT_RADIUS: 3,
    SHOT_DAMAGE: 2,
    CLEAR_ON_HIT: 72,
  },
  CAPTURE: {
    OFFSET_X: 60,
    RADIUS: 45,
    PULSE_SPEED: 5,
    FULL_FLASH: 0.7,
    FULL_TEXT_COOLDOWN: 0.55,
    SCORE: 25,
  },
  ORBIT: {
    BASE_RADIUS: 37,
    PER_BULLET_RADIUS: 5,
    SPEED: 1.7,
    COLLISION_BASE: 5,
    COLLISION_PER_LEVEL: 2,
    MOVE_PENALTY: 0.075,
    MIN_SPEED_FACTOR: 0.5,
    TRAIL_LENGTH: 0.32,
    FULL_PULSE: 8,
  },
  CAPTURE_LEVELS: {
    1: { RADIUS: 6 },
    2: { RADIUS: 8 },
    3: { RADIUS: 11 },
    4: { RADIUS: 15 },
  },
  MERGE: { PROTECTION: 0.24, SCORE_BASE: 150, RING_LIFE: 0.65 },
  AIM: {
    MAX_VERTICAL_ANGLE: (Math.PI * 70) / 180,
    SMOOTHING: 14,
    GUIDE_LENGTH: 210,
    KEYBOARD_BIAS: 0.3,
    TARGET_MIN: 130,
    TARGET_MAX: 520,
  },
  COUNTER_TYPES: {
    cyan: {
      name: "LANCE",
      levels: {
        1: {
          description: "PRECISION STRIKE",
          speed: 760,
          damage: 18,
          radius: 5,
          penetration: 0,
          bossMultiplier: 1.15,
          lifetime: 1.5,
          clearsBullets: false,
          clearRadius: 0,
          needles: 0,
          needleDamage: 0,
          needleSpeed: 0,
          needleRange: 0,
          needleLifetime: 0,
        },
        2: {
          description: "DOUBLE PIERCE",
          speed: 800,
          damage: 30,
          radius: 6,
          penetration: 1,
          bossMultiplier: 1.2,
          lifetime: 1.6,
          clearsBullets: false,
          clearRadius: 0,
          needles: 0,
          needleDamage: 0,
          needleSpeed: 0,
          needleRange: 0,
          needleLifetime: 0,
        },
        3: {
          description: "PIERCE + NEEDLES",
          speed: 840,
          damage: 48,
          radius: 7,
          penetration: 3,
          bossMultiplier: 1.35,
          lifetime: 1.7,
          clearsBullets: false,
          clearRadius: 0,
          needles: 2,
          needleDamage: 12,
          needleSpeed: 510,
          needleRange: 300,
          needleLifetime: 0.75,
        },
        4: {
          description: "FORTRESS BREAKER",
          speed: 920,
          damage: 88,
          radius: 13,
          penetration: 6,
          bossMultiplier: 1.8,
          lifetime: 1.8,
          clearsBullets: true,
          clearRadius: 14,
          needles: 0,
          needleDamage: 0,
          needleSpeed: 0,
          needleRange: 0,
          needleLifetime: 0,
        },
      },
    },
    magenta: {
      name: "BURST",
      levels: {
        1: {
          description: "POINT BLAST",
          speed: 310,
          damage: 10,
          radius: 9,
          penetration: 0,
          lifetime: 1.25,
          targetTolerance: 16,
          explosionRadius: 54,
          fieldRadius: 54,
          fieldDuration: 0.12,
          fieldDamage: 7,
          damageCooldown: 0.25,
          clearsBullets: true,
          convertsBulletsToScore: false,
          scorePerBullet: 0,
        },
        2: {
          description: "CLEARING FIELD",
          speed: 285,
          damage: 15,
          radius: 11,
          penetration: 0,
          lifetime: 1.5,
          targetTolerance: 18,
          explosionRadius: 82,
          fieldRadius: 78,
          fieldDuration: 1.4,
          fieldDamage: 8,
          damageCooldown: 0.45,
          clearsBullets: true,
          convertsBulletsToScore: false,
          scorePerBullet: 0,
        },
        3: {
          description: "CONVERSION ZONE",
          speed: 260,
          damage: 22,
          radius: 13,
          penetration: 0,
          lifetime: 1.75,
          targetTolerance: 20,
          explosionRadius: 116,
          fieldRadius: 104,
          fieldDuration: 2.1,
          fieldDamage: 11,
          damageCooldown: 0.42,
          clearsBullets: true,
          convertsBulletsToScore: true,
          scorePerBullet: 75,
        },
        4: {
          description: "SANCTUARY FIELD",
          speed: 235,
          damage: 32,
          radius: 16,
          penetration: 0,
          lifetime: 2.1,
          targetTolerance: 24,
          explosionRadius: 150,
          fieldRadius: 142,
          fieldDuration: 5.2,
          fieldDamage: 20,
          damageCooldown: 0.38,
          clearsBullets: true,
          convertsBulletsToScore: true,
          scorePerBullet: 100,
        },
      },
    },
  },
  NEEDLE: { TURN_RATE: 10, RADIUS: 3 },
  ENEMY_BULLET: {
    RADIUS: 6,
    AIM_SPEED: 165,
    SPREAD_SPEED: 155,
    BOSS_SPEED: 175,
  },
  ENEMIES: {
    shooter: {
      RADIUS: 18,
      HP: 12,
      SPEED: 62,
      FIRE_EARLY: 2.2,
      FIRE_LATE: 1.5,
      SCORE: 300,
    },
    spreader: {
      RADIUS: 24,
      HP: 30,
      SPEED: 48,
      FIRE_EARLY: 2.5,
      FIRE_LATE: 1.65,
      SCORE: 650,
      SINE_AMPLITUDE: 62,
      SINE_SPEED: 1.55,
      SPREAD_ANGLE: 0.24,
    },
  },
  SPAWN: {
    EARLY: 2.0,
    MID: 1.45,
    LATE: 0.9,
    INITIAL: 0.5,
    Y_PADDING: 42,
    MIX_CHANCE: 0.48,
    LATE_MIX_CHANCE: 0.62,
  },
  BOSS: {
    NAME: "PRISM FORTRESS",
    RADIUS: 66,
    HP: 1900,
    ENTER_SPEED: 80,
    TARGET_X: 820,
    VERTICAL_SPEED: 55,
    Y_MIN: 105,
    Y_MAX: 435,
    ATTACK_INTERVAL: 1.05,
    PATTERN_DURATION: 6,
    AIM_BURST: 5,
    AIM_SPREAD: 0.07,
    FAN_COUNT: 9,
    FAN_ARC: 1.15,
    LANE_COUNT: 8,
    LANE_GAP: 90,
    LANE_SPEED_X: -145,
    LANE_SPEED_Y: 12,
    SCORE: 12000,
  },
  SCORE: { CLEAR: 20000 },
  PARTICLE: {
    MAX: 500,
    CAPTURE: 10,
    MERGE: 28,
    HIT: 22,
    DESTROY: 24,
    BOSS: 150,
    SPEED: 170,
    LIFE: 0.7,
    DRAG: 0.96,
    SIZE: 3,
  },
  TEXT: { LIFE: 1, RISE: 35 },
  SHAKE: { PLAYER: 11, COUNTER: 5, BOSS: 18, DECAY: 27 },
  BACKGROUND: { STARS: 95, STAR_SPEED: 24, GRID_GAP: 60, GRID_HORIZON: 190 },
  RENDER: { GLOW: 18, FLASH_INTERVAL: 0.09 },
  INPUT: { NO_POINTER: -1 },
  IDS: { START: 1 },
});

const gameState = {
  phase: "start",
  result: null,
  elapsedTime: 0,
  score: 0,
  player: null,
  enemies: [],
  enemyBullets: [],
  playerBullets: [],
  counterProjectiles: [],
  needleProjectiles: [],
  burstFields: [],
  selectedCapturedId: null,
  aim: { x: 1, y: 0, targetX: 0, targetY: 0 },
  capturedBullets: [],
  particles: [],
  floatingTexts: [],
  capture: { active: false, pulse: 0, fullFlash: 0, fullTextCooldown: 0 },
  mergeQueue: [],
  mergingCapturedIds: new Set(),
  boss: null,
  bossSpawned: false,
  spawnTimers: { enemy: 0 },
  input: {
    pointerX: 0,
    pointerY: 0,
    pointerSeen: false,
    pointerId: CONFIG.INPUT.NO_POINTER,
    captureHeld: false,
    counterRequested: false,
    lastVerticalDirection: 0,
    uiPointerHandled: false,
    keys: new Set(),
  },
  screenShake: 0,
  lastTimestamp: 0,
  entityId: CONFIG.IDS.START,
  backgroundOffset: 0,
  stars: [],
  dom: {},
  ctx: null,
  animationFrame: null,
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const random = (a, b) => a + Math.random() * (b - a);
const distSq = (a, b) => {
  const x = a.x - b.x,
    y = a.y - b.y;
  return x * x + y * y;
};
const nextId = () => gameState.entityId++;
const colorOf = (t) => CONFIG.COLORS[t];

function cacheDom() {
  [
    "game-canvas",
    "score",
    "hp",
    "stage-time",
    "captured-count",
    "highest-level",
    "cyan-count",
    "magenta-count",
    "boss-hud",
    "boss-health-text",
    "boss-health-fill",
    "start-overlay",
    "result-overlay",
    "result-kicker",
    "result-title",
    "final-score",
    "start-button",
    "restart-button",
    "selected-color-level",
    "selected-family",
    "selected-effect",
    "selected-slot",
    "select-prev",
    "select-next",
    "throw-button",
  ].forEach((id) => (gameState.dom[id] = document.getElementById(id)));
  const canvas = gameState.dom["game-canvas"];
  gameState.ctx = canvas ? canvas.getContext("2d") : null;
}
function createPlayer() {
  return {
    id: nextId(),
    type: "player",
    active: true,
    x: CONFIG.PLAYER.X,
    y: CONFIG.PLAYER.Y,
    radius: CONFIG.PLAYER.RADIUS,
    hitRadius: CONFIG.PLAYER.HITBOX,
    hp: CONFIG.PLAYER.HP,
    maxHp: CONFIG.PLAYER.HP,
    invincible: 0,
    fireTimer: 0,
  };
}
function createStars() {
  gameState.stars = Array.from({ length: CONFIG.BACKGROUND.STARS }, () => ({
    x: Math.random() * CONFIG.WIDTH,
    y: Math.random() * CONFIG.HEIGHT,
    size: random(0.7, 2.5),
    depth: random(0.25, 1),
  }));
}
function resetGame() {
  gameState.result = null;
  gameState.elapsedTime = 0;
  gameState.score = 0;
  gameState.entityId = CONFIG.IDS.START;
  gameState.player = createPlayer();
  gameState.enemies = [];
  gameState.enemyBullets = [];
  gameState.playerBullets = [];
  gameState.counterProjectiles = [];
  gameState.needleProjectiles = [];
  gameState.burstFields = [];
  gameState.capturedBullets = [];
  gameState.selectedCapturedId = null;
  gameState.aim = {
    x: 1,
    y: 0,
    targetX: CONFIG.PLAYER.X + CONFIG.AIM.GUIDE_LENGTH,
    targetY: CONFIG.PLAYER.Y,
  };
  gameState.particles = [];
  gameState.floatingTexts = [];
  gameState.capture = {
    active: false,
    pulse: 0,
    fullFlash: 0,
    fullTextCooldown: 0,
  };
  gameState.mergeQueue = [];
  gameState.mergingCapturedIds = new Set();
  gameState.boss = null;
  gameState.bossSpawned = false;
  gameState.spawnTimers = { enemy: CONFIG.SPAWN.INITIAL };
  gameState.input = {
    pointerX: CONFIG.PLAYER.X + CONFIG.AIM.GUIDE_LENGTH,
    pointerY: CONFIG.PLAYER.Y,
    pointerSeen: false,
    pointerId: CONFIG.INPUT.NO_POINTER,
    captureHeld: false,
    counterRequested: false,
    lastVerticalDirection: 0,
    uiPointerHandled: false,
    keys: new Set(),
  };
  gameState.screenShake = 0;
  gameState.lastTimestamp = 0;
  gameState.backgroundOffset = 0;
  createStars();
  syncHud();
}
function setPhase(phase) {
  gameState.phase = phase;
  gameState.dom["start-overlay"]?.classList.toggle("hidden", phase !== "start");
  gameState.dom["result-overlay"]?.classList.toggle(
    "hidden",
    phase !== "gameover",
  );
}
function startGame() {
  resetGame();
  setPhase("playing");
}
function restartGame() {
  startGame();
}
function pointerPosition(e) {
  const c = gameState.dom["game-canvas"],
    r = c?.getBoundingClientRect();
  if (!r || r.width <= 0 || r.height <= 0) return;
  gameState.input.pointerX = clamp(
    ((e.clientX - r.left) * CONFIG.WIDTH) / r.width,
    CONFIG.PLAYER.RADIUS,
    CONFIG.WIDTH - CONFIG.PLAYER.RADIUS,
  );
  gameState.input.pointerY = clamp(
    ((e.clientY - r.top) * CONFIG.HEIGHT) / r.height,
    CONFIG.PLAYER.RADIUS,
    CONFIG.HEIGHT - CONFIG.PLAYER.RADIUS,
  );
  gameState.input.pointerSeen = true;
}

function bindEvents() {
  const canvas = gameState.dom["game-canvas"],
    stop = (e) => e.stopPropagation();
  gameState.dom["start-button"]?.addEventListener("pointerdown", stop);
  gameState.dom["restart-button"]?.addEventListener("pointerdown", stop);
  gameState.dom["start-button"]?.addEventListener("click", startGame);
  gameState.dom["restart-button"]?.addEventListener("click", restartGame);
  const uiAction = (action) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    gameState.input.uiPointerHandled = true;
    action();
    queueMicrotask(() => {
      gameState.input.uiPointerHandled = false;
    });
  };
  gameState.dom["select-prev"]?.addEventListener(
    "pointerdown",
    uiAction(selectPreviousCaptured),
  );
  gameState.dom["select-next"]?.addEventListener(
    "pointerdown",
    uiAction(selectNextCaptured),
  );
  gameState.dom["throw-button"]?.addEventListener(
    "pointerdown",
    uiAction(requestCounterThrow),
  );
  canvas?.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas?.addEventListener(
    "wheel",
    (e) => {
      if (gameState.phase !== "playing" || gameState.input.uiPointerHandled)
        return;
      e.preventDefault();
      e.deltaY > 0 ? selectNextCaptured() : selectPreviousCaptured();
    },
    { passive: false },
  );
  canvas?.addEventListener("pointermove", (e) => {
    if (gameState.phase === "playing") pointerPosition(e);
  });
  canvas?.addEventListener("pointerdown", (e) => {
    if (gameState.phase !== "playing" || gameState.input.uiPointerHandled)
      return;
    pointerPosition(e);
    if (e.button === 0) {
      gameState.input.captureHeld = true;
      gameState.input.pointerId = e.pointerId;
      canvas.setPointerCapture(e.pointerId);
    } else if (e.button === 2) requestCounterThrow();
    e.preventDefault();
  });
  const release = (e) => {
    if (e.pointerId === gameState.input.pointerId) {
      gameState.input.pointerId = CONFIG.INPUT.NO_POINTER;
      gameState.input.captureHeld =
        gameState.input.keys.has("ShiftLeft") ||
        gameState.input.keys.has("ShiftRight");
    }
  };
  canvas?.addEventListener("pointerup", release);
  canvas?.addEventListener("pointercancel", release);
  window.addEventListener("keydown", (e) => {
    if (gameState.phase !== "playing") return;
    const movement = [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "ShiftLeft",
      "ShiftRight",
    ];
    if (movement.includes(e.code)) {
      gameState.input.keys.add(e.code);
      if (e.code.startsWith("Shift")) gameState.input.captureHeld = true;
      e.preventDefault();
    }
    if (e.code === "KeyQ" && !e.repeat) selectPreviousCaptured();
    if (e.code === "KeyE" && !e.repeat) selectNextCaptured();
    if (/^Digit[1-6]$/.test(e.code) && !e.repeat)
      selectCapturedBySlot(Number(e.code.at(-1)) - 1);
    if (e.code === "Space") {
      if (!e.repeat) requestCounterThrow();
      e.preventDefault();
    }
  });
  window.addEventListener("keyup", (e) => {
    gameState.input.keys.delete(e.code);
    if (e.code.startsWith("Shift"))
      gameState.input.captureHeld =
        gameState.input.pointerId !== CONFIG.INPUT.NO_POINTER ||
        gameState.input.keys.has("ShiftLeft") ||
        gameState.input.keys.has("ShiftRight");
  });
  window.addEventListener("blur", () => {
    gameState.input.keys.clear();
    gameState.input.captureHeld = false;
    gameState.input.pointerId = CONFIG.INPUT.NO_POINTER;
  });
}

function createEnemy(kind) {
  const d = CONFIG.ENEMIES[kind],
    y = random(CONFIG.SPAWN.Y_PADDING, CONFIG.HEIGHT - CONFIG.SPAWN.Y_PADDING);
  return {
    id: nextId(),
    type: "enemy",
    kind,
    active: true,
    x: CONFIG.WIDTH + d.RADIUS,
    y,
    baseY: y,
    radius: d.RADIUS,
    hp: d.HP,
    maxHp: d.HP,
    fireTimer: random(d.FIRE_EARLY * 0.45, d.FIRE_EARLY),
    age: 0,
    colorFlip: nextId() % 2,
  };
}
function createBoss() {
  return {
    id: nextId(),
    type: "boss",
    name: CONFIG.BOSS.NAME,
    active: true,
    x: CONFIG.WIDTH + CONFIG.BOSS.RADIUS,
    y: CONFIG.HEIGHT * 0.5,
    radius: CONFIG.BOSS.RADIUS,
    hp: CONFIG.BOSS.HP,
    maxHp: CONFIG.BOSS.HP,
    entered: false,
    direction: 1,
    attackTimer: CONFIG.BOSS.ATTACK_INTERVAL,
    pattern: 0,
    patternTimer: 0,
    colorFlip: 0,
    age: 0,
  };
}
function createEnemyBullet(x, y, vx, vy, colorType) {
  return {
    id: nextId(),
    type: "enemyBullet",
    active: true,
    x,
    y,
    vx,
    vy,
    radius: CONFIG.ENEMY_BULLET.RADIUS,
    colorType,
    level: 1,
    capturable: true,
  };
}
function createPlayerBullet() {
  const p = gameState.player;
  return {
    id: nextId(),
    type: "playerBullet",
    active: true,
    x: p.x + p.radius,
    y: p.y,
    vx: CONFIG.PLAYER.SHOT_SPEED,
    vy: 0,
    radius: CONFIG.PLAYER.SHOT_RADIUS,
    damage: CONFIG.PLAYER.SHOT_DAMAGE,
  };
}
function createCapturedBullet(colorType, level = 1, protection = 0) {
  return {
    id: nextId(),
    type: "capturedBullet",
    active: true,
    colorType,
    level,
    radius: CONFIG.CAPTURE_LEVELS[level].RADIUS,
    orbitIndex: 0,
    orbitAngle: 0,
    mergeProtectionTimer: protection,
  };
}
function createCounterProjectile(colorType, level, values, behavior) {
  if (!values || !gameState.player) return null;
  const aim = gameState.aim;
  return {
    id: nextId(),
    type: "counterProjectile",
    active: true,
    colorType,
    level,
    x: gameState.player.x + gameState.player.radius,
    y: gameState.player.y,
    vx: aim.x * values.speed,
    vy: aim.y * values.speed,
    radius: values.radius,
    damage: values.damage,
    lifetime: values.lifetime,
    penetrationRemaining: values.penetration,
    alreadyHitIds: new Set(),
    targetX: aim.targetX,
    targetY: aim.targetY,
    behavior,
    values,
    age: 0,
    detonated: false,
  };
}
function createCyanLance(captured, values) {
  return createCounterProjectile("cyan", captured.level, values, "lance");
}
function createMagentaBurst(captured, values) {
  return createCounterProjectile("magenta", captured.level, values, "burst");
}
function orbitRadius() {
  return (
    CONFIG.ORBIT.BASE_RADIUS +
    gameState.capturedBullets.filter((b) => b.active).length *
      CONFIG.ORBIT.PER_BULLET_RADIUS
  );
}
function orbitPosition(c) {
  const count = Math.max(
      1,
      gameState.capturedBullets.filter((b) => b.active).length,
    ),
    angle = c.orbitAngle + (c.orbitIndex / count) * CONFIG.TAU,
    r = orbitRadius();
  return {
    x: gameState.player.x + Math.cos(angle) * r,
    y: gameState.player.y + Math.sin(angle) * r,
  };
}

function getActiveCapturedBullets() {
  return gameState.capturedBullets.filter((c) => c?.active);
}
function getCapturedIndexById(id) {
  return getActiveCapturedBullets().findIndex((c) => c.id === id);
}
function getSelectedCapturedBullet() {
  return (
    getActiveCapturedBullets().find(
      (c) => c.id === gameState.selectedCapturedId,
    ) || null
  );
}
function selectCapturedById(id) {
  if (gameState.phase !== "playing") return false;
  const found = getActiveCapturedBullets().find((c) => c.id === id);
  if (!found) return false;
  gameState.selectedCapturedId = found.id;
  return true;
}
function selectCapturedBySlot(slotIndex) {
  const active = getActiveCapturedBullets();
  return Number.isInteger(slotIndex) &&
    slotIndex >= 0 &&
    slotIndex < active.length
    ? selectCapturedById(active[slotIndex].id)
    : false;
}
function selectNextCaptured() {
  if (gameState.phase !== "playing") return false;
  const active = getActiveCapturedBullets();
  if (!active.length) return false;
  const index = active.findIndex((c) => c.id === gameState.selectedCapturedId);
  return selectCapturedById(
    active[(index + 1 + active.length) % active.length].id,
  );
}
function selectPreviousCaptured() {
  if (gameState.phase !== "playing") return false;
  const active = getActiveCapturedBullets();
  if (!active.length) return false;
  const index = active.findIndex((c) => c.id === gameState.selectedCapturedId);
  return selectCapturedById(
    active[(index <= 0 ? active.length : index) - 1].id,
  );
}
function normalizeCapturedSelection(preferredIndex) {
  const active = getActiveCapturedBullets();
  if (!active.length) {
    gameState.selectedCapturedId = null;
    return null;
  }
  const current = active.find((c) => c.id === gameState.selectedCapturedId);
  if (current) return current;
  const preferred = Number.isInteger(preferredIndex)
    ? clamp(preferredIndex, 0, active.length - 1)
    : 0;
  gameState.selectedCapturedId = (
    active[preferred] ||
    active[Math.max(0, preferred - 1)] ||
    active[0]
  ).id;
  return getSelectedCapturedBullet();
}
function clampAimToForwardCone(x, y) {
  const length = Math.hypot(x, y);
  if (length < 0.0001) return { x: 1, y: 0 };
  const angle = clamp(
    Math.atan2(y, x),
    -CONFIG.AIM.MAX_VERTICAL_ANGLE,
    CONFIG.AIM.MAX_VERTICAL_ANGLE,
  );
  return { x: Math.cos(angle), y: Math.sin(angle) };
}
function updateAim(dt) {
  const p = gameState.player;
  if (!p) return;
  let dx, dy, distance;
  if (gameState.input.pointerSeen) {
    dx = gameState.input.pointerX - p.x;
    dy = gameState.input.pointerY - p.y;
    distance = Math.hypot(dx, dy);
  } else {
    dx = 1;
    dy = gameState.input.lastVerticalDirection * CONFIG.AIM.KEYBOARD_BIAS;
    distance = CONFIG.AIM.GUIDE_LENGTH;
  }
  const desired = clampAimToForwardCone(dx, dy),
    blend = clamp(CONFIG.AIM.SMOOTHING * dt, 0, 1);
  const mixed = clampAimToForwardCone(
    gameState.aim.x + (desired.x - gameState.aim.x) * blend,
    gameState.aim.y + (desired.y - gameState.aim.y) * blend,
  );
  gameState.aim.x = mixed.x;
  gameState.aim.y = mixed.y;
  const range = clamp(
    distance || CONFIG.AIM.GUIDE_LENGTH,
    CONFIG.AIM.TARGET_MIN,
    CONFIG.AIM.TARGET_MAX,
  );
  gameState.aim.targetX = p.x + mixed.x * range;
  gameState.aim.targetY = p.y + mixed.y * range;
}

function updateCounterProjectiles(dt) {
  gameState.counterProjectiles.forEach((p) => {
    if (!p.active) return;
    p.colorType === "cyan"
      ? updateCyanProjectile(p, dt)
      : updateMagentaProjectile(p, dt);
  });
  gameState.playerBullets.forEach((b) => {
    if (b.active) {
      b.x += b.vx * dt;
      deactivateOutside(b);
    }
  });
}
function updateCyanProjectile(p, dt) {
  p.age += dt;
  p.lifetime -= dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  if (p.values.clearsBullets) clearEnemyBulletsAlongLance(p);
  checkCyanProjectileCollisions(p);
  if (p.lifetime <= 0) p.active = false;
  deactivateOutside(p);
}
function updateMagentaProjectile(p, dt) {
  p.age += dt;
  p.lifetime -= dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  checkMagentaProjectileCollisions(p);
  if (
    p.active &&
    (p.lifetime <= 0 ||
      Math.hypot(p.targetX - p.x, p.targetY - p.y) <=
        p.values.targetTolerance ||
      p.vx * (p.targetX - p.x) + p.vy * (p.targetY - p.y) < 0)
  )
    detonateMagentaProjectile(p);
}
function validTargets() {
  return [
    ...gameState.enemies.filter((e) => e.active),
    ...(gameState.boss?.active ? [gameState.boss] : []),
  ];
}
function checkCyanProjectileCollisions(p) {
  for (const target of validTargets()) {
    if (!p.active || p.alreadyHitIds.has(target.id)) continue;
    if (distSq(p, target) <= (p.radius + target.radius) ** 2) {
      p.alreadyHitIds.add(target.id);
      const amount =
        p.damage * (target.type === "boss" ? p.values.bossMultiplier : 1);
      target.type === "boss" ? damageBoss(amount) : damageEnemy(target, amount);
      spawnParticles(p.x, p.y, CONFIG.COLORS.cyan, 8);
      if (p.values.needles) createCyanNeedles(p, target);
      p.penetrationRemaining--;
      if (p.penetrationRemaining < 0) p.active = false;
    }
  }
}
function checkMagentaProjectileCollisions(p) {
  for (const target of validTargets()) {
    if (p.active && distSq(p, target) <= (p.radius + target.radius) ** 2) {
      detonateMagentaProjectile(p);
      break;
    }
  }
}
function createCyanNeedles(parent, hitTarget) {
  const choices = validTargets()
    .filter(
      (t) =>
        t.id !== hitTarget.id &&
        !parent.alreadyHitIds.has(t.id) &&
        distSq(t, parent) <= parent.values.needleRange ** 2,
    )
    .sort((a, b) => distSq(a, parent) - distSq(b, parent));
  for (let i = 0; i < parent.values.needles; i++) {
    const target = choices[i % choices.length];
    if (!target) break;
    const a =
      Math.atan2(target.y - parent.y, target.x - parent.x) + (i ? 0.08 : -0.08);
    gameState.needleProjectiles.push({
      id: nextId(),
      type: "needleProjectile",
      active: true,
      x: parent.x,
      y: parent.y,
      vx: Math.cos(a) * parent.values.needleSpeed,
      vy: Math.sin(a) * parent.values.needleSpeed,
      radius: CONFIG.NEEDLE.RADIUS,
      damage: parent.values.needleDamage,
      lifetime: parent.values.needleLifetime,
      targetId: target.id,
      alreadyHitIds: new Set(parent.alreadyHitIds),
    });
  }
}
function updateNeedleProjectiles(dt) {
  gameState.needleProjectiles.forEach((n) => {
    if (!n.active) return;
    const target = validTargets().find((t) => t.id === n.targetId);
    if (target) {
      const desired = Math.atan2(target.y - n.y, target.x - n.x),
        current = Math.atan2(n.vy, n.vx),
        delta = Math.atan2(
          Math.sin(desired - current),
          Math.cos(desired - current),
        ),
        angle =
          current +
          clamp(
            delta,
            -CONFIG.NEEDLE.TURN_RATE * dt,
            CONFIG.NEEDLE.TURN_RATE * dt,
          ),
        speed = Math.hypot(n.vx, n.vy);
      n.vx = Math.cos(angle) * speed;
      n.vy = Math.sin(angle) * speed;
    }
    n.x += n.vx * dt;
    n.y += n.vy * dt;
    n.lifetime -= dt;
    for (const t of validTargets()) {
      if (
        n.active &&
        !n.alreadyHitIds.has(t.id) &&
        distSq(n, t) <= (n.radius + t.radius) ** 2
      ) {
        n.alreadyHitIds.add(t.id);
        t.type === "boss" ? damageBoss(n.damage) : damageEnemy(t, n.damage);
        spawnParticles(n.x, n.y, CONFIG.COLORS.cyan, 4);
        n.active = false;
      }
    }
    if (n.lifetime <= 0) n.active = false;
  });
}
function clearEnemyBulletsAlongLance(p) {
  gameState.enemyBullets.forEach((b) => {
    if (!b.active) return;
    const speed = Math.hypot(p.vx, p.vy) || 1,
      nx = p.vx / speed,
      ny = p.vy / speed,
      dx = b.x - p.x,
      dy = b.y - p.y,
      along = dx * nx + dy * ny,
      perp = Math.abs(dx * ny - dy * nx);
    if (
      Math.abs(along) < p.radius * 2.5 &&
      perp < b.radius + p.values.clearRadius
    ) {
      b.active = false;
      spawnParticles(b.x, b.y, CONFIG.COLORS.cyan, 2);
    }
  });
}
function clearEnemyBulletsInRadius(x, y, radius) {
  let cleared = 0;
  const center = { x, y };
  gameState.enemyBullets.forEach((b) => {
    if (b.active && distSq(b, center) <= radius * radius) {
      b.active = false;
      cleared++;
      spawnParticles(b.x, b.y, colorOf(b.colorType), 2);
    }
  });
  return cleared;
}
function clearEnemyBullets(x, y, radius) {
  return clearEnemyBulletsInRadius(x, y, radius);
}
function convertClearedBulletsToScore(count, value) {
  const earned = count * value;
  gameState.score += earned;
  return earned;
}
function createBurstField(p) {
  const v = p.values;
  const field = {
    id: nextId(),
    type: "burstField",
    active: true,
    colorType: "magenta",
    level: p.level,
    x: p.x,
    y: p.y,
    radius: v.fieldRadius,
    duration: v.fieldDuration,
    maxDuration: v.fieldDuration,
    damage: v.fieldDamage,
    clearsBullets: v.clearsBullets,
    convertsBulletsToScore: v.convertsBulletsToScore,
    damageCooldown: v.damageCooldown,
    hitTimersByEnemyId: new Map(),
    scorePerBullet: v.scorePerBullet,
  };
  gameState.burstFields.push(field);
  return field;
}
function detonateMagentaProjectile(p) {
  if (!p.active || p.detonated) return;
  p.detonated = true;
  p.active = false;
  const v = p.values;
  for (const target of validTargets()) {
    if (distSq(p, target) <= v.explosionRadius ** 2) {
      target.type === "boss"
        ? damageBoss(p.damage)
        : damageEnemy(target, p.damage);
    }
  }
  const cleared = clearEnemyBulletsInRadius(p.x, p.y, v.explosionRadius);
  if (v.convertsBulletsToScore)
    convertClearedBulletsToScore(cleared, v.scorePerBullet);
  createBurstField(p);
  spawnRing(p.x, p.y, CONFIG.COLORS.magenta);
  spawnParticles(p.x, p.y, CONFIG.COLORS.magenta, CONFIG.PARTICLE.MERGE);
  addFloatingText(
    p.x,
    p.y,
    v.convertsBulletsToScore ? `CONVERTED ${cleared}` : `BURST ${cleared}`,
    CONFIG.COLORS.magenta,
  );
}
function updateBurstFields(dt) {
  gameState.burstFields.forEach((f) => {
    if (!f.active) return;
    f.duration -= dt;
    if (f.clearsBullets) {
      const cleared = clearEnemyBulletsInRadius(f.x, f.y, f.radius);
      if (f.convertsBulletsToScore && cleared)
        convertClearedBulletsToScore(cleared, f.scorePerBullet);
    }
    for (const [id, time] of f.hitTimersByEnemyId)
      f.hitTimersByEnemyId.set(id, time - dt);
    for (const target of validTargets()) {
      if (distSq(f, target) > (f.radius + target.radius) ** 2) continue;
      const timer = f.hitTimersByEnemyId.get(target.id) ?? 0;
      if (timer <= 0) {
        target.type === "boss"
          ? damageBoss(f.damage)
          : damageEnemy(target, f.damage);
        f.hitTimersByEnemyId.set(target.id, f.damageCooldown);
      }
    }
    if (f.duration <= 0) f.active = false;
  });
}
function update(dt) {
  if (gameState.phase !== "playing") return;
  gameState.elapsedTime += dt;
  gameState.backgroundOffset += CONFIG.BACKGROUND.STAR_SPEED * dt;
  normalizeCapturedSelection();
  updateCaptureState(dt);
  updatePlayer(dt);
  updateAim(dt);
  updatePlayerFiring(dt);
  updateSpawning(dt);
  updateEnemies(dt);
  updateBoss(dt);
  updateEnemyBullets(dt);
  updateCapturedBullets(dt);
  updateCounterProjectiles(dt);
  updateNeedleProjectiles(dt);
  updateBurstFields(dt);
  updateParticles(dt);
  checkCaptureCollisions();
  checkOrbitBulletCollisions();
  checkPlayerCollisions();
  checkPlayerBulletCollisions();
  if (gameState.input.counterRequested) throwSelectedCapturedBullet();
  gameState.input.counterRequested = false;
  findMergePairs();
  processMergeQueue();
  cleanupEntities();
  normalizeCapturedSelection();
  syncHud();
}
function updateCaptureState(dt) {
  gameState.capture.active = gameState.input.captureHeld;
  gameState.capture.pulse += CONFIG.CAPTURE.PULSE_SPEED * dt;
  gameState.capture.fullFlash = Math.max(0, gameState.capture.fullFlash - dt);
  gameState.capture.fullTextCooldown = Math.max(
    0,
    gameState.capture.fullTextCooldown - dt,
  );
}
function updatePlayer(dt) {
  const p = gameState.player;
  if (!p?.active) return;
  p.invincible = Math.max(0, p.invincible - dt);
  let dx = 0,
    dy = 0,
    k = gameState.input.keys;
  if (k.has("ArrowLeft") || k.has("KeyA")) dx--;
  if (k.has("ArrowRight") || k.has("KeyD")) dx++;
  if (k.has("ArrowUp") || k.has("KeyW")) dy--;
  if (k.has("ArrowDown") || k.has("KeyS")) dy++;
  if (dy) gameState.input.lastVerticalDirection = Math.sign(dy);
  const held = getActiveCapturedBullets().length,
    penalty = clamp(
      1 - held * CONFIG.ORBIT.MOVE_PENALTY,
      CONFIG.ORBIT.MIN_SPEED_FACTOR,
      1,
    ),
    base = gameState.capture.active
      ? CONFIG.PLAYER.CAPTURE_SPEED
      : CONFIG.PLAYER.SPEED,
    speed = base * penalty;
  if (dx || dy) {
    const l = Math.hypot(dx, dy);
    p.x += (dx / l) * speed * dt;
    p.y += (dy / l) * speed * dt;
  } else if (gameState.input.pointerSeen) {
    const amount = clamp(
      (CONFIG.PLAYER.POINTER_RESPONSE * dt * speed) / CONFIG.PLAYER.SPEED,
      0,
      1,
    );
    p.x += (gameState.input.pointerX - p.x) * amount;
    p.y += (gameState.input.pointerY - p.y) * amount;
  }
  p.x = clamp(p.x, p.radius, CONFIG.WIDTH - p.radius);
  p.y = clamp(p.y, p.radius, CONFIG.HEIGHT - p.radius);
}
function updatePlayerFiring(dt) {
  const p = gameState.player;
  if (!p) return;
  p.fireTimer -= dt;
  if (p.fireTimer <= 0) {
    gameState.playerBullets.push(createPlayerBullet());
    p.fireTimer = CONFIG.PLAYER.FIRE_INTERVAL;
  }
}
function updateSpawning(dt) {
  if (gameState.elapsedTime >= CONFIG.BOSS_TIME) {
    if (!gameState.bossSpawned) {
      gameState.boss = createBoss();
      gameState.bossSpawned = true;
    }
    return;
  }
  gameState.spawnTimers.enemy -= dt;
  if (gameState.spawnTimers.enemy > 0) return;
  let kind = "shooter";
  if (
    gameState.elapsedTime >= 20 &&
    Math.random() <
      (gameState.elapsedTime >= 45
        ? CONFIG.SPAWN.LATE_MIX_CHANCE
        : CONFIG.SPAWN.MIX_CHANCE)
  )
    kind = "spreader";
  gameState.enemies.push(createEnemy(kind));
  gameState.spawnTimers.enemy =
    gameState.elapsedTime < 20
      ? CONFIG.SPAWN.EARLY
      : gameState.elapsedTime < 45
        ? CONFIG.SPAWN.MID
        : CONFIG.SPAWN.LATE;
}
function fireEnemyPattern(e) {
  const p = gameState.player,
    d = CONFIG.ENEMIES[e.kind],
    color = e.colorFlip++ % 2 ? "magenta" : "cyan",
    aim = Math.atan2(p.y - e.y, p.x - e.x);
  if (e.kind === "shooter")
    gameState.enemyBullets.push(
      createEnemyBullet(
        e.x - e.radius,
        e.y,
        Math.cos(aim) * CONFIG.ENEMY_BULLET.AIM_SPEED,
        Math.sin(aim) * CONFIG.ENEMY_BULLET.AIM_SPEED,
        color,
      ),
    );
  else
    for (let i = -1; i <= 1; i++) {
      const a = aim + i * d.SPREAD_ANGLE;
      gameState.enemyBullets.push(
        createEnemyBullet(
          e.x - e.radius,
          e.y,
          Math.cos(a) * CONFIG.ENEMY_BULLET.SPREAD_SPEED,
          Math.sin(a) * CONFIG.ENEMY_BULLET.SPREAD_SPEED,
          color,
        ),
      );
    }
}
function updateEnemies(dt) {
  gameState.enemies.forEach((e) => {
    if (!e.active) return;
    const d = CONFIG.ENEMIES[e.kind];
    e.age += dt;
    e.x -= d.SPEED * dt;
    if (e.kind === "spreader")
      e.y = e.baseY + Math.sin(e.age * d.SINE_SPEED) * d.SINE_AMPLITUDE;
    e.fireTimer -= dt;
    if (e.fireTimer <= 0) {
      fireEnemyPattern(e);
      e.fireTimer = gameState.elapsedTime >= 45 ? d.FIRE_LATE : d.FIRE_EARLY;
    }
    if (e.x + e.radius < 0) e.active = false;
  });
}
function fireBossPattern(b) {
  const color = b.colorFlip++ % 2 ? "magenta" : "cyan",
    p = gameState.player;
  if (b.pattern === 0) {
    const aim = Math.atan2(p.y - b.y, p.x - b.x);
    for (let i = 0; i < CONFIG.BOSS.AIM_BURST; i++) {
      const a =
        aim + (i - (CONFIG.BOSS.AIM_BURST - 1) / 2) * CONFIG.BOSS.AIM_SPREAD;
      gameState.enemyBullets.push(
        createEnemyBullet(
          b.x - b.radius,
          b.y,
          Math.cos(a) * CONFIG.ENEMY_BULLET.BOSS_SPEED,
          Math.sin(a) * CONFIG.ENEMY_BULLET.BOSS_SPEED,
          i % 2 ? color : color === "cyan" ? "magenta" : "cyan",
        ),
      );
    }
  } else if (b.pattern === 1) {
    for (let i = 0; i < CONFIG.BOSS.FAN_COUNT; i++) {
      const a =
        Math.PI +
        ((i - (CONFIG.BOSS.FAN_COUNT - 1) / 2) * CONFIG.BOSS.FAN_ARC) /
          (CONFIG.BOSS.FAN_COUNT - 1);
      gameState.enemyBullets.push(
        createEnemyBullet(
          b.x - b.radius,
          b.y,
          Math.cos(a) * CONFIG.ENEMY_BULLET.BOSS_SPEED,
          Math.sin(a) * CONFIG.ENEMY_BULLET.BOSS_SPEED,
          i % 2 ? "cyan" : "magenta",
        ),
      );
    }
  } else {
    const gap = clamp(
      p.y,
      CONFIG.BOSS.LANE_GAP,
      CONFIG.HEIGHT - CONFIG.BOSS.LANE_GAP,
    );
    for (let i = 0; i < CONFIG.BOSS.LANE_COUNT; i++) {
      const y = ((i + 0.5) * CONFIG.HEIGHT) / CONFIG.BOSS.LANE_COUNT;
      if (Math.abs(y - gap) < CONFIG.BOSS.LANE_GAP * 0.5) continue;
      const c = i % 2 ? "cyan" : "magenta";
      gameState.enemyBullets.push(
        createEnemyBullet(
          b.x - b.radius,
          y,
          CONFIG.BOSS.LANE_SPEED_X,
          (i % 2 ? 1 : -1) * CONFIG.BOSS.LANE_SPEED_Y,
          c,
        ),
      );
    }
  }
}
function updateBoss(dt) {
  const b = gameState.boss;
  if (!b?.active) return;
  b.age += dt;
  if (!b.entered) {
    b.x -= CONFIG.BOSS.ENTER_SPEED * dt;
    if (b.x <= CONFIG.BOSS.TARGET_X) {
      b.x = CONFIG.BOSS.TARGET_X;
      b.entered = true;
    }
    return;
  }
  b.y += b.direction * CONFIG.BOSS.VERTICAL_SPEED * dt;
  if (b.y < CONFIG.BOSS.Y_MIN || b.y > CONFIG.BOSS.Y_MAX) {
    b.y = clamp(b.y, CONFIG.BOSS.Y_MIN, CONFIG.BOSS.Y_MAX);
    b.direction *= -1;
  }
  b.attackTimer -= dt;
  b.patternTimer += dt;
  if (b.patternTimer >= CONFIG.BOSS.PATTERN_DURATION) {
    b.pattern = (b.pattern + 1) % 3;
    b.patternTimer = 0;
  }
  if (b.attackTimer <= 0) {
    fireBossPattern(b);
    b.attackTimer = CONFIG.BOSS.ATTACK_INTERVAL;
  }
}
function updateEnemyBullets(dt) {
  gameState.enemyBullets.forEach((b) => {
    if (!b.active) return;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    deactivateOutside(b);
  });
}
function updateCapturedBullets(dt) {
  gameState.capturedBullets.forEach((c) => {
    if (!c.active) return;
    c.orbitAngle += CONFIG.ORBIT.SPEED * dt;
    c.mergeProtectionTimer = Math.max(0, c.mergeProtectionTimer - dt);
  });
}

function updateParticles(dt) {
  gameState.particles.forEach((p) => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= CONFIG.PARTICLE.DRAG;
    p.vy *= CONFIG.PARTICLE.DRAG;
    p.life -= dt;
    if (p.ring) p.radius += p.growth * dt;
  });
  gameState.floatingTexts.forEach((t) => {
    t.y -= CONFIG.TEXT.RISE * dt;
    t.life -= dt;
  });
  gameState.screenShake = Math.max(
    0,
    gameState.screenShake - CONFIG.SHAKE.DECAY * dt,
  );
}
function deactivateOutside(b) {
  if (
    b.x < -CONFIG.CLEANUP_MARGIN ||
    b.x > CONFIG.WIDTH + CONFIG.CLEANUP_MARGIN ||
    b.y < -CONFIG.CLEANUP_MARGIN ||
    b.y > CONFIG.HEIGHT + CONFIG.CLEANUP_MARGIN
  )
    b.active = false;
}

function checkCaptureCollisions() {
  if (!gameState.capture.active) return;
  const p = gameState.player,
    field = { x: p.x + CONFIG.CAPTURE.OFFSET_X, y: p.y };
  gameState.enemyBullets.forEach((b) => {
    if (!b?.active || !b.capturable) return;
    const r = b.radius + CONFIG.CAPTURE.RADIUS;
    if (distSq(b, field) > r * r) return;
    if (getActiveCapturedBullets().length >= CONFIG.MAX_CAPTURE_SLOTS) {
      gameState.capture.fullFlash = CONFIG.CAPTURE.FULL_FLASH;
      if (gameState.capture.fullTextCooldown <= 0) {
        addFloatingText(p.x, p.y - orbitRadius(), "FULL", CONFIG.COLORS.red);
        gameState.capture.fullTextCooldown = CONFIG.CAPTURE.FULL_TEXT_COOLDOWN;
      }
      return;
    }
    b.active = false;
    const captured = createCapturedBullet(b.colorType, b.level);
    gameState.capturedBullets.push(captured);
    if (gameState.selectedCapturedId === null)
      gameState.selectedCapturedId = captured.id;
    gameState.score += CONFIG.CAPTURE.SCORE;
    spawnParticles(b.x, b.y, colorOf(b.colorType), CONFIG.PARTICLE.CAPTURE);
    normalizeOrbitSlots();
  });
}
function checkOrbitBulletCollisions() {
  const captured = getActiveCapturedBullets();
  gameState.enemyBullets.forEach((b) => {
    if (!b.active) return;
    for (const c of captured) {
      if (!c.active) continue;
      const pos = orbitPosition(c),
        r =
          b.radius +
          CONFIG.ORBIT.COLLISION_BASE +
          c.level * CONFIG.ORBIT.COLLISION_PER_LEVEL;
      if (distSq(b, pos) <= r * r) {
        const index = getCapturedIndexById(c.id),
          selected = c.id === gameState.selectedCapturedId;
        b.active = false;
        c.active = false;
        spawnParticles(
          pos.x,
          pos.y,
          selected ? CONFIG.COLORS.white : colorOf(c.colorType),
          selected ? CONFIG.PARTICLE.MERGE : CONFIG.PARTICLE.HIT,
        );
        addFloatingText(
          pos.x,
          pos.y,
          selected ? "SELECTED LOST" : "ORBIT LOST",
          CONFIG.COLORS.red,
        );
        normalizeCapturedSelection(index);
        normalizeOrbitSlots();
        break;
      }
    }
  });
}
function checkPlayerCollisions() {
  const p = gameState.player;
  if (!p?.active) return;
  gameState.enemyBullets.forEach((b) => {
    if (!b.active) return;
    const r = b.radius + p.hitRadius;
    if (distSq(b, p) <= r * r) {
      b.active = false;
      damagePlayer();
    }
  });
  gameState.enemies.forEach((e) => {
    if (e.active && distSq(e, p) <= (e.radius + p.hitRadius) ** 2)
      damagePlayer();
  });
  const b = gameState.boss;
  if (b?.active && distSq(b, p) <= (b.radius + p.hitRadius) ** 2)
    damagePlayer();
}
function checkPlayerBulletCollisions() {
  gameState.playerBullets.forEach((s) => {
    if (!s.active) return;
    for (const e of gameState.enemies) {
      if (e.active && distSq(s, e) <= (s.radius + e.radius) ** 2) {
        s.active = false;
        damageEnemy(e, s.damage);
        break;
      }
    }
    const b = gameState.boss;
    if (s.active && b?.active && distSq(s, b) <= (s.radius + b.radius) ** 2) {
      s.active = false;
      damageBoss(s.damage);
    }
  });
}

function findMergePairs() {
  const list = gameState.capturedBullets;
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (
      !a?.active ||
      a.level >= CONFIG.MAX_CAPTURE_LEVEL ||
      a.mergeProtectionTimer > 0 ||
      gameState.mergingCapturedIds.has(a.id)
    )
      continue;
    for (let j = i + 1; j < list.length; j++) {
      const b = list[j];
      if (
        b?.active &&
        b.colorType === a.colorType &&
        b.level === a.level &&
        b.mergeProtectionTimer <= 0 &&
        !gameState.mergingCapturedIds.has(b.id)
      ) {
        enqueueCapturedMerge(a, b);
        break;
      }
    }
  }
}
function enqueueCapturedMerge(a, b) {
  if (
    !a?.active ||
    !b?.active ||
    gameState.mergingCapturedIds.has(a.id) ||
    gameState.mergingCapturedIds.has(b.id)
  )
    return;
  gameState.mergingCapturedIds.add(a.id);
  gameState.mergingCapturedIds.add(b.id);
  gameState.mergeQueue.push({ aId: a.id, bId: b.id });
}
function processMergeQueue() {
  const queue = gameState.mergeQueue.splice(0);
  queue.forEach(mergeCapturedBullets);
}
function mergeCapturedBullets(item) {
  const activeBefore = getActiveCapturedBullets(),
    a = gameState.capturedBullets.find((c) => c?.id === item.aId),
    b = gameState.capturedBullets.find((c) => c?.id === item.bId);
  gameState.mergingCapturedIds.delete(item.aId);
  gameState.mergingCapturedIds.delete(item.bId);
  if (
    !a?.active ||
    !b?.active ||
    a.colorType !== b.colorType ||
    a.level !== b.level ||
    a.level >= CONFIG.MAX_CAPTURE_LEVEL ||
    a.mergeProtectionTimer > 0 ||
    b.mergeProtectionTimer > 0
  )
    return;
  const earlierIndex = Math.min(
      activeBefore.indexOf(a),
      activeBefore.indexOf(b),
    ),
    selectedMerged =
      gameState.selectedCapturedId === a.id ||
      gameState.selectedCapturedId === b.id;
  a.active = false;
  b.active = false;
  const merged = createCapturedBullet(
    a.colorType,
    a.level + 1,
    CONFIG.MERGE.PROTECTION,
  );
  const insertAt = Math.max(0, gameState.capturedBullets.indexOf(a));
  gameState.capturedBullets.splice(insertAt, 0, merged);
  gameState.score += CONFIG.MERGE.SCORE_BASE * merged.level;
  if (selectedMerged) gameState.selectedCapturedId = merged.id;
  const p = gameState.player;
  spawnParticles(p.x, p.y, colorOf(merged.colorType), CONFIG.PARTICLE.MERGE);
  spawnRing(p.x, p.y, colorOf(merged.colorType));
  addFloatingText(
    p.x,
    p.y - orbitRadius(),
    `MERGE LV.${merged.level}`,
    colorOf(merged.colorType),
  );
  normalizeOrbitSlots();
  normalizeCapturedSelection(earlierIndex);
}
function normalizeOrbitSlots() {
  let i = 0;
  gameState.capturedBullets.forEach((c) => {
    if (c.active) c.orbitIndex = i++;
  });
}
function recalculateOrbitSlots() {
  normalizeOrbitSlots();
}
function requestCounterThrow() {
  if (gameState.phase === "playing") gameState.input.counterRequested = true;
}
function requestCounterAttack() {
  requestCounterThrow();
}
function throwSelectedCapturedBullet() {
  if (gameState.phase !== "playing") return false;
  const captured = getSelectedCapturedBullet();
  if (!captured?.active) {
    normalizeCapturedSelection();
    return false;
  }
  const family = CONFIG.COUNTER_TYPES[captured.colorType],
    values = family?.levels?.[captured.level];
  if (!family || !values) return false;
  const oldIndex = getCapturedIndexById(captured.id),
    projectile =
      captured.colorType === "cyan"
        ? createCyanLance(captured, values)
        : createMagentaBurst(captured, values);
  if (!projectile) return false;
  captured.active = false;
  gameState.counterProjectiles.push(projectile);
  normalizeOrbitSlots();
  normalizeCapturedSelection(oldIndex);
  gameState.screenShake = Math.max(gameState.screenShake, CONFIG.SHAKE.COUNTER);
  spawnParticles(
    gameState.player.x + 18,
    gameState.player.y,
    colorOf(captured.colorType),
    CONFIG.PARTICLE.HIT,
  );
  return true;
}
function fireCounterAttack() {
  return throwSelectedCapturedBullet();
}
function damageEnemy(e, amount) {
  if (!e?.active) return;
  e.hp -= amount;
  if (e.hp <= 0) destroyEnemy(e);
}
function destroyEnemy(e) {
  if (!e?.active) return;
  e.active = false;
  gameState.score += CONFIG.ENEMIES[e.kind].SCORE;
  spawnParticles(
    e.x,
    e.y,
    e.kind === "shooter" ? CONFIG.COLORS.cyan : CONFIG.COLORS.magenta,
    CONFIG.PARTICLE.DESTROY,
  );
  addFloatingText(
    e.x,
    e.y,
    `+${CONFIG.ENEMIES[e.kind].SCORE}`,
    CONFIG.COLORS.white,
  );
}
function damageBoss(amount) {
  const b = gameState.boss;
  if (!b?.active) return;
  b.hp -= amount;
  if (b.hp <= 0) triggerClear();
}
function damagePlayer() {
  const p = gameState.player;
  if (!p || p.invincible > 0 || gameState.phase !== "playing") return;
  p.hp--;
  p.invincible = CONFIG.PLAYER.INVINCIBILITY;
  clearEnemyBulletsInRadius(p.x, p.y, CONFIG.PLAYER.CLEAR_ON_HIT);
  const lowest = getActiveCapturedBullets()
    .slice()
    .sort((a, b) => a.level - b.level || a.id - b.id)[0];
  if (lowest) {
    const i = getCapturedIndexById(lowest.id);
    lowest.active = false;
    normalizeCapturedSelection(i);
  }
  normalizeOrbitSlots();
  spawnParticles(p.x, p.y, CONFIG.COLORS.red, CONFIG.PARTICLE.HIT);
  addFloatingText(p.x, p.y, "HULL HIT", CONFIG.COLORS.red);
  gameState.screenShake = CONFIG.SHAKE.PLAYER;
  if (p.hp <= 0) triggerDefeat();
}
function cleanupEntities() {
  gameState.enemies = gameState.enemies.filter((e) => e?.active);
  gameState.enemyBullets = gameState.enemyBullets.filter((e) => e?.active);
  gameState.playerBullets = gameState.playerBullets.filter((e) => e?.active);
  gameState.counterProjectiles = gameState.counterProjectiles.filter(
    (e) => e?.active,
  );
  gameState.needleProjectiles = gameState.needleProjectiles.filter(
    (e) => e?.active,
  );
  gameState.burstFields = gameState.burstFields.filter((e) => e?.active);
  gameState.capturedBullets = gameState.capturedBullets.filter(
    (e) => e?.active,
  );
  gameState.particles = gameState.particles.filter(
    (e) => e?.active !== false && e.life > 0,
  );
  gameState.floatingTexts = gameState.floatingTexts.filter(
    (e) => e?.active !== false && e.life > 0,
  );
  const capturedIds = new Set(gameState.capturedBullets.map((c) => c.id));
  for (const id of gameState.mergingCapturedIds)
    if (!capturedIds.has(id)) gameState.mergingCapturedIds.delete(id);
  const enemyIds = new Set([
    ...gameState.enemies.map((e) => e.id),
    ...(gameState.boss?.active ? [gameState.boss.id] : []),
  ]);
  gameState.burstFields.forEach((f) => {
    for (const id of f.hitTimersByEnemyId.keys())
      if (!enemyIds.has(id)) f.hitTimersByEnemyId.delete(id);
  });
  gameState.mergeQueue.length = 0;
  normalizeOrbitSlots();
  normalizeCapturedSelection();
}
function triggerClear() {
  if (gameState.phase !== "playing") return;
  if (gameState.boss) gameState.boss.active = false;
  gameState.enemyBullets.forEach((b) => (b.active = false));
  gameState.score += CONFIG.SCORE.CLEAR;
  spawnParticles(
    gameState.boss?.x || CONFIG.BOSS.TARGET_X,
    gameState.boss?.y || CONFIG.HEIGHT * 0.5,
    CONFIG.COLORS.white,
    CONFIG.PARTICLE.BOSS,
  );
  gameState.screenShake = CONFIG.SHAKE.BOSS;
  gameState.result = "clear";
  setPhase("gameover");
  syncResult();
}
function triggerDefeat() {
  if (gameState.phase !== "playing") return;
  gameState.result = "defeat";
  setPhase("gameover");
  syncResult();
}
function spawnParticles(x, y, color, count) {
  const n = Math.min(count, CONFIG.PARTICLE.MAX - gameState.particles.length);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * CONFIG.TAU,
      s = random(CONFIG.PARTICLE.SPEED * 0.2, CONFIG.PARTICLE.SPEED);
    gameState.particles.push({
      id: nextId(),
      active: true,
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      color,
      size: random(1, CONFIG.PARTICLE.SIZE),
      life: CONFIG.PARTICLE.LIFE,
      maxLife: CONFIG.PARTICLE.LIFE,
      ring: false,
      radius: 0,
      growth: 0,
    });
  }
}
function spawnRing(x, y, color) {
  gameState.particles.push({
    id: nextId(),
    active: true,
    x,
    y,
    vx: 0,
    vy: 0,
    color,
    size: 2,
    life: CONFIG.MERGE.RING_LIFE,
    maxLife: CONFIG.MERGE.RING_LIFE,
    ring: true,
    radius: 8,
    growth: 95,
  });
}
function addFloatingText(x, y, text, color) {
  gameState.floatingTexts.push({
    id: nextId(),
    active: true,
    x,
    y,
    text,
    color,
    life: CONFIG.TEXT.LIFE,
    maxLife: CONFIG.TEXT.LIFE,
  });
}
function syncSelectedCounterHud() {
  const set = (id, value) => {
      if (gameState.dom[id]) gameState.dom[id].textContent = value;
    },
    selected = getSelectedCapturedBullet(),
    active = getActiveCapturedBullets();
  if (!selected) {
    set("selected-color-level", "EMPTY");
    set("selected-family", "CAPTURE ENEMY FIRE");
    set("selected-effect", "Q / E TO SELECT");
    set("selected-slot", "0 / 0");
    return;
  }
  const family = CONFIG.COUNTER_TYPES[selected.colorType],
    values = family?.levels?.[selected.level];
  set(
    "selected-color-level",
    `${selected.colorType.toUpperCase()} Lv${selected.level}`,
  );
  set("selected-family", family?.name || "UNKNOWN");
  set("selected-effect", values?.description || "UNAVAILABLE");
  set(
    "selected-slot",
    `${active.findIndex((c) => c.id === selected.id) + 1} / ${active.length}`,
  );
}
function syncHud() {
  const set = (id, v) => {
      if (gameState.dom[id]) gameState.dom[id].textContent = v;
    },
    active = getActiveCapturedBullets();
  set("score", String(gameState.score).padStart(6, "0"));
  set("hp", gameState.player ? "◆ ".repeat(gameState.player.hp).trim() : "");
  const seconds = Math.floor(gameState.elapsedTime);
  set(
    "stage-time",
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`,
  );
  set("captured-count", active.length);
  set(
    "highest-level",
    active.length ? `LV.${Math.max(...active.map((c) => c.level))}` : "—",
  );
  set("cyan-count", active.filter((c) => c.colorType === "cyan").length);
  set("magenta-count", active.filter((c) => c.colorType === "magenta").length);
  syncSelectedCounterHud();
  const boss = gameState.boss,
    visible = Boolean(boss?.active);
  gameState.dom["boss-hud"]?.classList.toggle("hidden", !visible);
  if (visible) {
    const pct = clamp(boss.hp / boss.maxHp, 0, 1);
    set("boss-health-text", `${Math.ceil(pct * 100)}%`);
    if (gameState.dom["boss-health-fill"])
      gameState.dom["boss-health-fill"].style.width = `${pct * 100}%`;
  }
}
function syncResult() {
  const clear = gameState.result === "clear";
  gameState.dom["result-kicker"].textContent = clear
    ? "MISSION COMPLETE"
    : "SIGNAL LOST";
  gameState.dom["result-title"].textContent = clear
    ? "FORTRESS SHATTERED"
    : "WING DESTROYED";
  gameState.dom["final-score"].textContent = gameState.score.toLocaleString();
}

function render() {
  const ctx = gameState.ctx;
  if (!ctx) return;
  ctx.save();
  ctx.clearRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
  if (gameState.screenShake > 0)
    ctx.translate(
      random(-gameState.screenShake, gameState.screenShake),
      random(-gameState.screenShake, gameState.screenShake),
    );
  renderBackground(ctx);
  renderCaptureField(ctx);
  renderAimGuide(ctx);
  renderBurstFields(ctx);
  renderPlayerBullets(ctx);
  renderCounterBullets(ctx);
  renderEnemyBullets(ctx);
  renderEnemies(ctx);
  renderBoss(ctx);
  renderCapturedBullets(ctx);
  renderPlayer(ctx);
  renderParticles(ctx);
  renderFloatingTexts(ctx);
  renderBossHealth(ctx);
  ctx.restore();
}
function renderBackground(ctx) {
  ctx.fillStyle = CONFIG.COLORS.space;
  ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
  const g = ctx.createRadialGradient(
    CONFIG.WIDTH * 0.7,
    CONFIG.HEIGHT * 0.3,
    0,
    CONFIG.WIDTH * 0.7,
    CONFIG.HEIGHT * 0.3,
    CONFIG.WIDTH * 0.7,
  );
  g.addColorStop(0, "#172c61");
  g.addColorStop(1, "#03061500");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
  ctx.fillStyle = CONFIG.COLORS.white;
  gameState.stars.forEach((s) => {
    ctx.globalAlpha = 0.25 + s.depth * 0.7;
    const x =
      (s.x - gameState.backgroundOffset * s.depth + CONFIG.WIDTH) %
      CONFIG.WIDTH;
    ctx.fillRect(x, s.y, s.size, s.size);
  });
  ctx.globalAlpha = 0.36;
  ctx.strokeStyle = CONFIG.COLORS.grid;
  const h = CONFIG.BACKGROUND.GRID_HORIZON;
  for (
    let x = -CONFIG.WIDTH;
    x < CONFIG.WIDTH * 2;
    x += CONFIG.BACKGROUND.GRID_GAP
  ) {
    ctx.beginPath();
    ctx.moveTo(CONFIG.WIDTH * 0.5, h);
    ctx.lineTo(x, CONFIG.HEIGHT);
    ctx.stroke();
  }
  const off = gameState.backgroundOffset % CONFIG.BACKGROUND.GRID_GAP;
  for (
    let y = h + CONFIG.BACKGROUND.GRID_GAP - off;
    y < CONFIG.HEIGHT;
    y += CONFIG.BACKGROUND.GRID_GAP
  ) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CONFIG.WIDTH, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function renderPlayer(ctx) {
  const p = gameState.player;
  if (!p) return;
  if (
    p.invincible > 0 &&
    Math.floor(p.invincible / CONFIG.RENDER.FLASH_INTERVAL) % 2 === 0
  )
    return;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.shadowColor = CONFIG.COLORS.cyan;
  ctx.shadowBlur = CONFIG.RENDER.GLOW;
  ctx.fillStyle = CONFIG.COLORS.cyan;
  ctx.beginPath();
  ctx.moveTo(p.radius, 0);
  ctx.lineTo(-p.radius, -p.radius * 0.72);
  ctx.lineTo(-p.radius * 0.45, 0);
  ctx.lineTo(-p.radius, p.radius * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = CONFIG.COLORS.white;
  ctx.beginPath();
  ctx.arc(2, 0, 4, 0, CONFIG.TAU);
  ctx.fill();
  ctx.fillStyle = CONFIG.COLORS.magenta;
  ctx.fillRect(-p.radius - 10, -3, 12, 6);
  ctx.restore();
  if (gameState.capture.active) renderHitbox(ctx);
}
function renderHitbox(ctx) {
  const p = gameState.player;
  if (!p) return;
  ctx.save();
  ctx.strokeStyle = CONFIG.COLORS.white;
  ctx.fillStyle = CONFIG.COLORS.red;
  ctx.shadowColor = CONFIG.COLORS.cyan;
  ctx.shadowBlur = 10;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.hitRadius, 0, CONFIG.TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
function renderCaptureField(ctx) {
  if (!gameState.capture.active || !gameState.player) return;
  const x = gameState.player.x + CONFIG.CAPTURE.OFFSET_X,
    y = gameState.player.y,
    pulse = Math.sin(gameState.capture.pulse);
  ctx.save();
  const g = ctx.createRadialGradient(x, y, 0, x, y, CONFIG.CAPTURE.RADIUS);
  g.addColorStop(0, "#40f8ff12");
  g.addColorStop(0.75, "#40f8ff22");
  g.addColorStop(1, "#40f8ff00");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, CONFIG.CAPTURE.RADIUS, 0, CONFIG.TAU);
  ctx.fill();
  ctx.strokeStyle = CONFIG.COLORS.cyan;
  ctx.shadowColor = CONFIG.COLORS.cyan;
  ctx.shadowBlur = 16;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 7]);
  ctx.lineDashOffset = -gameState.capture.pulse * 3;
  ctx.beginPath();
  ctx.arc(x, y, CONFIG.CAPTURE.RADIUS + pulse * 2, 0, CONFIG.TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(gameState.player.x + 20, y);
  ctx.lineTo(x - CONFIG.CAPTURE.RADIUS, y);
  ctx.stroke();
  ctx.restore();
}
function drawCapturedShape(ctx, c, x, y) {
  const color = colorOf(c.colorType);
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = color;
  ctx.shadowBlur = CONFIG.RENDER.GLOW + c.level * 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, c.radius, 0, CONFIG.TAU);
  ctx.fill();
  ctx.strokeStyle = CONFIG.COLORS.white;
  ctx.lineWidth = 1.5;
  if (c.level >= 2) {
    ctx.beginPath();
    ctx.ellipse(
      0,
      0,
      c.radius * 1.55,
      c.radius * 0.7,
      c.orbitAngle,
      0,
      CONFIG.TAU,
    );
    ctx.stroke();
  }
  if (c.level >= 3) {
    ctx.beginPath();
    ctx.arc(0, 0, c.radius * 1.45, c.orbitAngle, c.orbitAngle + Math.PI * 0.75);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(
      0,
      0,
      c.radius * 1.45,
      c.orbitAngle + Math.PI,
      c.orbitAngle + Math.PI * 1.75,
    );
    ctx.stroke();
  }
  if (c.level === 4) {
    ctx.globalAlpha = 0.35 + 0.2 * Math.sin(gameState.capture.pulse);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, c.radius * 1.7, 0, CONFIG.TAU);
    ctx.stroke();
  }
  ctx.restore();
}
function renderSelectedCapturedMarker(ctx, c, pos) {
  const pulse = 1 + Math.sin(gameState.elapsedTime * 7) * 0.08,
    rr = (c.radius + 10) * pulse;
  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(gameState.elapsedTime * 1.8);
  ctx.strokeStyle = CONFIG.COLORS.white;
  ctx.shadowColor = CONFIG.COLORS.white;
  ctx.shadowBlur = 12;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, rr, 0, CONFIG.TAU);
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(rr + 3, -5);
    ctx.lineTo(rr + 3, 5);
    ctx.stroke();
  }
  ctx.fillStyle = CONFIG.COLORS.white;
  ctx.beginPath();
  ctx.moveTo(0, -rr - 10);
  ctx.lineTo(-5, -rr - 3);
  ctx.lineTo(5, -rr - 3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
function renderAimGuide(ctx) {
  const p = gameState.player,
    selected = getSelectedCapturedBullet();
  if (!p || !selected) return;
  const color = colorOf(selected.colorType),
    target = { x: gameState.aim.targetX, y: gameState.aim.targetY },
    pos = orbitPosition(selected);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.28;
  ctx.setLineDash([7, 8]);
  ctx.beginPath();
  ctx.moveTo(p.x + 20, p.y);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();
  ctx.strokeStyle = CONFIG.COLORS.white;
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(target.x, target.y, 10, 0, CONFIG.TAU);
  ctx.moveTo(target.x - 16, target.y);
  ctx.lineTo(target.x - 6, target.y);
  ctx.moveTo(target.x + 6, target.y);
  ctx.lineTo(target.x + 16, target.y);
  ctx.moveTo(target.x, target.y - 16);
  ctx.lineTo(target.x, target.y - 6);
  ctx.moveTo(target.x, target.y + 6);
  ctx.lineTo(target.x, target.y + 16);
  ctx.stroke();
  ctx.restore();
}
function renderBurstField(ctx, f) {
  const life = clamp(f.duration / f.maxDuration, 0, 1),
    r = f.radius * (0.82 + 0.18 * life);
  ctx.save();
  ctx.globalAlpha = 0.1 + 0.18 * life;
  ctx.fillStyle = CONFIG.COLORS.magenta;
  ctx.strokeStyle = CONFIG.COLORS.magenta;
  ctx.shadowColor = CONFIG.COLORS.magenta;
  ctx.shadowBlur = 12;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(f.x, f.y, r, 0, CONFIG.TAU);
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = 0.35 * life;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.arc(
    f.x,
    f.y,
    r * 0.82,
    -gameState.elapsedTime,
    CONFIG.TAU - gameState.elapsedTime,
  );
  ctx.stroke();
  ctx.restore();
}
function renderBurstFields(ctx) {
  gameState.burstFields.forEach((f) => renderBurstField(ctx, f));
}
function renderCapturedBullets(ctx) {
  if (!gameState.player) return;
  const active = getActiveCapturedBullets(),
    r = orbitRadius();
  ctx.save();
  ctx.strokeStyle =
    active.length === CONFIG.MAX_CAPTURE_SLOTS &&
    gameState.capture.fullFlash > 0
      ? CONFIG.COLORS.red
      : "#5adce755";
  ctx.shadowColor =
    active.length === CONFIG.MAX_CAPTURE_SLOTS
      ? CONFIG.COLORS.red
      : CONFIG.COLORS.cyan;
  ctx.shadowBlur =
    active.length === CONFIG.MAX_CAPTURE_SLOTS ? CONFIG.ORBIT.FULL_PULSE : 3;
  ctx.setLineDash([5, 8]);
  ctx.beginPath();
  ctx.arc(gameState.player.x, gameState.player.y, r, 0, CONFIG.TAU);
  ctx.stroke();
  ctx.restore();
  active.forEach((c) => {
    const p = orbitPosition(c),
      trailAngle =
        Math.atan2(p.y - gameState.player.y, p.x - gameState.player.x) -
        CONFIG.ORBIT.TRAIL_LENGTH;
    ctx.save();
    ctx.strokeStyle = colorOf(c.colorType);
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = c.radius;
    ctx.beginPath();
    ctx.arc(
      gameState.player.x,
      gameState.player.y,
      r,
      trailAngle,
      trailAngle + CONFIG.ORBIT.TRAIL_LENGTH,
    );
    ctx.stroke();
    ctx.restore();
    drawCapturedShape(ctx, c, p.x, p.y);
    if (c.id === gameState.selectedCapturedId)
      renderSelectedCapturedMarker(ctx, c, p);
  });
}
function renderEnemyBullets(ctx) {
  gameState.enemyBullets.forEach((b) => {
    ctx.save();
    ctx.fillStyle = colorOf(b.colorType);
    ctx.shadowColor = colorOf(b.colorType);
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, CONFIG.TAU);
    ctx.fill();
    ctx.strokeStyle = CONFIG.COLORS.white;
    ctx.globalAlpha = 0.65;
    ctx.stroke();
    ctx.restore();
  });
}
function renderPlayerBullets(ctx) {
  ctx.save();
  ctx.strokeStyle = CONFIG.COLORS.white;
  ctx.shadowColor = CONFIG.COLORS.cyan;
  ctx.shadowBlur = 10;
  ctx.lineWidth = 3;
  gameState.playerBullets.forEach((b) => {
    ctx.beginPath();
    ctx.moveTo(b.x - 10, b.y);
    ctx.lineTo(b.x + 4, b.y);
    ctx.stroke();
  });
  ctx.restore();
}
function renderCyanProjectile(ctx, b) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(Math.atan2(b.vy, b.vx));
  ctx.strokeStyle = CONFIG.COLORS.cyan;
  ctx.globalAlpha = 0.42;
  ctx.lineWidth = b.level === 4 ? b.radius : 3;
  ctx.beginPath();
  ctx.moveTo(-b.radius * 6, 0);
  ctx.lineTo(-b.radius, 0);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = CONFIG.COLORS.cyan;
  ctx.strokeStyle = CONFIG.COLORS.white;
  ctx.shadowColor = CONFIG.COLORS.cyan;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.moveTo(b.radius * 2, 0);
  ctx.lineTo(-b.radius, -b.radius * 0.75);
  ctx.lineTo(-b.radius * 1.5, 0);
  ctx.lineTo(-b.radius, b.radius * 0.75);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
function renderMagentaProjectile(ctx, b) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.age * 2);
  ctx.fillStyle = "#ff45d433";
  ctx.strokeStyle = CONFIG.COLORS.magenta;
  ctx.shadowColor = CONFIG.COLORS.magenta;
  ctx.shadowBlur = 15;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * CONFIG.TAU;
    if (i) ctx.lineTo(Math.cos(a) * b.radius, Math.sin(a) * b.radius);
    else ctx.moveTo(b.radius, 0);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = CONFIG.COLORS.white;
  ctx.beginPath();
  ctx.arc(0, 0, 3 + Math.sin(b.age * 9), 0, CONFIG.TAU);
  ctx.fill();
  ctx.restore();
}
function renderCounterBullets(ctx) {
  gameState.counterProjectiles.forEach((b) =>
    b.colorType === "cyan"
      ? renderCyanProjectile(ctx, b)
      : renderMagentaProjectile(ctx, b),
  );
  gameState.needleProjectiles.forEach((n) => {
    ctx.save();
    ctx.strokeStyle = CONFIG.COLORS.cyan;
    ctx.shadowColor = CONFIG.COLORS.cyan;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(n.x - n.vx * 0.025, n.y - n.vy * 0.025);
    ctx.lineTo(n.x, n.y);
    ctx.stroke();
    ctx.restore();
  });
}
function renderEnemies(ctx) {
  gameState.enemies.forEach((e) => {
    const color =
      e.kind === "shooter" ? CONFIG.COLORS.cyan : CONFIG.COLORS.magenta;
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.age * (e.kind === "shooter" ? 1 : -1));
    ctx.strokeStyle = color;
    ctx.fillStyle = color + "22";
    ctx.shadowColor = color;
    ctx.shadowBlur = CONFIG.RENDER.GLOW;
    ctx.lineWidth = 2;
    const sides = e.kind === "shooter" ? 6 : 8;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * CONFIG.TAU,
        rad = e.radius * (i % 2 ? 1 : 0.72);
      if (i) ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      else ctx.moveTo(rad, 0);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, CONFIG.TAU);
    ctx.fill();
    ctx.rotate(-e.age * (e.kind === "shooter" ? 1 : -1));
    ctx.fillStyle = "#071020";
    ctx.fillRect(-e.radius, -e.radius - 8, e.radius * 2, 3);
    ctx.fillStyle = color;
    ctx.fillRect(
      -e.radius,
      -e.radius - 8,
      e.radius * 2 * clamp(e.hp / e.maxHp, 0, 1),
      3,
    );
    ctx.restore();
  });
}
function renderBoss(ctx) {
  const b = gameState.boss;
  if (!b?.active) return;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.age * 0.25);
  ctx.shadowColor =
    b.colorFlip % 2 ? CONFIG.COLORS.cyan : CONFIG.COLORS.magenta;
  ctx.shadowBlur = 30;
  for (let ring = 0; ring < 3; ring++) {
    ctx.rotate((ring % 2 ? 1 : -1) * b.age * 0.35);
    ctx.strokeStyle = ring % 2 ? CONFIG.COLORS.cyan : CONFIG.COLORS.magenta;
    ctx.fillStyle = ring % 2 ? "#40f8ff12" : "#ff45d412";
    ctx.lineWidth = 4 - ring;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * CONFIG.TAU,
        r = b.radius - ring * 13;
      if (i) ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.moveTo(r, 0);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = CONFIG.COLORS.white;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, CONFIG.TAU);
  ctx.fill();
  ctx.restore();
}
function renderParticles(ctx) {
  gameState.particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.fillStyle = p.color;
    ctx.strokeStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 9;
    if (p.ring) {
      ctx.lineWidth = p.size;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, CONFIG.TAU);
      ctx.stroke();
    } else ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.restore();
  });
}
function renderFloatingTexts(ctx) {
  ctx.save();
  ctx.font = "800 14px ui-monospace";
  ctx.textAlign = "center";
  gameState.floatingTexts.forEach((t) => {
    ctx.globalAlpha = clamp(t.life / t.maxLife, 0, 1);
    ctx.fillStyle = t.color;
    ctx.shadowColor = t.color;
    ctx.shadowBlur = 8;
    ctx.fillText(t.text, t.x, t.y);
  });
  ctx.restore();
}
function renderBossHealth(ctx) {
  const b = gameState.boss;
  if (!b?.active) return;
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "800 12px ui-monospace";
  ctx.fillStyle = CONFIG.COLORS.white;
  ctx.fillText(
    `${CONFIG.BOSS.NAME} // PATTERN ${b.pattern + 1}`,
    CONFIG.WIDTH * 0.5,
    22,
  );
  ctx.restore();
}
function gameLoop(timestamp) {
  const dt = gameState.lastTimestamp
    ? Math.min((timestamp - gameState.lastTimestamp) / 1000, CONFIG.MAX_DELTA)
    : 0;
  gameState.lastTimestamp = timestamp;
  if (gameState.phase === "playing") update(dt);
  render();
  gameState.animationFrame = requestAnimationFrame(gameLoop);
}
function initialize() {
  cacheDom();
  resetGame();
  bindEvents();
  setPhase("start");
  gameState.animationFrame = requestAnimationFrame(gameLoop);
}
document.addEventListener("DOMContentLoaded", initialize, { once: true });
