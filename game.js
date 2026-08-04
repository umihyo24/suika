"use strict";

const CONFIG = Object.freeze({
  WIDTH: 960, HEIGHT: 540, TAU: Math.PI * 2, MAX_DELTA: 0.033,
  COLORS: { sky: "#07131f", sky2: "#10283a", ground: "#101c23", line: "#35515c", cyan: "#63f5e5", orange: "#ff9e45", red: "#ff626b", white: "#edf8f5", muted: "#78909a", shadow: "#02070b" },
  PLAYER: { X: 154, Y: 330, RADIUS: 22, HITBOX: 13, HP: 4, SPEED: 350, CATCH_SPEED: .42, THROW_SPEED: .2, INVINCIBILITY: 1, HURT_TIME: .34, MIN_X: 42, MAX_X: 430, MIN_Y: 128, MAX_Y: 468 },
  CATCH: { RADIUS: 62, OFFSET: 40, JUST_WINDOW: .18, NORMAL_RECOVERY: .2, JUST_RECOVERY: .03, RUSH_WINDOW: .7, JUST_SLOW: .08 },
  THROW: { RECOVERY: .38, RUSH_RECOVERY: .12, OFFSET: 36, NORMAL_SPEED: 650, JUST_SPEED: 860 },
  ENEMY: { RADIUS: 27, HP: 1, MAX_ACTIVE: 3, ENTER_SPEED: 150, SPAWN_X: 1010, X_MIN: 700, X_GAP: 90, Y_MIN: 175, Y_MAX: 435, SPAWN_INTERVAL: 1.65, FIRST_SPAWN: .25, IDLE_MIN: 1.35, IDLE_MAX: 2.25, TELEGRAPH: .78, COUNTER_PORTION: .2, RECOVERY: .82, HIT_FLASH: .14, DEFEAT_TIME: .5, KNOCKBACK: 58, BLOCK_DEACTIVATES: true },
  TARGET: { VERTICAL_WEIGHT: 4.5, VULNERABLE_BONUS: 190, FRONT_BONUS: 70, DISTANCE_WEIGHT: .08, SWITCH_THRESHOLD: 48, LOCK_MIN_TIME: .32, REASONABLE_Y: 92 },
  BALL: { RADIUS: 11, INCOMING_SPEED: 285, DAMAGE: 1, CLEANUP_MARGIN: 100, RALLY_SPEED_GAIN: .12, RALLY_POWER_GAIN: .18, MAX_SPEED: 760, MAX_DAMAGE: 2, MAX_RALLY_COUNT: 4 },
  BATTER: { RADIUS: 31, SPAWN_EVERY: 3, SWING_TRIGGER_DISTANCE: 310, TELEGRAPH: .34, ACTIVE: .2, RECOVERY: .75, SPEED_MULTIPLIER: 1.14, POWER_MULTIPLIER: 1.16, JUST_BYPASSES_SWING: true },
  SCORE: { CATCH: 50, JUST_CATCH: 175, HIT: 150, JUST_HIT: 275, KO: 500, COUNTER: 250, RALLY_CATCH: 75, MAX_RALLY: 300 },
  FX: { PARTICLES: 10, STRONG_PARTICLES: 22, LIFE: .48, TEXT_LIFE: .8, TRAIL_LIFE: .2, SHAKE: 4, BIG_SHAKE: 11, HIT_STOP: .065, COUNTER_STOP: .13, HIT_STOP_SCALE: .14 },
  ENCOUNTER: { FIRST_KOS: 4, SECOND_KOS: 4, TOTAL: 2 },
  VIEW: { GROUND_Y: 475, GRID: 80, SCORE_DIGITS: 6 }
});

const gameState = {
  phase: "start", result: null, elapsedTime: 0, frame: 0, score: 0, combo: 0, comboTimer: 0,
  player: null, enemies: [], incomingBalls: [], returnedBalls: [], particles: [], texts: [], trails: [],
  heldBall: null, targetEnemyId: null, targetLockTimer: 0, nextEntityId: 1, activeRallies: {},
  input: { keys: new Set(), pointerX: CONFIG.PLAYER.X, pointerY: CONFIG.PLAYER.Y, pointerActive: false, keyboardCatch: false, pointerCatch: false, catchHeld: false, catchPressedAt: -Infinity, throwRequested: false },
  encounter: null, spawnTimer: 0, tutorial: null, screenShake: 0, screenFlash: 0, hitStop: 0,
  lastTimestamp: 0, animationFrame: null, listenersBound: false, ctx: null, dom: {}
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const direction = (x, y, fx = 1, fy = 0) => { const m = Math.hypot(x, y); return m > .001 ? { x: x / m, y: y / m } : { x: fx, y: fy }; };
const overlaps = (a, b, ar = a.radius, br = b.radius) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= (ar + br) ** 2;
const nextId = () => gameState.nextEntityId++;
const random = (lo, hi) => lo + Math.random() * (hi - lo);

function cacheDom() {
  ["game-canvas", "score", "combo", "hp", "held", "progress", "start-overlay", "result-overlay", "reward-overlay", "result-kicker", "result-title", "final-score", "start-button", "restart-button"].forEach(id => gameState.dom[id] = document.getElementById(id));
  gameState.ctx = gameState.dom["game-canvas"].getContext("2d");
}
function createPlayer() { return { x: CONFIG.PLAYER.X, y: CONFIG.PLAYER.Y, radius: CONFIG.PLAYER.RADIUS, hp: CONFIG.PLAYER.HP, action: "normal", timer: 0, invincible: 0, flash: 0 }; }
function resetGame() {
  Object.assign(gameState, { result: null, elapsedTime: 0, frame: 0, score: 0, combo: 0, comboTimer: 0, player: createPlayer(), enemies: [], incomingBalls: [], returnedBalls: [], particles: [], texts: [], trails: [], heldBall: null, targetEnemyId: null, targetLockTimer: 0, nextEntityId: 1, activeRallies: {}, encounter: { number: 1, mode: "combat", defeated: 0, target: CONFIG.ENCOUNTER.FIRST_KOS, spawned: 0 }, spawnTimer: CONFIG.ENEMY.FIRST_SPAWN, tutorial: { caught: false, blocked: false, batterSeen: false, laneTimer: 0 }, screenShake: 0, screenFlash: 0, hitStop: 0 });
  gameState.input.keys.clear(); Object.assign(gameState.input, { pointerActive: false, keyboardCatch: false, pointerCatch: false, catchHeld: false, catchPressedAt: -Infinity, throwRequested: false });
  gameState.dom["reward-overlay"].classList.add("hidden"); syncHud();
}
function setPhase(phase) { gameState.phase = phase; gameState.dom["start-overlay"].classList.toggle("hidden", phase !== "start"); gameState.dom["result-overlay"].classList.toggle("hidden", phase !== "gameover"); }
function startGame() { resetGame(); setPhase("playing"); }

function bindEvents() {
  if (gameState.listenersBound) return; gameState.listenersBound = true; const canvas = gameState.dom["game-canvas"];
  const refreshCatch = () => { const held = gameState.input.keyboardCatch || gameState.input.pointerCatch; if (held && !gameState.input.catchHeld && gameState.phase === "playing") gameState.input.catchPressedAt = gameState.elapsedTime; gameState.input.catchHeld = held; };
  const pointer = e => { const r = canvas.getBoundingClientRect(); gameState.input.pointerX = (e.clientX - r.left) * CONFIG.WIDTH / r.width; gameState.input.pointerY = (e.clientY - r.top) * CONFIG.HEIGHT / r.height; gameState.input.pointerActive = true; };
  addEventListener("keydown", e => { if (["Space", "ShiftLeft", "ShiftRight", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault(); gameState.input.keys.add(e.code); if (e.code.startsWith("Shift")) { gameState.input.keyboardCatch = true; refreshCatch(); } if (e.code === "Space" && !e.repeat) gameState.input.throwRequested = true; });
  addEventListener("keyup", e => { gameState.input.keys.delete(e.code); if (e.code.startsWith("Shift")) { gameState.input.keyboardCatch = false; refreshCatch(); } });
  canvas.addEventListener("pointermove", pointer); canvas.addEventListener("pointerdown", e => { e.preventDefault(); pointer(e); if (e.button === 0) { gameState.input.pointerCatch = true; refreshCatch(); } else if (e.button === 2) gameState.input.throwRequested = true; });
  canvas.addEventListener("pointerup", e => { if (e.button === 0) { gameState.input.pointerCatch = false; refreshCatch(); } }); canvas.addEventListener("contextmenu", e => e.preventDefault());
  gameState.dom["start-button"].addEventListener("click", startGame); gameState.dom["restart-button"].addEventListener("click", startGame);
  document.querySelectorAll("[data-upgrade]").forEach(button => button.addEventListener("click", chooseUpgrade));
  addEventListener("blur", () => { gameState.input.keys.clear(); gameState.input.keyboardCatch = gameState.input.pointerCatch = false; refreshCatch(); });
}

function createBasicEnemy() { return createEnemy("basic"); }
function createBatterEnemy() { return createEnemy("batter"); }
function createEnemy(type) {
  const slot = gameState.enemies.filter(e => e.active && e.state !== "defeated").length;
  const y = slot === 0 && gameState.encounter.spawned === 0 ? 285 : random(CONFIG.ENEMY.Y_MIN, CONFIG.ENEMY.Y_MAX);
  return { id: nextId(), type, active: true, x: CONFIG.ENEMY.SPAWN_X + slot * 20, targetX: CONFIG.ENEMY.X_MIN + (slot % 3) * CONFIG.ENEMY.X_GAP, y, radius: type === "batter" ? CONFIG.BATTER.RADIUS : CONFIG.ENEMY.RADIUS, hp: CONFIG.ENEMY.HP, state: "entering", stateTimer: 0, vulnerable: false, guardState: "guarded", vulnerabilityTimer: 0, flash: 0, knockback: 0, swingBallId: null, handledRallyIds: new Set() };
}
function spawnEnemy() {
  if (gameState.enemies.filter(e => e.active && e.state !== "defeated").length >= CONFIG.ENEMY.MAX_ACTIVE) return;
  gameState.encounter.spawned++; const useBatter = gameState.encounter.number > 1 && gameState.encounter.spawned % CONFIG.BATTER.SPAWN_EVERY === 0;
  const enemy = useBatter ? createBatterEnemy() : createBasicEnemy(); gameState.enemies.push(enemy);
  if (useBatter && !gameState.tutorial.batterSeen) { gameState.tutorial.batterSeen = true; textFx("RALLY!", enemy.targetX, enemy.y - 60, CONFIG.COLORS.orange); }
}
function isEnemyVulnerable(e) { return Boolean(e && e.active && e.state === "recovery" && e.vulnerable); }
function isEnemyGuarded(e) { return Boolean(e && e.active && !isEnemyVulnerable(e) && e.state !== "defeated" && e.state !== "entering"); }
function canNormalReturnDefeatEnemy(e) { return isEnemyVulnerable(e); }
function canJustReturnDefeatEnemy(e, ball) { return Boolean(ball.justReturn && e.state !== "entering"); }
function isCounterWindow(e) { return e.type === "basic" && e.state === "telegraph" && e.stateTimer <= CONFIG.ENEMY.TELEGRAPH * CONFIG.ENEMY.COUNTER_PORTION; }
function setEnemyState(e, state, timer) { e.state = state; e.stateTimer = timer; e.vulnerable = state === "recovery"; e.guardState = e.vulnerable ? "open" : "guarded"; e.vulnerabilityTimer = e.vulnerable ? timer : 0; }

function updateEnemies(dt) {
  for (const e of gameState.enemies) {
    if (!e.active) continue; e.flash = Math.max(0, e.flash - dt); e.knockback = Math.max(0, e.knockback - 110 * dt);
    if (e.state === "defeated") { e.stateTimer -= dt; if (e.stateTimer <= 0) e.active = false; continue; }
    if (e.state === "entering") { e.x = Math.max(e.targetX, e.x - CONFIG.ENEMY.ENTER_SPEED * dt); if (e.x <= e.targetX) setEnemyState(e, "idle", e.type === "basic" ? random(CONFIG.ENEMY.IDLE_MIN, CONFIG.ENEMY.IDLE_MAX) : 999); continue; }
    if (e.type === "batter") updateBatterState(e, dt); else updateBasicState(e, dt);
  }
  gameState.spawnTimer -= dt; if (gameState.spawnTimer <= 0) { spawnEnemy(); gameState.spawnTimer = CONFIG.ENEMY.SPAWN_INTERVAL; }
}
function updateBasicState(e, dt) {
  e.stateTimer -= dt; e.vulnerabilityTimer = e.vulnerable ? Math.max(0, e.stateTimer) : 0;
  if (e.state === "idle" && e.stateTimer <= 0) setEnemyState(e, "telegraph", CONFIG.ENEMY.TELEGRAPH);
  else if (e.state === "telegraph" && e.stateTimer <= 0) { createIncomingBall(e); setEnemyState(e, "recovery", CONFIG.ENEMY.RECOVERY); textFx("OPEN!", e.x, e.y - 52, CONFIG.COLORS.cyan); }
  else if (e.state === "recovery" && e.stateTimer <= 0) setEnemyState(e, "idle", random(CONFIG.ENEMY.IDLE_MIN, CONFIG.ENEMY.IDLE_MAX));
}
function updateBatterState(e, dt) {
  if (e.state === "idle") return;
  e.stateTimer -= dt; e.vulnerabilityTimer = e.vulnerable ? Math.max(0, e.stateTimer) : 0;
  if (e.state === "swingTelegraph" && e.stateTimer <= 0) setEnemyState(e, "swingActive", CONFIG.BATTER.ACTIVE);
  else if (e.state === "swingActive" && e.stateTimer <= 0) { setEnemyState(e, "recovery", CONFIG.BATTER.RECOVERY); textFx("MISS — OPEN!", e.x, e.y - 54, CONFIG.COLORS.cyan); }
  else if (e.state === "recovery" && e.stateTimer <= 0) { setEnemyState(e, "idle", 999); e.swingBallId = null; }
}

function createRallyMetadata(source = {}) { return { rallyId: source.rallyId || nextId(), rallyCount: source.rallyCount || 0, lastHandledByEnemyId: source.lastHandledByEnemyId || null, lastHandledFrame: source.lastHandledFrame ?? -1, speedMultiplier: source.speedMultiplier || 1, damageMultiplier: source.damageMultiplier || 1 }; }
function preserveRallyMetadata(source) { return createRallyMetadata(source); }
function createIncomingBall(enemy, metadata = null, speed = CONFIG.BALL.INCOMING_SPEED, damage = CONFIG.BALL.DAMAGE) {
  const d = direction(gameState.player.x - enemy.x, gameState.player.y - enemy.y, -1, 0); const rally = metadata || createRallyMetadata();
  const ball = { id: nextId(), active: true, x: enemy.x - enemy.radius, y: enemy.y, vx: d.x * speed, vy: d.y * speed, radius: CONFIG.BALL.RADIUS, damage, ownerEnemyId: enemy.id, processed: false, ...rally };
  gameState.incomingBalls.push(ball); gameState.activeRallies[ball.rallyId] = true; return ball;
}
function scoreAutomaticTarget(e) { const p = gameState.player; return -Math.abs(e.y - p.y) * CONFIG.TARGET.VERTICAL_WEIGHT + (isEnemyVulnerable(e) ? CONFIG.TARGET.VULNERABLE_BONUS : 0) + (e.x > p.x ? CONFIG.TARGET.FRONT_BONUS : 0) - distance(e, p) * CONFIG.TARGET.DISTANCE_WEIGHT; }
function validTarget(e) { return e && e.active && e.state !== "defeated" && e.state !== "entering"; }
function shouldSwitchTarget(current, candidate) { if (!validTarget(current)) return true; if (!candidate || candidate.id === current.id || gameState.targetLockTimer > 0) return false; return scoreAutomaticTarget(candidate) > scoreAutomaticTarget(current) + CONFIG.TARGET.SWITCH_THRESHOLD || Math.abs(current.y - gameState.player.y) > CONFIG.TARGET.REASONABLE_Y; }
function selectAutomaticTarget() { const candidates = gameState.enemies.filter(validTarget).sort((a, b) => scoreAutomaticTarget(b) - scoreAutomaticTarget(a)); return candidates[0] || null; }
function updateTargetLock(dt) { gameState.targetLockTimer = Math.max(0, gameState.targetLockTimer - dt); const current = gameState.enemies.find(e => e.id === gameState.targetEnemyId); const best = selectAutomaticTarget(); if (shouldSwitchTarget(current, best)) { gameState.targetEnemyId = best?.id || null; gameState.targetLockTimer = CONFIG.TARGET.LOCK_MIN_TIME; } }

function updatePlayer(dt) {
  const p = gameState.player; p.timer = Math.max(0, p.timer - dt); p.invincible = Math.max(0, p.invincible - dt); p.flash = Math.max(0, p.flash - dt);
  if (p.timer <= 0 && ["throwing", "catchRecovery", "hurt"].includes(p.action)) p.action = "normal";
  if (["normal", "catching"].includes(p.action)) p.action = gameState.input.catchHeld ? "catching" : "normal";
  let dx = 0, dy = 0, k = gameState.input.keys; if (k.has("KeyA") || k.has("ArrowLeft")) dx--; if (k.has("KeyD") || k.has("ArrowRight")) dx++; if (k.has("KeyW") || k.has("ArrowUp")) dy--; if (k.has("KeyS") || k.has("ArrowDown")) dy++;
  let speed = CONFIG.PLAYER.SPEED * (p.action === "catching" ? CONFIG.PLAYER.CATCH_SPEED : p.action === "throwing" ? CONFIG.PLAYER.THROW_SPEED : 1);
  if (dx || dy) { const d = direction(dx, dy); p.x += d.x * speed * dt; p.y += d.y * speed * dt; gameState.input.pointerActive = false; }
  else if (gameState.input.pointerActive) { const d = direction(gameState.input.pointerX - p.x, gameState.input.pointerY - p.y); const dist = Math.hypot(gameState.input.pointerX - p.x, gameState.input.pointerY - p.y); if (dist > 10) { p.x += d.x * Math.min(speed * dt, dist); p.y += d.y * Math.min(speed * dt, dist); } }
  p.x = clamp(p.x, CONFIG.PLAYER.MIN_X, CONFIG.PLAYER.MAX_X); p.y = clamp(p.y, CONFIG.PLAYER.MIN_Y, CONFIG.PLAYER.MAX_Y);
}
function isJustCatch() { return gameState.input.catchHeld && gameState.elapsedTime - gameState.input.catchPressedAt <= CONFIG.CATCH.JUST_WINDOW; }
function catchCenter() { return { x: gameState.player.x + CONFIG.CATCH.OFFSET, y: gameState.player.y }; }
function handleRallyCatch(ball, just) { if (ball.rallyCount > 0) { gameState.score += just ? CONFIG.SCORE.RALLY_CATCH : 0; gameState.combo += just ? 2 : 1; if (just) { gameState.hitStop = CONFIG.CATCH.JUST_SLOW; textFx(`JUST RALLY x${ball.rallyCount}`, gameState.player.x, gameState.player.y - 60, CONFIG.COLORS.cyan); } } }
function catchBall(ball) {
  const just = isJustCatch(); ball.active = false; handleRallyCatch(ball, just); gameState.heldBall = { ...preserveRallyMetadata(ball), justCaught: just, damage: ball.damage };
  gameState.player.action = "catchRecovery"; gameState.player.timer = just ? CONFIG.CATCH.JUST_RECOVERY : CONFIG.CATCH.NORMAL_RECOVERY; gameState.score += just ? CONFIG.SCORE.JUST_CATCH : CONFIG.SCORE.CATCH; gameState.combo++; gameState.comboTimer = 3; gameState.tutorial.caught = true; gameState.tutorial.laneTimer = 3;
  burst(gameState.player.x + 35, gameState.player.y, just ? CONFIG.COLORS.cyan : CONFIG.COLORS.white, just); textFx(just ? "JUST CATCH!" : "CAUGHT!", gameState.player.x, gameState.player.y - 52, just ? CONFIG.COLORS.cyan : CONFIG.COLORS.white);
}
function throwHeldBall() {
  if (!gameState.heldBall || ["throwing", "hurt"].includes(gameState.player.action)) return; const target = gameState.enemies.find(e => e.id === gameState.targetEnemyId && validTarget(e)); if (!target) return;
  const held = gameState.heldBall, justReturn = held.justCaught && gameState.elapsedTime - gameState.input.catchPressedAt <= CONFIG.CATCH.RUSH_WINDOW; const d = direction(target.x - gameState.player.x, target.y - gameState.player.y); const speed = (justReturn ? CONFIG.THROW.JUST_SPEED : CONFIG.THROW.NORMAL_SPEED) * held.speedMultiplier;
  gameState.returnedBalls.push({ id: nextId(), active: true, x: gameState.player.x + CONFIG.THROW.OFFSET, y: gameState.player.y, vx: d.x * speed, vy: d.y * speed, radius: CONFIG.BALL.RADIUS, damage: clamp(held.damage * held.damageMultiplier, 1, CONFIG.BALL.MAX_DAMAGE), targetEnemyId: target.id, justReturn, handledEnemyIds: new Set(), ...preserveRallyMetadata(held) });
  gameState.heldBall = null; gameState.player.action = "throwing"; gameState.player.timer = justReturn ? CONFIG.THROW.RUSH_RECOVERY : CONFIG.THROW.RECOVERY; burst(gameState.player.x + 35, gameState.player.y, justReturn ? CONFIG.COLORS.cyan : CONFIG.COLORS.orange, justReturn);
}
function damagePlayer(ball) { if (!ball.active || gameState.player.invincible > 0) return; ball.active = false; endRally(ball.rallyId); gameState.player.hp--; gameState.player.invincible = CONFIG.PLAYER.INVINCIBILITY; gameState.player.action = "hurt"; gameState.player.timer = CONFIG.PLAYER.HURT_TIME; gameState.heldBall = null; gameState.combo = 0; gameState.screenShake = CONFIG.FX.BIG_SHAKE; textFx("HIT", gameState.player.x, gameState.player.y - 45, CONFIG.COLORS.red); }

function updateIncomingBalls(dt) {
  const c = catchCenter(); for (const ball of gameState.incomingBalls) { if (!ball.active) continue; ball.x += ball.vx * dt; ball.y += ball.vy * dt; trail(ball, CONFIG.COLORS.orange); if (gameState.player.action === "catching" && overlaps(ball, c, ball.radius, CONFIG.CATCH.RADIUS)) catchBall(ball); else if (overlaps(ball, gameState.player, ball.radius, CONFIG.PLAYER.HITBOX)) damagePlayer(ball); else if (outside(ball)) { ball.active = false; endRally(ball.rallyId); } }
}
function canBatterSwingAtBall(e, ball) { return e.type === "batter" && e.state === "idle" && ball.vx > 0 && !ball.justReturn && !e.handledRallyIds.has(ball.rallyId) && ball.lastHandledByEnemyId !== e.id; }
function startBatterSwing(e, ball) { e.swingBallId = ball.id; setEnemyState(e, "swingTelegraph", CONFIG.BATTER.TELEGRAPH); textFx("SWING!", e.x, e.y - 58, CONFIG.COLORS.orange); }
function batReturnedBall(e, ball) { if (e.state !== "swingActive" || e.swingBallId !== ball.id || e.handledRallyIds.has(ball.rallyId)) return false; e.handledRallyIds.add(ball.rallyId); ball.active = false; const meta = preserveRallyMetadata(ball); meta.rallyCount = clamp(meta.rallyCount + 1, 0, CONFIG.BALL.MAX_RALLY_COUNT); meta.lastHandledByEnemyId = e.id; meta.lastHandledFrame = gameState.frame; meta.speedMultiplier = clamp(meta.speedMultiplier * CONFIG.BATTER.SPEED_MULTIPLIER, 1, CONFIG.BALL.MAX_SPEED / CONFIG.BALL.INCOMING_SPEED); meta.damageMultiplier = clamp(meta.damageMultiplier * CONFIG.BATTER.POWER_MULTIPLIER, 1, CONFIG.BALL.MAX_DAMAGE);
  convertReturnedBallToIncoming(e, ball, meta); setEnemyState(e, "recovery", CONFIG.BATTER.RECOVERY); e.swingBallId = null; textFx(`RALLY x${meta.rallyCount}`, e.x, e.y - 62, CONFIG.COLORS.white); if (meta.rallyCount === CONFIG.BALL.MAX_RALLY_COUNT) { gameState.score += CONFIG.SCORE.MAX_RALLY; textFx("MAX RALLY!", e.x, e.y - 88, CONFIG.COLORS.cyan); } return true;
}
function convertReturnedBallToIncoming(e, ball, meta) { const speed = clamp(CONFIG.BALL.INCOMING_SPEED * meta.speedMultiplier, CONFIG.BALL.INCOMING_SPEED, CONFIG.BALL.MAX_SPEED); const damage = clamp(ball.damage * meta.damageMultiplier, 1, CONFIG.BALL.MAX_DAMAGE); return createIncomingBall(e, meta, speed, damage); }
function handleGuardedReturn(e, ball) { ball.active = !CONFIG.ENEMY.BLOCK_DEACTIVATES; ball.vx *= -1; gameState.tutorial.blocked = true; burst(e.x, e.y, CONFIG.COLORS.muted, false); textFx("BLOCKED", e.x, e.y - 48, CONFIG.COLORS.white); textFx("THROW WHEN OPEN", CONFIG.WIDTH / 2, 92, CONFIG.COLORS.cyan); }
function handleCounterReturn(e, ball) { textFx("COUNTER", e.x, e.y - 58, CONFIG.COLORS.orange); gameState.score += CONFIG.SCORE.COUNTER; gameState.hitStop = CONFIG.FX.COUNTER_STOP; knockoutEnemy(e, ball, true); }
function knockoutEnemy(e, ball, counter = false) { if (!validTarget(e)) return; e.hp = 0; setEnemyState(e, "defeated", CONFIG.ENEMY.DEFEAT_TIME); e.vulnerable = false; e.knockback = counter ? CONFIG.ENEMY.KNOCKBACK * 1.5 : CONFIG.ENEMY.KNOCKBACK; e.flash = CONFIG.ENEMY.HIT_FLASH; gameState.encounter.defeated++; gameState.score += (ball.justReturn ? CONFIG.SCORE.JUST_HIT : CONFIG.SCORE.HIT) + CONFIG.SCORE.KO; gameState.combo += ball.justReturn ? 3 : 2; gameState.hitStop = Math.max(gameState.hitStop, CONFIG.FX.HIT_STOP); gameState.screenShake = counter ? CONFIG.FX.BIG_SHAKE : CONFIG.FX.SHAKE; burst(e.x, e.y, counter ? CONFIG.COLORS.white : CONFIG.COLORS.orange, true); textFx("K.O.!", e.x, e.y - 35, CONFIG.COLORS.orange); endRally(ball.rallyId); }
function resolveReturnedHit(e, ball) { if (ball.handledEnemyIds.has(e.id)) return; ball.handledEnemyIds.add(e.id); if (isCounterWindow(e)) { ball.active = false; handleCounterReturn(e, ball); } else if (canJustReturnDefeatEnemy(e, ball) || canNormalReturnDefeatEnemy(e)) { ball.active = false; knockoutEnemy(e, ball); } else handleGuardedReturn(e, ball); }
function updateReturnedBalls(dt) {
  for (const ball of gameState.returnedBalls) { if (!ball.active) continue; ball.x += ball.vx * dt; ball.y += ball.vy * dt; trail(ball, ball.justReturn ? CONFIG.COLORS.cyan : CONFIG.COLORS.white);
    for (const e of gameState.enemies) { if (!ball.active || !validTarget(e)) continue; if (canBatterSwingAtBall(e, ball) && distance(e, ball) <= CONFIG.BATTER.SWING_TRIGGER_DISTANCE) startBatterSwing(e, ball); if (!overlaps(ball, e)) continue; if (e.type === "batter" && batReturnedBall(e, ball)) break; resolveReturnedHit(e, ball); }
    if (outside(ball)) { ball.active = false; endRally(ball.rallyId); }
  }
}
function endRally(rallyId) { if (rallyId) delete gameState.activeRallies[rallyId]; }
function outside(b) { const m = CONFIG.BALL.CLEANUP_MARGIN; return b.x < -m || b.x > CONFIG.WIDTH + m || b.y < -m || b.y > CONFIG.HEIGHT + m; }

function update(dt) {
  if (gameState.phase !== "playing" || gameState.encounter.mode !== "combat") return; gameState.frame++;
  if (gameState.hitStop > 0) { gameState.hitStop = Math.max(0, gameState.hitStop - dt); dt *= CONFIG.FX.HIT_STOP_SCALE; }
  gameState.elapsedTime += dt; if (gameState.input.throwRequested) { gameState.input.throwRequested = false; throwHeldBall(); }
  updatePlayer(dt); updateEnemies(dt); updateTargetLock(dt); updateIncomingBalls(dt); updateReturnedBalls(dt); updateEffects(dt); cleanup();
  gameState.comboTimer = Math.max(0, gameState.comboTimer - dt); if (!gameState.comboTimer) gameState.combo = 0; gameState.tutorial.laneTimer = Math.max(0, gameState.tutorial.laneTimer - dt);
  if (gameState.player.hp <= 0) finish(false); else if (gameState.encounter.defeated >= gameState.encounter.target) completeEncounter(); syncHud();
}
function cleanup() { gameState.enemies = gameState.enemies.filter(x => x.active); gameState.incomingBalls = gameState.incomingBalls.filter(x => x.active); gameState.returnedBalls = gameState.returnedBalls.filter(x => x.active); gameState.particles = gameState.particles.filter(x => x.life > 0); gameState.texts = gameState.texts.filter(x => x.life > 0); gameState.trails = gameState.trails.filter(x => x.life > 0); }
function completeEncounter() { if (gameState.encounter.number < CONFIG.ENCOUNTER.TOTAL) { gameState.encounter.mode = "reward"; gameState.incomingBalls.forEach(x => x.active = false); gameState.returnedBalls.forEach(x => x.active = false); gameState.dom["reward-overlay"].classList.remove("hidden"); } else finish(true); }
function chooseUpgrade(e) { if (gameState.encounter?.mode !== "reward") return; gameState.dom["reward-overlay"].classList.add("hidden"); gameState.enemies = []; gameState.incomingBalls = []; gameState.returnedBalls = []; gameState.heldBall = null; gameState.activeRallies = {}; gameState.encounter = { number: 2, mode: "combat", defeated: 0, target: CONFIG.ENCOUNTER.SECOND_KOS, spawned: 0 }; gameState.spawnTimer = CONFIG.ENEMY.FIRST_SPAWN; }
function finish(clear) { if (gameState.phase !== "playing") return; gameState.result = clear ? "clear" : "defeat"; gameState.dom["result-kicker"].textContent = clear ? "RETURN PROTOCOL COMPLETE" : "DRILL TERMINATED"; gameState.dom["result-title"].textContent = clear ? "CLEAR" : "GAME OVER"; gameState.dom["final-score"].textContent = String(gameState.score).padStart(CONFIG.VIEW.SCORE_DIGITS, "0"); setPhase("gameover"); }
function syncHud() { const p = gameState.player; gameState.dom.score.textContent = String(gameState.score).padStart(CONFIG.VIEW.SCORE_DIGITS, "0"); gameState.dom.combo.textContent = gameState.combo ? `x${gameState.combo}` : "—"; gameState.dom.hp.textContent = p ? Array.from({ length: CONFIG.PLAYER.HP }, (_, i) => i < p.hp ? "●" : "○").join(" ") : "—"; gameState.dom.held.textContent = gameState.heldBall ? (gameState.heldBall.justCaught ? "JUST READY" : "BALL READY") : "EMPTY"; gameState.dom.held.classList.toggle("ready", Boolean(gameState.heldBall)); gameState.dom.progress.textContent = `${gameState.encounter?.defeated || 0} / ${gameState.encounter?.target || CONFIG.ENCOUNTER.FIRST_KOS}`; }

function burst(x, y, color, strong) { const n = strong ? CONFIG.FX.STRONG_PARTICLES : CONFIG.FX.PARTICLES; for (let i = 0; i < n; i++) { const a = Math.random() * CONFIG.TAU, s = random(45, 190); gameState.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, color, life: CONFIG.FX.LIFE, maxLife: CONFIG.FX.LIFE, size: random(2, 6) }); } }
function textFx(text, x, y, color) { gameState.texts.push({ text, x, y, color, life: CONFIG.FX.TEXT_LIFE, maxLife: CONFIG.FX.TEXT_LIFE }); }
function trail(ball, color) { gameState.trails.push({ x: ball.x, y: ball.y, radius: ball.radius, color, life: CONFIG.FX.TRAIL_LIFE, maxLife: CONFIG.FX.TRAIL_LIFE, rallyCount: ball.rallyCount }); }
function updateEffects(dt) { gameState.screenShake = Math.max(0, gameState.screenShake - 18 * dt); gameState.screenFlash = Math.max(0, gameState.screenFlash - dt); gameState.particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }); [...gameState.texts, ...gameState.trails].forEach(x => x.life -= dt); gameState.texts.forEach(t => t.y -= 22 * dt); }

function renderBackground(ctx) { const g = ctx.createLinearGradient(0, 0, 0, CONFIG.HEIGHT); g.addColorStop(0, CONFIG.COLORS.sky); g.addColorStop(1, CONFIG.COLORS.sky2); ctx.fillStyle = g; ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT); ctx.fillStyle = CONFIG.COLORS.ground; ctx.fillRect(0, 300, CONFIG.WIDTH, 240); ctx.strokeStyle = CONFIG.COLORS.line; ctx.globalAlpha = .45; for (let y = CONFIG.VIEW.GROUND_Y; y > 300; y -= 38) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CONFIG.WIDTH, y); ctx.stroke(); } for (let x = -960; x < 1920; x += CONFIG.VIEW.GRID) { ctx.beginPath(); ctx.moveTo(480, 300); ctx.lineTo(x, 540); ctx.stroke(); } ctx.globalAlpha = 1; ctx.strokeStyle = CONFIG.COLORS.orange; ctx.setLineDash([12, 12]); ctx.beginPath(); ctx.moveTo(CONFIG.PLAYER.MAX_X, 300); ctx.lineTo(CONFIG.PLAYER.MAX_X, 540); ctx.stroke(); ctx.setLineDash([]); }
function renderTargetLane(ctx) { if (!gameState.heldBall) return; const e = gameState.enemies.find(x => x.id === gameState.targetEnemyId && validTarget(x)); if (!e) return; ctx.save(); ctx.strokeStyle = CONFIG.COLORS.cyan; ctx.globalAlpha = .28; ctx.lineWidth = 3; ctx.setLineDash([12, 10]); ctx.beginPath(); ctx.moveTo(gameState.player.x, gameState.player.y); ctx.lineTo(e.x, e.y); ctx.stroke(); ctx.fillStyle = "#63f5e50d"; ctx.fillRect(gameState.player.x, e.y - 16, e.x - gameState.player.x, 32); ctx.restore(); }
function renderEnemyGuard(ctx, e) { if (!isEnemyGuarded(e)) return; ctx.save(); ctx.strokeStyle = CONFIG.COLORS.white; ctx.globalAlpha = .55; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(e.x - 5, e.y, e.radius + 12, Math.PI * .55, Math.PI * 1.45); ctx.stroke(); ctx.restore(); }
function renderEnemyVulnerability(ctx, e) { if (!isEnemyVulnerable(e)) return; const pulse = .5 + Math.sin(gameState.elapsedTime * 12) * .25; ctx.save(); ctx.strokeStyle = CONFIG.COLORS.cyan; ctx.fillStyle = CONFIG.COLORS.cyan; ctx.globalAlpha = pulse; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 11, 0, CONFIG.TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(e.x, e.y, 7, 0, CONFIG.TAU); ctx.fill(); ctx.font = "900 13px ui-monospace"; ctx.textAlign = "center"; ctx.globalAlpha = 1; ctx.fillText("OPEN", e.x, e.y - e.radius - 20); ctx.restore(); }
function renderBatterTelegraph(ctx, e) { if (e.type !== "batter" || !["swingTelegraph", "swingActive"].includes(e.state)) return; ctx.save(); ctx.strokeStyle = e.state === "swingActive" ? CONFIG.COLORS.white : CONFIG.COLORS.orange; ctx.lineWidth = e.state === "swingActive" ? 8 : 4; ctx.globalAlpha = .8; ctx.beginPath(); ctx.arc(e.x, e.y, 54, -2.2, .6); ctx.stroke(); ctx.restore(); }
function renderEnemy(ctx, e) { ctx.save(); ctx.translate(e.x + e.knockback, e.y); if (e.state === "defeated") { ctx.rotate(.8); ctx.globalAlpha = clamp(e.stateTimer / CONFIG.ENEMY.DEFEAT_TIME, 0, 1); } ctx.fillStyle = "#02060a"; ctx.beginPath(); ctx.ellipse(0, e.radius + 15, 34, 9, 0, 0, CONFIG.TAU); ctx.fill(); ctx.fillStyle = e.flash > 0 ? CONFIG.COLORS.white : "#aab8ba"; ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, CONFIG.TAU); ctx.fill(); ctx.fillStyle = "#172832"; ctx.fillRect(-e.radius, 2, e.radius * 2, 19); ctx.fillStyle = e.vulnerable ? CONFIG.COLORS.cyan : CONFIG.COLORS.red; ctx.fillRect(-15, 8, 30, 5); const arm = e.vulnerable ? 1 : -8; ctx.fillStyle = CONFIG.COLORS.orange; ctx.beginPath(); ctx.arc(-e.radius + arm, 1, 9, 0, CONFIG.TAU); ctx.fill(); if (e.type === "batter") { const angle = e.state === "swingActive" ? -1.2 : e.state === "swingTelegraph" ? -.3 : .65; ctx.rotate(angle); ctx.fillStyle = "#dce8a7"; ctx.fillRect(-5, -58, 10, 72); } ctx.restore(); renderEnemyGuard(ctx, e); renderEnemyVulnerability(ctx, e); renderBatterTelegraph(ctx, e); }
function drawBall(ctx, b, color) { ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 14; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, CONFIG.TAU); ctx.fill(); ctx.restore(); }
function renderRallyCount(ctx, ball) { if (!ball.rallyCount) return; ctx.save(); ctx.fillStyle = ball.rallyCount >= CONFIG.BALL.MAX_RALLY_COUNT ? CONFIG.COLORS.cyan : CONFIG.COLORS.white; ctx.strokeStyle = CONFIG.COLORS.shadow; ctx.lineWidth = 4; ctx.font = "900 13px ui-monospace"; ctx.textAlign = "center"; ctx.strokeText(`RALLY ${ball.rallyCount}`, ball.x, ball.y - 21); ctx.fillText(`RALLY ${ball.rallyCount}`, ball.x, ball.y - 21); ctx.restore(); }
function renderPlayer(ctx) { const p = gameState.player; ctx.save(); ctx.globalAlpha = p.invincible > 0 && Math.floor(gameState.elapsedTime * 16) % 2 ? .35 : 1; ctx.translate(p.x, p.y); ctx.fillStyle = CONFIG.COLORS.white; ctx.beginPath(); ctx.arc(0, 0, p.radius, 0, CONFIG.TAU); ctx.fill(); ctx.fillStyle = "#172b37"; ctx.fillRect(-18, 1, 36, 20); ctx.fillStyle = CONFIG.COLORS.cyan; ctx.fillRect(-13, 7, 26, 5); ctx.fillStyle = CONFIG.COLORS.orange; ctx.beginPath(); ctx.arc(p.action === "catching" ? 34 : 24, -2, 12, 0, CONFIG.TAU); ctx.fill(); ctx.restore(); if (p.action === "catching") { const c = catchCenter(); ctx.strokeStyle = isJustCatch() ? CONFIG.COLORS.cyan : CONFIG.COLORS.white; ctx.setLineDash([9, 7]); ctx.beginPath(); ctx.arc(c.x, c.y, CONFIG.CATCH.RADIUS, 0, CONFIG.TAU); ctx.stroke(); ctx.setLineDash([]); } }
function renderTutorial(ctx) { if (gameState.phase !== "playing") return; let message = ""; if (!gameState.tutorial.caught && gameState.elapsedTime < 5) message = "HOLD CATCH"; else if (gameState.heldBall) message = "MOVE TO THEIR HEIGHT • THROW WHEN OPEN"; if (message) { ctx.save(); ctx.font = "900 24px Impact"; ctx.textAlign = "center"; ctx.strokeStyle = CONFIG.COLORS.shadow; ctx.lineWidth = 7; ctx.strokeText(message, 480, 92); ctx.fillStyle = CONFIG.COLORS.white; ctx.fillText(message, 480, 92); ctx.restore(); } }
function render() { const ctx = gameState.ctx; ctx.clearRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT); ctx.save(); ctx.translate(random(-gameState.screenShake, gameState.screenShake), random(-gameState.screenShake, gameState.screenShake)); renderBackground(ctx); renderTargetLane(ctx); for (const t of gameState.trails) { ctx.globalAlpha = t.life / t.maxLife * (.35 + t.rallyCount * .1); ctx.fillStyle = t.color; ctx.beginPath(); ctx.arc(t.x, t.y, t.radius, 0, CONFIG.TAU); ctx.fill(); } ctx.globalAlpha = 1; gameState.enemies.forEach(e => renderEnemy(ctx, e)); gameState.incomingBalls.forEach(b => { drawBall(ctx, b, CONFIG.COLORS.orange); renderRallyCount(ctx, b); }); gameState.returnedBalls.forEach(b => { drawBall(ctx, b, b.justReturn ? CONFIG.COLORS.cyan : CONFIG.COLORS.white); renderRallyCount(ctx, b); }); if (gameState.heldBall) drawBall(ctx, { x: gameState.player.x, y: gameState.player.y - 35, radius: CONFIG.BALL.RADIUS }, gameState.heldBall.justCaught ? CONFIG.COLORS.cyan : CONFIG.COLORS.orange); renderPlayer(ctx); for (const p of gameState.particles) { ctx.globalAlpha = p.life / p.maxLife; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); } ctx.globalAlpha = 1; ctx.textAlign = "center"; for (const t of gameState.texts) { ctx.globalAlpha = t.life / t.maxLife; ctx.font = "900 20px Impact"; ctx.strokeStyle = CONFIG.COLORS.shadow; ctx.lineWidth = 5; ctx.strokeText(t.text, t.x, t.y); ctx.fillStyle = t.color; ctx.fillText(t.text, t.x, t.y); } ctx.globalAlpha = 1; renderTutorial(ctx); ctx.restore(); }
function gameLoop(timestamp) { if (!gameState.lastTimestamp) gameState.lastTimestamp = timestamp; const dt = Math.min(CONFIG.MAX_DELTA, (timestamp - gameState.lastTimestamp) / 1000); gameState.lastTimestamp = timestamp; update(dt); render(); gameState.animationFrame = requestAnimationFrame(gameLoop); }
function initialize() { cacheDom(); bindEvents(); resetGame(); setPhase("start"); gameState.animationFrame = requestAnimationFrame(gameLoop); }
document.addEventListener("DOMContentLoaded", initialize, { once: true });
