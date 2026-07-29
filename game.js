(() => {
  "use strict";

  const CONFIG = Object.freeze({
    WIDTH: 480,
    HEIGHT: 720,
    MAX_LEVEL: 8,
    INITIAL_LEVEL_MAX: 3,
    SPAWN_Y: 72,
    DANGER_Y: 150,
    DANGER_DURATION_MS: 1800,
    WALL_THICKNESS: 32,
    FIXED_STEP_MS: 1000 / 60,
    MAX_FRAME_MS: 50,
    GRAVITY_Y: 1.15,
    GRAVITY_SCALE: 0.001,
    RESTITUTION: 0.14,
    FRICTION: 0.22,
    FRICTION_AIR: 0.012,
    DENSITY: 0.0012,
    CIRCLE_SIDES: 32,
    SETTLE_SPEED: 0.42,
    SETTLE_ANGULAR_SPEED: 0.035,
    MIN_LOCK_MS: 600,
    MAX_LOCK_MS: 5000,
    NEXT_DELAY_MS: 260,
    GUIDE_DASH: 8,
    GUIDE_GAP: 8,
    GUIDE_WIDTH: 2,
    OUTLINE_WIDTH: 4,
    HIGHLIGHT_RADIUS_RATIO: 0.16,
    HIGHLIGHT_OFFSET_RATIO: 0.34,
    PREVIEW_MIN_RADIUS: 9,
    PREVIEW_MAX_RADIUS: 23,
    PREVIEW_SCALE: 0.24,
    COLORS: Object.freeze({
      backgroundTop: "#17213a",
      backgroundBottom: "#0f1528",
      grid: "rgba(255,255,255,0.035)",
      container: "rgba(203,214,255,0.22)",
      danger: "#ff6577",
      guide: "rgba(255,255,255,0.35)",
      outline: "rgba(9,13,27,0.7)",
      highlight: "rgba(255,255,255,0.5)",
      text: "#ffffff"
    }),
    LEVELS: Object.freeze({
      1: Object.freeze({ radius: 20, score: 10, color: "#55d6be" }),
      2: Object.freeze({ radius: 28, score: 25, color: "#62a8ff" }),
      3: Object.freeze({ radius: 38, score: 60, color: "#8b7cff" }),
      4: Object.freeze({ radius: 50, score: 140, color: "#d675ff" }),
      5: Object.freeze({ radius: 64, score: 320, color: "#ff6fae" }),
      6: Object.freeze({ radius: 80, score: 720, color: "#ff765f" }),
      7: Object.freeze({ radius: 98, score: 1600, color: "#ffbd4a" }),
      8: Object.freeze({ radius: 120, score: 3600, color: "#f5e663" })
    })
  });

  class MergeDropGame {
    constructor() {
      this.gameState = {
        phase: "start",
        score: 0,
        objects: [],
        nextLevel: 1,
        currentObject: null,
        canDrop: false,
        pointerX: CONFIG.WIDTH / 2,
        mergeQueue: [],
        mergingIds: new Set(),
        dangerStartedAt: null,
        nextObjectTimer: null,
        lastTimestamp: 0,
        elapsedMs: 0,
        accumulatorMs: 0,
        nextId: 1,
        droppedObjectId: null,
        dropStartedAt: null,
        engine: null,
        worldBounds: [],
        collisionHandler: null,
        animationFrameId: null,
        loopRunning: false,
        elements: null,
        handlers: null
      };
    }

    initialize() {
      const canvas = document.getElementById("game-canvas");
      const nextCanvas = document.getElementById("next-preview");
      if (!canvas || !nextCanvas || typeof Matter === "undefined") return;

      this.gameState.elements = {
        canvas,
        context: canvas.getContext("2d"),
        nextCanvas,
        nextContext: nextCanvas.getContext("2d"),
        score: document.getElementById("score"),
        finalScore: document.getElementById("final-score"),
        startOverlay: document.getElementById("start-overlay"),
        gameoverOverlay: document.getElementById("gameover-overlay"),
        startButton: document.getElementById("start-button"),
        restartButton: document.getElementById("restart-button")
      };
      this.bindEvents();
      this.resetGame("start");
      this.startLoop();
    }

    createEngine() {
      if (this.gameState.engine && this.gameState.collisionHandler) {
        Matter.Events.off(this.gameState.engine, "collisionStart", this.gameState.collisionHandler);
      }
      const engine = Matter.Engine.create({ enableSleeping: true });
      engine.gravity.y = CONFIG.GRAVITY_Y;
      engine.gravity.scale = CONFIG.GRAVITY_SCALE;
      this.gameState.engine = engine;
      this.gameState.collisionHandler = (event) => this.handleCollisionStart(event);
      Matter.Events.on(engine, "collisionStart", this.gameState.collisionHandler);
      this.createWorldBounds();
    }

    createWorldBounds() {
      const t = CONFIG.WALL_THICKNESS;
      const options = { isStatic: true, label: "boundary" };
      const bounds = [
        Matter.Bodies.rectangle(-t / 2, CONFIG.HEIGHT / 2, t, CONFIG.HEIGHT * 2, options),
        Matter.Bodies.rectangle(CONFIG.WIDTH + t / 2, CONFIG.HEIGHT / 2, t, CONFIG.HEIGHT * 2, options),
        Matter.Bodies.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT + t / 2, CONFIG.WIDTH + t * 2, t, options)
      ];
      this.gameState.worldBounds = bounds;
      Matter.Composite.add(this.gameState.engine.world, bounds);
    }

    bindEvents() {
      const elements = this.gameState.elements;
      const handlers = {
        pointerMove: (event) => this.handlePointerMove(event),
        pointerDown: (event) => this.handlePointerDown(event),
        start: (event) => { event.stopPropagation(); this.startGame(); },
        restart: (event) => { event.stopPropagation(); this.restartGame(); },
        resize: () => this.resizeDisplay()
      };
      this.gameState.handlers = handlers;
      elements.canvas.addEventListener("pointermove", handlers.pointerMove);
      elements.canvas.addEventListener("pointerdown", handlers.pointerDown);
      elements.startButton.addEventListener("pointerdown", handlers.start);
      elements.restartButton.addEventListener("pointerdown", handlers.restart);
      window.addEventListener("resize", handlers.resize);
      this.resizeDisplay();
    }

    unbindEvents() {
      const { elements, handlers } = this.gameState;
      if (!elements || !handlers) return;
      elements.canvas.removeEventListener("pointermove", handlers.pointerMove);
      elements.canvas.removeEventListener("pointerdown", handlers.pointerDown);
      elements.startButton.removeEventListener("pointerdown", handlers.start);
      elements.restartButton.removeEventListener("pointerdown", handlers.restart);
      window.removeEventListener("resize", handlers.resize);
      this.gameState.handlers = null;
    }

    resetGame(phase = "playing") {
      if (this.gameState.engine) {
        Matter.World.clear(this.gameState.engine.world, false);
        Matter.Engine.clear(this.gameState.engine);
      }
      this.gameState.score = 0;
      this.gameState.objects = [];
      this.gameState.nextLevel = 1;
      this.gameState.currentObject = null;
      this.gameState.canDrop = false;
      this.gameState.pointerX = CONFIG.WIDTH / 2;
      this.gameState.mergeQueue = [];
      this.gameState.mergingIds.clear();
      this.gameState.dangerStartedAt = null;
      this.gameState.nextObjectTimer = null;
      this.gameState.lastTimestamp = 0;
      this.gameState.elapsedMs = 0;
      this.gameState.accumulatorMs = 0;
      this.gameState.nextId = 1;
      this.gameState.droppedObjectId = null;
      this.gameState.dropStartedAt = null;
      this.createEngine();
      this.setPhase(phase);
      this.updateScoreUI();
      this.updateNextPreviewUI();
    }

    startGame() {
      if (this.gameState.phase !== "start") return;
      this.setPhase("playing");
      this.gameState.nextLevel = this.chooseNextLevel();
      this.createPreviewObject();
      this.updateNextPreviewUI();
    }

    restartGame() {
      if (this.gameState.phase !== "gameover") return;
      this.resetGame("playing");
      this.gameState.nextLevel = this.chooseNextLevel();
      this.createPreviewObject();
      this.updateNextPreviewUI();
    }

    setPhase(phase) {
      if (!(["start", "playing", "gameover"].includes(phase))) return;
      this.gameState.phase = phase;
      this.gameState.elements.startOverlay.classList.toggle("is-hidden", phase !== "start");
      this.gameState.elements.gameoverOverlay.classList.toggle("is-hidden", phase !== "gameover");
    }

    createObject(level, body = null) {
      const definition = CONFIG.LEVELS[level];
      if (!definition) return null;
      return { id: this.gameState.nextId++, level, radius: definition.radius, score: definition.score, body, removed: false };
    }

    createPhysicsObject(level, x, y) {
      const definition = CONFIG.LEVELS[level];
      if (!definition || !Number.isFinite(x) || !Number.isFinite(y) || !this.gameState.engine) return null;
      const object = this.createObject(level);
      if (!object) return null;
      const body = Matter.Bodies.circle(x, y, definition.radius, {
        restitution: CONFIG.RESTITUTION,
        friction: CONFIG.FRICTION,
        frictionAir: CONFIG.FRICTION_AIR,
        density: CONFIG.DENSITY,
        sleepThreshold: CONFIG.MIN_LOCK_MS / CONFIG.FIXED_STEP_MS,
        label: `monster-${level}`
      }, CONFIG.CIRCLE_SIDES);
      body.plugin = body.plugin || {};
      body.plugin.gameObjectId = object.id;
      object.body = body;
      this.gameState.objects.push(object);
      Matter.Composite.add(this.gameState.engine.world, body);
      return object;
    }

    createPreviewObject() {
      if (this.gameState.phase !== "playing" || this.gameState.currentObject) return;
      const definition = CONFIG.LEVELS[this.gameState.nextLevel];
      if (!definition) return;
      const radius = definition.radius;
      this.gameState.pointerX = this.clampX(this.gameState.pointerX, radius);
      this.gameState.currentObject = this.createObject(this.gameState.nextLevel);
      this.gameState.canDrop = Boolean(this.gameState.currentObject);
      this.gameState.nextLevel = this.chooseNextLevel();
      this.updateNextPreviewUI();
    }

    dropCurrentObject() {
      const preview = this.gameState.currentObject;
      if (this.gameState.phase !== "playing" || !this.gameState.canDrop || !preview) return;
      const object = this.createPhysicsObject(preview.level, this.gameState.pointerX, CONFIG.SPAWN_Y);
      if (!object) return;
      this.gameState.currentObject = null;
      this.gameState.canDrop = false;
      this.gameState.droppedObjectId = object.id;
      this.gameState.dropStartedAt = this.gameState.elapsedMs;
    }

    scheduleNextObject() {
      if (this.gameState.nextObjectTimer === null) {
        this.gameState.nextObjectTimer = CONFIG.NEXT_DELAY_MS;
      }
    }

    isDroppedObjectSettled(object) {
      if (!object || object.removed || !object.body) return true;
      const elapsed = this.gameState.elapsedMs - this.gameState.dropStartedAt;
      const slow = object.body.speed <= CONFIG.SETTLE_SPEED &&
        object.body.angularSpeed <= CONFIG.SETTLE_ANGULAR_SPEED;
      return (elapsed >= CONFIG.MIN_LOCK_MS && slow) || elapsed >= CONFIG.MAX_LOCK_MS;
    }

    chooseNextLevel() {
      return Math.floor(Math.random() * CONFIG.INITIAL_LEVEL_MAX) + 1;
    }

    handleCollisionStart(event) {
      if (this.gameState.phase !== "playing" || !event || !Array.isArray(event.pairs)) return;
      event.pairs.forEach((pair) => {
        if (!pair || !pair.bodyA || !pair.bodyB) return;
        const objectA = this.findObjectByBody(pair.bodyA);
        const objectB = this.findObjectByBody(pair.bodyB);
        if (!objectA || !objectB || objectA.removed || objectB.removed) return;
        if (objectA.level === objectB.level && objectA.level < CONFIG.MAX_LEVEL) {
          this.enqueueMerge(objectA.id, objectB.id);
        }
      });
    }

    enqueueMerge(idA, idB) {
      if (idA === idB || this.gameState.mergingIds.has(idA) || this.gameState.mergingIds.has(idB)) return;
      this.gameState.mergingIds.add(idA);
      this.gameState.mergingIds.add(idB);
      this.gameState.mergeQueue.push({ idA, idB });
    }

    processMergeQueue() {
      const queue = this.gameState.mergeQueue.splice(0);
      queue.forEach((operation) => {
        if (operation) this.mergeObjects(operation.idA, operation.idB);
      });
    }

    mergeObjects(idA, idB) {
      const objectA = this.findObjectById(idA);
      const objectB = this.findObjectById(idB);
      try {
        if (!objectA || !objectB || objectA.removed || objectB.removed ||
            objectA.level !== objectB.level || objectA.level >= CONFIG.MAX_LEVEL ||
            !objectA.body || !objectB.body || !objectA.body.position || !objectB.body.position) return;
        const x = (objectA.body.position.x + objectB.body.position.x) / 2;
        const y = (objectA.body.position.y + objectB.body.position.y) / 2;
        const velocity = {
          x: (objectA.body.velocity.x + objectB.body.velocity.x) / 2,
          y: (objectA.body.velocity.y + objectB.body.velocity.y) / 2
        };
        const nextLevel = objectA.level + 1;
        this.removeGameObject(objectA);
        this.removeGameObject(objectB);
        const merged = this.createPhysicsObject(nextLevel, x, y);
        if (merged && merged.body) Matter.Body.setVelocity(merged.body, velocity);
        this.gameState.score += CONFIG.LEVELS[nextLevel].score;
        this.updateScoreUI();
      } finally {
        this.gameState.mergingIds.delete(idA);
        this.gameState.mergingIds.delete(idB);
      }
    }

    removeGameObject(object) {
      if (!object || object.removed) return;
      object.removed = true;
      if (object.body && this.gameState.engine && Matter.Composite.get(this.gameState.engine.world, object.body.id, "body")) {
        Matter.Composite.remove(this.gameState.engine.world, object.body);
      }
    }

    findObjectByBody(body) {
      const id = body && body.plugin ? body.plugin.gameObjectId : null;
      return Number.isFinite(id) ? this.findObjectById(id) : null;
    }

    findObjectById(id) {
      return this.gameState.objects.find((object) => object && object.id === id && !object.removed) || null;
    }

    update(deltaTime) {
      if (this.gameState.phase !== "playing" || !this.gameState.engine) return;
      this.gameState.elapsedMs += deltaTime;
      this.gameState.accumulatorMs += deltaTime;
      while (this.gameState.accumulatorMs >= CONFIG.FIXED_STEP_MS) {
        Matter.Engine.update(this.gameState.engine, CONFIG.FIXED_STEP_MS);
        this.gameState.accumulatorMs -= CONFIG.FIXED_STEP_MS;
      }
      this.processMergeQueue();
      this.gameState.objects = this.gameState.objects.filter((object) =>
        object && !object.removed && object.body && object.body.position);
      this.updateDropLock(deltaTime);
      this.updateDangerState();
    }

    updateDropLock(deltaTime) {
      if (this.gameState.droppedObjectId !== null) {
        const object = this.findObjectById(this.gameState.droppedObjectId);
        if (this.isDroppedObjectSettled(object)) {
          this.gameState.droppedObjectId = null;
          this.gameState.dropStartedAt = null;
          this.scheduleNextObject();
        }
      }
      if (this.gameState.nextObjectTimer !== null) {
        this.gameState.nextObjectTimer -= deltaTime;
        if (this.gameState.nextObjectTimer <= 0) {
          this.gameState.nextObjectTimer = null;
          this.createPreviewObject();
        }
      }
    }

    updateDangerState() {
      const dangerous = this.gameState.objects.some((object) => object && !object.removed && object.body &&
        object.body.position && !this.gameState.mergingIds.has(object.id) &&
        object.body.position.y - object.radius <= CONFIG.DANGER_Y);
      if (!dangerous) {
        this.gameState.dangerStartedAt = null;
        return;
      }
      if (this.gameState.dangerStartedAt === null) this.gameState.dangerStartedAt = this.gameState.elapsedMs;
      if (this.gameState.elapsedMs - this.gameState.dangerStartedAt >= CONFIG.DANGER_DURATION_MS) this.triggerGameOver();
    }

    triggerGameOver() {
      if (this.gameState.phase !== "playing") return;
      this.gameState.canDrop = false;
      this.gameState.currentObject = null;
      this.gameState.nextObjectTimer = null;
      this.gameState.elements.finalScore.textContent = String(this.gameState.score);
      this.setPhase("gameover");
    }

    updateScoreUI() {
      this.gameState.elements.score.textContent = String(this.gameState.score);
    }

    updateNextPreviewUI() {
      const context = this.gameState.elements.nextContext;
      const canvas = this.gameState.elements.nextCanvas;
      context.clearRect(0, 0, canvas.width, canvas.height);
      const definition = CONFIG.LEVELS[this.gameState.nextLevel];
      if (!definition) return;
      const radius = Math.min(CONFIG.PREVIEW_MAX_RADIUS, Math.max(CONFIG.PREVIEW_MIN_RADIUS, definition.radius * CONFIG.PREVIEW_SCALE));
      this.renderObjectFallback(context, canvas.width / 2, canvas.height / 2, radius, this.gameState.nextLevel, 0);
    }

    resizeDisplay() {
      // CSS owns responsive sizing; fixed backing dimensions preserve deterministic physics.
      const canvas = this.gameState.elements.canvas;
      canvas.width = CONFIG.WIDTH;
      canvas.height = CONFIG.HEIGHT;
    }

    handlePointerMove(event) {
      if (this.gameState.phase !== "playing" || !this.gameState.canDrop || !this.gameState.currentObject) return;
      const x = this.clientToCanvasX(event.clientX);
      if (x !== null) this.gameState.pointerX = this.clampX(x, this.gameState.currentObject.radius);
    }

    handlePointerDown(event) {
      if (this.gameState.phase !== "playing" || !this.gameState.canDrop) return;
      event.preventDefault();
      const x = this.clientToCanvasX(event.clientX);
      if (x !== null && this.gameState.currentObject) {
        this.gameState.pointerX = this.clampX(x, this.gameState.currentObject.radius);
        this.dropCurrentObject();
      }
    }

    clientToCanvasX(clientX) {
      const rect = this.gameState.elements.canvas.getBoundingClientRect();
      if (!rect.width || clientX < rect.left || clientX > rect.right) return null;
      return (clientX - rect.left) * (CONFIG.WIDTH / rect.width);
    }

    clampX(x, radius) {
      return Math.max(radius, Math.min(CONFIG.WIDTH - radius, x));
    }

    render() {
      const context = this.gameState.elements.context;
      context.clearRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
      this.renderBackground(context);
      this.renderContainer(context);
      this.renderDangerLine(context);
      this.renderAimGuide(context);
      this.renderObjects(context);
      this.renderPreview(context);
    }

    renderBackground(context) {
      const gradient = context.createLinearGradient(0, 0, 0, CONFIG.HEIGHT);
      gradient.addColorStop(0, CONFIG.COLORS.backgroundTop);
      gradient.addColorStop(1, CONFIG.COLORS.backgroundBottom);
      context.fillStyle = gradient;
      context.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
      context.strokeStyle = CONFIG.COLORS.grid;
      context.lineWidth = 1;
      for (let y = 0; y < CONFIG.HEIGHT; y += CONFIG.WALL_THICKNESS) {
        context.beginPath(); context.moveTo(0, y); context.lineTo(CONFIG.WIDTH, y); context.stroke();
      }
    }

    renderContainer(context) {
      context.strokeStyle = CONFIG.COLORS.container;
      context.lineWidth = CONFIG.OUTLINE_WIDTH;
      context.strokeRect(1, 1, CONFIG.WIDTH - 2, CONFIG.HEIGHT - 2);
    }

    renderDangerLine(context) {
      context.save();
      context.setLineDash([CONFIG.GUIDE_DASH, CONFIG.GUIDE_GAP]);
      context.strokeStyle = CONFIG.COLORS.danger;
      context.lineWidth = CONFIG.GUIDE_WIDTH;
      context.beginPath(); context.moveTo(0, CONFIG.DANGER_Y); context.lineTo(CONFIG.WIDTH, CONFIG.DANGER_Y); context.stroke();
      context.restore();
    }

    renderAimGuide(context) {
      if (this.gameState.phase !== "playing" || !this.gameState.canDrop || !this.gameState.currentObject) return;
      context.save();
      context.setLineDash([CONFIG.GUIDE_DASH, CONFIG.GUIDE_GAP]);
      context.strokeStyle = CONFIG.COLORS.guide;
      context.lineWidth = CONFIG.GUIDE_WIDTH;
      context.beginPath();
      context.moveTo(this.gameState.pointerX, CONFIG.SPAWN_Y + this.gameState.currentObject.radius);
      context.lineTo(this.gameState.pointerX, CONFIG.HEIGHT);
      context.stroke();
      context.restore();
    }

    renderObjects(context) {
      this.gameState.objects.forEach((object) => {
        if (!object || object.removed || !object.body || !object.body.position) return;
        this.renderObjectFallback(context, object.body.position.x, object.body.position.y, object.radius, object.level, object.body.angle);
      });
    }

    renderObjectFallback(context, x, y, radius, level, angle) {
      const definition = CONFIG.LEVELS[level];
      if (!definition) return;
      context.save();
      context.translate(x, y);
      context.rotate(Number.isFinite(angle) ? angle : 0);
      context.beginPath(); context.arc(0, 0, radius, 0, Math.PI * 2);
      context.fillStyle = definition.color; context.fill();
      context.strokeStyle = CONFIG.COLORS.outline; context.lineWidth = Math.min(CONFIG.OUTLINE_WIDTH, radius / 5); context.stroke();
      context.beginPath();
      context.arc(-radius * CONFIG.HIGHLIGHT_OFFSET_RATIO, -radius * CONFIG.HIGHLIGHT_OFFSET_RATIO,
        radius * CONFIG.HIGHLIGHT_RADIUS_RATIO, 0, Math.PI * 2);
      context.fillStyle = CONFIG.COLORS.highlight; context.fill();
      context.fillStyle = CONFIG.COLORS.text;
      context.font = `800 ${Math.max(12, radius * 0.72)}px system-ui, sans-serif`;
      context.textAlign = "center"; context.textBaseline = "middle";
      context.shadowColor = CONFIG.COLORS.outline; context.shadowBlur = 3;
      context.fillText(String(level), 0, radius * 0.05);
      context.restore();
    }

    renderPreview(context) {
      const object = this.gameState.currentObject;
      if (this.gameState.phase !== "playing" || !object) return;
      this.renderObjectFallback(context, this.gameState.pointerX, CONFIG.SPAWN_Y, object.radius, object.level, 0);
    }

    startLoop() {
      if (this.gameState.loopRunning) return;
      this.gameState.loopRunning = true;
      const tick = (timestamp) => {
        if (!this.gameState.loopRunning) return;
        const previous = this.gameState.lastTimestamp || timestamp;
        const delta = Math.min(CONFIG.MAX_FRAME_MS, Math.max(0, timestamp - previous));
        this.gameState.lastTimestamp = timestamp;
        this.update(delta);
        this.render();
        this.gameState.animationFrameId = requestAnimationFrame(tick);
      };
      this.gameState.animationFrameId = requestAnimationFrame(tick);
    }

    stopLoop() {
      this.gameState.loopRunning = false;
      if (this.gameState.animationFrameId !== null) cancelAnimationFrame(this.gameState.animationFrameId);
      this.gameState.animationFrameId = null;
    }
  }

  const game = new MergeDropGame();
  game.initialize();
})();
