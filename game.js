'use strict';

const CONFIG = Object.freeze({
  width:960,height:540,maxDelta:0.034,worldMargin:90,backgroundSpeed:28,gridSpeed:44,starCount:82,
  colors:{space:'#030619',cyan:'#42f5ff',blue:'#608cff',pink:'#ff4fcc',red:'#ff466d',orange:'#ff9347',white:'#f4ffff',grid:'#1d3f73',boss:'#b94dff'},
  player:{startX:145,startY:270,width:47,height:27,radius:19,hitRadius:6,collectRadius:26,maxHp:3,moveLerp:12,keyboardSpeed:350,slowFactor:0.38,invincible:1.7,clearRadius:155,flashRate:12,trailInterval:0.035},
  weapons:{
    1:{interval:0.22,shots:[{dy:0,angle:0,damage:1,penetrating:false,speed:620}],core:{score:100,color:'#49f4ff',size:12}},
    2:{interval:0.19,shots:[{dy:-7,angle:0,damage:1,penetrating:false,speed:640},{dy:7,angle:0,damage:1,penetrating:false,speed:640}],core:{score:250,color:'#75ff7c',size:14}},
    3:{interval:0.18,shots:[{dy:0,angle:-0.16,damage:1,penetrating:false,speed:650},{dy:0,angle:0,damage:1,penetrating:false,speed:650},{dy:0,angle:0.16,damage:1,penetrating:false,speed:650}],core:{score:600,color:'#ffe658',size:16}},
    4:{interval:0.17,shots:[{dy:-10,angle:0,damage:1,penetrating:false,speed:670},{dy:0,angle:0,damage:2,penetrating:true,speed:560},{dy:10,angle:0,damage:1,penetrating:false,speed:670}],core:{score:1400,color:'#ff7a45',size:18}},
    5:{interval:0.15,shots:[{dy:0,angle:-0.25,damage:1,penetrating:false,speed:680},{dy:0,angle:-0.12,damage:1,penetrating:false,speed:680},{dy:0,angle:0,damage:1,penetrating:false,speed:680},{dy:0,angle:0.12,damage:1,penetrating:false,speed:680},{dy:0,angle:0.25,damage:1,penetrating:false,speed:680},{dy:0,angle:0,damage:2,penetrating:true,speed:480}],core:{score:3200,color:'#ff4fc8',size:21}}
  },
  bullet:{playerRadius:5,penetratingRadius:8,enemyRadius:6,enemySpeed:205},
  enemies:{
    scout:{width:39,height:28,radius:17,hp:4,speed:105,fireInterval:2.15,score:180,dropChance:0.42},
    weaver:{width:47,height:35,radius:21,hp:8,speed:82,fireInterval:2.55,score:420,dropChance:0.58,waveAmplitude:72,waveFrequency:2.1,spread:0.22}
  },
  core:{traySize:6,maxLevel:5,nextLevelTwoChance:0.24,driftSpeed:54,attractDistance:150,attractStrength:5.5,orbitSpeed:2.5,collectionScoreFactor:0.35},
  combo:{timeout:3.2,maxMultiplier:5,mergeGain:0.35,killGain:0.12},
  stage:{earlyEnd:20,midEnd:45,bossTime:70,displayDuration:90,spawnEarly:2.15,spawnMid:1.55,spawnLate:1.0,lateSpeedScale:1.25},
  boss:{name:'CORE CARRIER',width:132,height:164,radius:67,hp:420,speed:86,targetX:790,entrySpeed:95,score:15000,thresholdScore:1600,thresholds:[0.75,0.5,0.25],patternDuration:6,aimedInterval:0.55,fanInterval:1.25,laneInterval:0.72,aimedBurst:3,burstSpread:0.1,fanCount:9,fanArc:1.7,laneCount:8,laneGap:2,laneSpeed:175,verticalRange:155},
  particle:{smallCount:9,mergeCount:22,hitCount:18,bossCount:90,life:0.65,bossLife:1.5,speed:120,bossSpeed:250,size:3},
  text:{life:1.1,riseSpeed:38},shake:{hit:10,merge:5,boss:18,decay:28,trayTime:0.2,weaponFlash:0.22,warning:0.55},
  scoring:{bossDamageUnit:1}, keyboard:{diagonal:0.7071}, render:{lineWidth:2,glow:18,starMin:1,starRange:2,gridGap:60,nebulaAlpha:0.16,lowHpAlpha:0.18,shipFlashAlpha:0.28,coreRingGap:7,fontSmall:11,fontMedium:15,fontLarge:22,bossBarWidth:500,bossBarHeight:14,bossBarY:19,bossBarX:230},
  ids:{start:1}, random:{half:0.5,fullCircle:Math.PI*2}, time:{minute:60,pad:2}, input:{pointerIdNone:-1}
});

const game = (() => {
  const gameState = {
    phase:'start',result:null,elapsedTime:0,score:0,scoreMultiplier:1,combo:0,comboTimer:0,
    player:null,enemies:[],playerBullets:[],enemyBullets:[],cores:[],particles:[],floatingTexts:[],
    coreTray:[],activeWeaponLevel:1,nextCoreLevel:1,spawnTimers:{enemy:0},boss:null,bossSpawned:false,
    input:{pointerX:CONFIG.player.startX,pointerY:CONFIG.player.startY,slowMode:false,pointerActive:false,pointerId:CONFIG.input.pointerIdNone,keys:new Set()},
    lastTimestamp:0,entityId:CONFIG.ids.start,screenShake:0,trayShake:0,weaponFlash:0,warningFlash:0,
    backgroundOffset:0,gridOffset:0,stars:[],dom:{},ctx:null,animationFrame:null
  };

  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const distanceSquared=(a,b)=>{const dx=a.x-b.x;const dy=a.y-b.y;return dx*dx+dy*dy;};
  const circlesTouch=(a,b,ar=a.radius,br=b.radius)=>distanceSquared(a,b)<=(ar+br)*(ar+br);
  const nextId=()=>gameState.entityId++;
  const randomRange=(min,max)=>min+Math.random()*(max-min);
  const addScore=(amount)=>{gameState.score+=Math.round(amount*gameState.scoreMultiplier);};

  function cacheDom(){
    const ids=['game-canvas','score','multiplier','combo','hp','weapon-level','stage-time','core-tray','next-core','start-overlay','result-overlay','result-kicker','result-title','final-score','start-button','restart-button'];
    ids.forEach(id=>{gameState.dom[id]=document.getElementById(id);});
    const canvas=gameState.dom['game-canvas'];
    gameState.ctx=canvas?canvas.getContext('2d'):null;
  }

  function createStars(){
    gameState.stars=Array.from({length:CONFIG.starCount},()=>({x:Math.random()*CONFIG.width,y:Math.random()*CONFIG.height,size:CONFIG.render.starMin+Math.random()*CONFIG.render.starRange,depth:randomRange(CONFIG.random.half,CONFIG.render.starRange)}));
  }

  function createPlayer(){return {id:nextId(),type:'player',active:true,x:CONFIG.player.startX,y:CONFIG.player.startY,targetX:CONFIG.player.startX,targetY:CONFIG.player.startY,radius:CONFIG.player.radius,hitRadius:CONFIG.player.hitRadius,hp:CONFIG.player.maxHp,maxHp:CONFIG.player.maxHp,invincible:0,fireTimer:0,trailTimer:0};}

  function resetGame(){
    gameState.result=null;gameState.elapsedTime=0;gameState.score=0;gameState.scoreMultiplier=1;gameState.combo=0;gameState.comboTimer=0;
    gameState.enemies=[];gameState.playerBullets=[];gameState.enemyBullets=[];gameState.cores=[];gameState.particles=[];gameState.floatingTexts=[];
    gameState.coreTray=[];gameState.activeWeaponLevel=1;gameState.nextCoreLevel=chooseNextCoreLevel();gameState.spawnTimers={enemy:0};gameState.boss=null;gameState.bossSpawned=false;
    gameState.entityId=CONFIG.ids.start;gameState.player=createPlayer();gameState.input.pointerX=CONFIG.player.startX;gameState.input.pointerY=CONFIG.player.startY;gameState.input.slowMode=false;gameState.input.pointerActive=false;gameState.input.pointerId=CONFIG.input.pointerIdNone;gameState.input.keys.clear();
    gameState.screenShake=0;gameState.trayShake=0;gameState.weaponFlash=0;gameState.warningFlash=0;gameState.backgroundOffset=0;gameState.gridOffset=0;gameState.lastTimestamp=0;createStars();syncHud();
  }

  function setPhase(phase){
    gameState.phase=phase;
    const start=gameState.dom['start-overlay'];const result=gameState.dom['result-overlay'];
    if(start)start.classList.toggle('hidden',phase!=='start');
    if(result)result.classList.toggle('hidden',phase!=='gameover');
  }
  function startGame(){resetGame();setPhase('playing');}
  function restartGame(){startGame();}

  function bindEvents(){
    const canvas=gameState.dom['game-canvas'];
    const stop=e=>e.stopPropagation();
    ['start-button','restart-button'].forEach(id=>{const button=gameState.dom[id];if(button){button.addEventListener('pointerdown',stop);button.addEventListener('click',id==='start-button'?startGame:restartGame);}});
    if(canvas){
      canvas.addEventListener('pointermove',event=>handlePointer(event));
      canvas.addEventListener('pointerdown',event=>{if(gameState.phase!=='playing')return;handlePointer(event);gameState.input.pointerActive=true;gameState.input.pointerId=event.pointerId;gameState.input.slowMode=true;canvas.setPointerCapture(event.pointerId);event.preventDefault();});
      const release=event=>{if(gameState.phase!=='playing'||event.pointerId!==gameState.input.pointerId)return;gameState.input.pointerActive=false;gameState.input.pointerId=CONFIG.input.pointerIdNone;gameState.input.slowMode=gameState.input.keys.has('ShiftLeft')||gameState.input.keys.has('ShiftRight');};
      canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
    }
    window.addEventListener('keydown',event=>{if(gameState.phase!=='playing')return;const valid=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight'];if(valid.includes(event.code)){gameState.input.keys.add(event.code);gameState.input.slowMode=event.shiftKey||gameState.input.pointerActive;event.preventDefault();}});
    window.addEventListener('keyup',event=>{gameState.input.keys.delete(event.code);gameState.input.slowMode=gameState.input.pointerActive||gameState.input.keys.has('ShiftLeft')||gameState.input.keys.has('ShiftRight');});
    window.addEventListener('blur',()=>{gameState.input.keys.clear();gameState.input.slowMode=gameState.input.pointerActive;});
  }

  function handlePointer(event){
    if(gameState.phase!=='playing')return;const canvas=gameState.dom['game-canvas'];if(!canvas)return;const rect=canvas.getBoundingClientRect();
    gameState.input.pointerX=clamp((event.clientX-rect.left)*CONFIG.width/rect.width,CONFIG.player.radius,CONFIG.width-CONFIG.player.radius);
    gameState.input.pointerY=clamp((event.clientY-rect.top)*CONFIG.height/rect.height,CONFIG.player.radius,CONFIG.height-CONFIG.player.radius);
  }

  function chooseNextCoreLevel(){return Math.random()<CONFIG.core.nextLevelTwoChance?2:1;}
  function createEnemy(type,y){const def=CONFIG.enemies[type];if(!def)return null;return {id:nextId(),type,active:true,x:CONFIG.width+def.radius,y,baseY:y,radius:def.radius,width:def.width,height:def.height,hp:def.hp,maxHp:def.hp,speed:def.speed,fireTimer:randomRange(def.fireInterval*CONFIG.random.half,def.fireInterval),age:0};}
  function spawnEnemyForStage(){
    if(gameState.elapsedTime>=CONFIG.stage.bossTime)return;let type='scout';if(gameState.elapsedTime>=CONFIG.stage.earlyEnd)type=Math.random()<CONFIG.random.half?'scout':'weaver';
    const def=CONFIG.enemies[type];const enemy=createEnemy(type,randomRange(def.radius,CONFIG.height-def.radius));if(enemy){if(gameState.elapsedTime>=CONFIG.stage.midEnd)enemy.speed*=CONFIG.stage.lateSpeedScale;gameState.enemies.push(enemy);}
  }
  function createBoss(){return {id:nextId(),type:'boss',name:CONFIG.boss.name,active:true,x:CONFIG.width+CONFIG.boss.radius,y:CONFIG.height*CONFIG.random.half,radius:CONFIG.boss.radius,width:CONFIG.boss.width,height:CONFIG.boss.height,hp:CONFIG.boss.hp,maxHp:CONFIG.boss.hp,entered:false,direction:1,pattern:0,patternTime:0,fireTimer:0,thresholds:[...CONFIG.boss.thresholds]};}
  function createPlayerBullet(x,y,shot){const speed=shot.speed;return {id:nextId(),type:'playerBullet',active:true,x,y,vx:Math.cos(shot.angle)*speed,vy:Math.sin(shot.angle)*speed,radius:shot.penetrating?CONFIG.bullet.penetratingRadius:CONFIG.bullet.playerRadius,damage:shot.damage,penetrating:shot.penetrating,hitIds:new Set()};}
  function createEnemyBullet(x,y,angle,speed=CONFIG.bullet.enemySpeed){return {id:nextId(),type:'enemyBullet',active:true,x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,radius:CONFIG.bullet.enemyRadius};}
  function createCore(x,y,level){const def=CONFIG.weapons[level]?.core;if(!def)return null;return {id:nextId(),type:'core',active:true,x,y,vx:-CONFIG.core.driftSpeed,vy:randomRange(-CONFIG.core.driftSpeed*CONFIG.random.half,CONFIG.core.driftSpeed*CONFIG.random.half),radius:def.size,level,score:def.score};}

  function update(dt){
    if(gameState.phase!=='playing')return;gameState.elapsedTime+=dt;gameState.backgroundOffset+=CONFIG.backgroundSpeed*dt;gameState.gridOffset+=CONFIG.gridSpeed*dt;
    updatePlayer(dt);updatePlayerFiring(dt);updateStage(dt);updateEnemies(dt);updateBoss(dt);updateBullets(dt);updateCores(dt);updateParticles(dt);updateCombo(dt);checkCollisions();cleanupEntities();syncHud();
  }
  function updateStage(dt){
    if(gameState.elapsedTime>=CONFIG.stage.bossTime&&!gameState.bossSpawned){gameState.bossSpawned=true;gameState.boss=createBoss();return;}
    if(gameState.elapsedTime>=CONFIG.stage.bossTime)return;gameState.spawnTimers.enemy-=dt;if(gameState.spawnTimers.enemy<=0){spawnEnemyForStage();gameState.spawnTimers.enemy=gameState.elapsedTime<CONFIG.stage.earlyEnd?CONFIG.stage.spawnEarly:gameState.elapsedTime<CONFIG.stage.midEnd?CONFIG.stage.spawnMid:CONFIG.stage.spawnLate;}
  }
  function updatePlayer(dt){
    const p=gameState.player;if(!p||!p.active)return;p.invincible=Math.max(0,p.invincible-dt);p.trailTimer-=dt;
    let dx=0,dy=0;const keys=gameState.input.keys;if(keys.has('ArrowLeft')||keys.has('KeyA'))dx--;if(keys.has('ArrowRight')||keys.has('KeyD'))dx++;if(keys.has('ArrowUp')||keys.has('KeyW'))dy--;if(keys.has('ArrowDown')||keys.has('KeyS'))dy++;
    const slow=gameState.input.slowMode?CONFIG.player.slowFactor:1;if(dx||dy){const norm=dx&&dy?CONFIG.keyboard.diagonal:1;p.targetX=clamp(p.x+dx*CONFIG.player.keyboardSpeed*slow*norm*dt,p.radius,CONFIG.width-p.radius);p.targetY=clamp(p.y+dy*CONFIG.player.keyboardSpeed*slow*norm*dt,p.radius,CONFIG.height-p.radius);}else{p.targetX=gameState.input.pointerX;p.targetY=gameState.input.pointerY;}
    const lerp=clamp(CONFIG.player.moveLerp*slow*dt,0,1);p.x+=(p.targetX-p.x)*lerp;p.y+=(p.targetY-p.y)*lerp;
    if(p.trailTimer<=0){createParticles(p.x-p.radius,p.y,CONFIG.colors.cyan,1,CONFIG.particle.life*CONFIG.random.half,CONFIG.particle.speed*CONFIG.random.half);p.trailTimer=CONFIG.player.trailInterval;}
  }
  function updatePlayerFiring(dt){const p=gameState.player;const weapon=CONFIG.weapons[gameState.activeWeaponLevel];if(!p||!weapon)return;p.fireTimer-=dt;if(p.fireTimer>0)return;weapon.shots.forEach(shot=>gameState.playerBullets.push(createPlayerBullet(p.x+p.radius,p.y+shot.dy,shot)));p.fireTimer=weapon.interval;}
  function updateEnemies(dt){
    gameState.enemies.forEach(enemy=>{if(!enemy?.active)return;const def=CONFIG.enemies[enemy.type];if(!def)return;enemy.age+=dt;enemy.x-=enemy.speed*dt;if(enemy.type==='weaver')enemy.y=clamp(enemy.baseY+Math.sin(enemy.age*def.waveFrequency)*def.waveAmplitude,enemy.radius,CONFIG.height-enemy.radius);enemy.fireTimer-=dt;if(enemy.fireTimer<=0){fireEnemy(enemy,def);enemy.fireTimer=def.fireInterval*(gameState.elapsedTime>=CONFIG.stage.midEnd?CONFIG.random.half:1);}if(enemy.x<-CONFIG.worldMargin)enemy.active=false;});
  }
  function fireEnemy(enemy,def){const p=gameState.player;if(!p)return;const aimed=Math.atan2(p.y-enemy.y,p.x-enemy.x);if(enemy.type==='scout'){gameState.enemyBullets.push(createEnemyBullet(enemy.x,enemy.y,aimed));return;}[-def.spread,0,def.spread].forEach(offset=>gameState.enemyBullets.push(createEnemyBullet(enemy.x,enemy.y,aimed+offset)));}

  function updateBoss(dt){
    const boss=gameState.boss;if(!boss?.active)return;if(!boss.entered){boss.x-=CONFIG.boss.entrySpeed*dt;if(boss.x<=CONFIG.boss.targetX){boss.x=CONFIG.boss.targetX;boss.entered=true;}return;}
    boss.y+=boss.direction*CONFIG.boss.speed*dt;if(boss.y<CONFIG.height*CONFIG.random.half-CONFIG.boss.verticalRange||boss.y>CONFIG.height*CONFIG.random.half+CONFIG.boss.verticalRange)boss.direction*=-1;
    boss.patternTime+=dt;boss.fireTimer-=dt;if(boss.patternTime>=CONFIG.boss.patternDuration){boss.pattern=(boss.pattern+1)%3;boss.patternTime=0;boss.fireTimer=0;}if(boss.fireTimer>0)return;
    if(boss.pattern===0){fireBossAimed(boss);boss.fireTimer=CONFIG.boss.aimedInterval;}else if(boss.pattern===1){fireBossFan(boss);boss.fireTimer=CONFIG.boss.fanInterval;}else{fireBossLanes(boss);boss.fireTimer=CONFIG.boss.laneInterval;}
  }
  function fireBossAimed(boss){const p=gameState.player;if(!p)return;const base=Math.atan2(p.y-boss.y,p.x-boss.x);for(let i=0;i<CONFIG.boss.aimedBurst;i++){const offset=(i-(CONFIG.boss.aimedBurst-1)*CONFIG.random.half)*CONFIG.boss.burstSpread;gameState.enemyBullets.push(createEnemyBullet(boss.x-boss.radius,boss.y,base+offset));}}
  function fireBossFan(boss){for(let i=0;i<CONFIG.boss.fanCount;i++){const angle=Math.PI-CONFIG.boss.fanArc*CONFIG.random.half+CONFIG.boss.fanArc*i/(CONFIG.boss.fanCount-1);gameState.enemyBullets.push(createEnemyBullet(boss.x-boss.radius,boss.y,angle));}}
  function fireBossLanes(boss){const gapIndex=Math.floor(Math.random()*(CONFIG.boss.laneCount-CONFIG.boss.laneGap));for(let i=0;i<CONFIG.boss.laneCount;i++){if(i>=gapIndex&&i<gapIndex+CONFIG.boss.laneGap)continue;const y=(i+CONFIG.random.half)*CONFIG.height/CONFIG.boss.laneCount;gameState.enemyBullets.push(createEnemyBullet(boss.x-boss.radius,y,Math.PI,CONFIG.boss.laneSpeed));}}

  function updateBullets(dt){[gameState.playerBullets,gameState.enemyBullets].forEach(list=>list.forEach(b=>{if(!b?.active)return;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.x<-CONFIG.worldMargin||b.x>CONFIG.width+CONFIG.worldMargin||b.y<-CONFIG.worldMargin||b.y>CONFIG.height+CONFIG.worldMargin)b.active=false;}));}
  function updateCores(dt){
    const p=gameState.player;if(!p)return;gameState.cores.forEach(core=>{if(!core?.active)return;const distance=distanceSquared(core,p);if(distance<CONFIG.core.attractDistance*CONFIG.core.attractDistance){core.vx+=(p.x-core.x)*CONFIG.core.attractStrength*dt;core.vy+=(p.y-core.y)*CONFIG.core.attractStrength*dt;}core.x+=core.vx*dt;core.y+=core.vy*dt;if(core.x<-CONFIG.worldMargin)core.active=false;});
  }
  function updateParticles(dt){gameState.particles.forEach(p=>{if(!p)return;p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;p.vx*=1-dt;p.vy*=1-dt;});gameState.floatingTexts.forEach(t=>{if(!t)return;t.y-=CONFIG.text.riseSpeed*dt;t.life-=dt;});gameState.screenShake=Math.max(0,gameState.screenShake-CONFIG.shake.decay*dt);gameState.trayShake=Math.max(0,gameState.trayShake-dt);gameState.weaponFlash=Math.max(0,gameState.weaponFlash-dt);gameState.warningFlash=Math.max(0,gameState.warningFlash-dt);}
  function updateCombo(dt){if(gameState.combo<=0)return;gameState.comboTimer-=dt;if(gameState.comboTimer<=0){gameState.combo=0;gameState.scoreMultiplier=1;}}

  function checkCollisions(){
    const p=gameState.player;if(!p)return;
    gameState.playerBullets.forEach(bullet=>{if(!bullet?.active)return;gameState.enemies.forEach(enemy=>{if(!enemy?.active||!bullet.active||bullet.hitIds.has(enemy.id)||!circlesTouch(bullet,enemy))return;handlePlayerBulletHit(bullet,enemy);});const boss=gameState.boss;if(boss?.active&&bullet.active&&!bullet.hitIds.has(boss.id)&&circlesTouch(bullet,boss))handlePlayerBulletHit(bullet,boss);});
    gameState.enemyBullets.forEach(bullet=>{if(bullet?.active&&circlesTouch(bullet,p,bullet.radius,p.hitRadius)){bullet.active=false;damagePlayer();}});
    gameState.enemies.forEach(enemy=>{if(enemy?.active&&circlesTouch(enemy,p,enemy.radius,p.hitRadius)){enemy.active=false;damagePlayer();}});
    const boss=gameState.boss;if(boss?.active&&circlesTouch(boss,p,boss.radius,p.hitRadius))damagePlayer();
    gameState.cores.forEach(core=>{if(core?.active&&circlesTouch(core,p,core.radius,p.radius)){collectCore(core);}});
  }
  function handlePlayerBulletHit(bullet,target){bullet.hitIds.add(target.id);if(target.type==='boss')damageBoss(bullet.damage);else damageEnemy(target,bullet.damage);if(!bullet.penetrating)bullet.active=false;createParticles(bullet.x,bullet.y,CONFIG.colors.white,CONFIG.particle.smallCount,CONFIG.particle.life,CONFIG.particle.speed);}
  function damageEnemy(enemy,damage){if(!enemy?.active)return;enemy.hp-=damage;if(enemy.hp<=0)destroyEnemy(enemy);}
  function destroyEnemy(enemy){enemy.active=false;const def=CONFIG.enemies[enemy.type];if(!def)return;addScore(def.score);increaseCombo(CONFIG.combo.killGain);createParticles(enemy.x,enemy.y,CONFIG.colors.pink,CONFIG.particle.hitCount,CONFIG.particle.life,CONFIG.particle.speed);addFloatingText(enemy.x,enemy.y,`+${Math.round(def.score*gameState.scoreMultiplier)}`,CONFIG.colors.white);if(Math.random()<def.dropChance){const core=createCore(enemy.x,enemy.y,gameState.nextCoreLevel);if(core){gameState.cores.push(core);gameState.nextCoreLevel=chooseNextCoreLevel();}}}
  function damageBoss(damage){const boss=gameState.boss;if(!boss?.active)return;boss.hp-=damage;addScore(damage*CONFIG.scoring.bossDamageUnit);while(boss.thresholds.length&&boss.hp/boss.maxHp<=boss.thresholds[0]){boss.thresholds.shift();addScore(CONFIG.boss.thresholdScore);const core=createCore(boss.x-boss.radius,boss.y,2);if(core)gameState.cores.push(core);addFloatingText(boss.x-boss.radius,boss.y,'CORE EJECTED',CONFIG.weapons[2].core.color);createParticles(boss.x,boss.y,CONFIG.weapons[2].core.color,CONFIG.particle.mergeCount,CONFIG.particle.life,CONFIG.particle.speed);}if(boss.hp<=0)triggerClear();}
  function damagePlayer(){const p=gameState.player;if(!p||p.invincible>0||gameState.phase!=='playing')return;p.hp--;p.invincible=CONFIG.player.invincible;gameState.combo=0;gameState.comboTimer=0;gameState.scoreMultiplier=1;gameState.enemyBullets.forEach(b=>{if(b?.active&&distanceSquared(b,p)<=CONFIG.player.clearRadius*CONFIG.player.clearRadius)b.active=false;});gameState.screenShake=CONFIG.shake.hit;createParticles(p.x,p.y,CONFIG.colors.red,CONFIG.particle.hitCount,CONFIG.particle.life,CONFIG.particle.speed);addFloatingText(p.x,p.y,'HULL HIT',CONFIG.colors.red);if(p.hp<=0)triggerDefeat();}

  function collectCore(core){
    core.active=false;if(gameState.coreTray.length>=CONFIG.core.traySize){triggerCoreRejected(core);return;}gameState.coreTray.push(core.level);addScore(core.score*CONFIG.core.collectionScoreFactor);addFloatingText(core.x,core.y,`CORE ${core.level}`,CONFIG.weapons[core.level].core.color);mergeCoreTray();recalculateWeaponLevel();syncHud();
  }
  function mergeCoreTray(){
    const counts=Array(CONFIG.core.maxLevel+1).fill(0);gameState.coreTray.forEach(level=>{if(level>=1&&level<=CONFIG.core.maxLevel)counts[level]++;});
    for(let level=1;level<CONFIG.core.maxLevel;level++){const merges=Math.floor(counts[level]/2);counts[level]%=2;counts[level+1]+=merges;for(let i=0;i<merges;i++)applyMerge(level+1);}
    const rebuilt=[];for(let level=1;level<=CONFIG.core.maxLevel;level++){for(let count=0;count<counts[level];count++)rebuilt.push(level);}gameState.coreTray=rebuilt.slice(0,CONFIG.core.traySize);
  }
  function applyMerge(resultLevel){const def=CONFIG.weapons[resultLevel]?.core;if(!def)return;addScore(def.score);increaseCombo(CONFIG.combo.mergeGain);gameState.trayShake=CONFIG.shake.trayTime;gameState.weaponFlash=CONFIG.shake.weaponFlash;gameState.screenShake=Math.max(gameState.screenShake,CONFIG.shake.merge);const p=gameState.player;if(p){createParticles(p.x,p.y,def.color,CONFIG.particle.mergeCount,CONFIG.particle.life,CONFIG.particle.speed);addFloatingText(p.x,p.y-CONFIG.player.radius,`MERGE → LV.${resultLevel}  +${Math.round(def.score*gameState.scoreMultiplier)}`,def.color);}}
  function recalculateWeaponLevel(){gameState.activeWeaponLevel=gameState.coreTray.length?Math.max(...gameState.coreTray):1;}
  function triggerCoreRejected(core){gameState.combo=0;gameState.comboTimer=0;gameState.scoreMultiplier=1;gameState.warningFlash=CONFIG.shake.warning;gameState.screenShake=CONFIG.shake.hit;addFloatingText(core.x,core.y,'CORE LOST',CONFIG.colors.red);createParticles(core.x,core.y,CONFIG.colors.red,CONFIG.particle.hitCount,CONFIG.particle.life,CONFIG.particle.speed);}
  function increaseCombo(gain){gameState.combo++;gameState.comboTimer=CONFIG.combo.timeout;gameState.scoreMultiplier=clamp(gameState.scoreMultiplier+gain,1,CONFIG.combo.maxMultiplier);}
  function addFloatingText(x,y,text,color){gameState.floatingTexts.push({id:nextId(),type:'text',active:true,x,y,text,color,life:CONFIG.text.life,maxLife:CONFIG.text.life});}
  function createParticles(x,y,color,count,life,speed){for(let i=0;i<count;i++){const angle=Math.random()*CONFIG.random.fullCircle;const velocity=randomRange(speed*CONFIG.random.half,speed);gameState.particles.push({id:nextId(),type:'particle',active:true,x,y,vx:Math.cos(angle)*velocity,vy:Math.sin(angle)*velocity,color,life,maxLife:life,size:CONFIG.particle.size});}}
  function triggerClear(){const boss=gameState.boss;if(boss)boss.active=false;gameState.enemyBullets.forEach(b=>{if(b)b.active=false;});addScore(CONFIG.boss.score);if(boss)createParticles(boss.x,boss.y,CONFIG.colors.pink,CONFIG.particle.bossCount,CONFIG.particle.bossLife,CONFIG.particle.bossSpeed);gameState.screenShake=CONFIG.shake.boss;gameState.result='clear';setPhase('gameover');syncResult();}
  function triggerDefeat(){gameState.result='defeat';setPhase('gameover');syncResult();}
  function cleanupEntities(){gameState.playerBullets=gameState.playerBullets.filter(e=>e?.active);gameState.enemyBullets=gameState.enemyBullets.filter(e=>e?.active);gameState.enemies=gameState.enemies.filter(e=>e?.active);gameState.cores=gameState.cores.filter(e=>e?.active);gameState.particles=gameState.particles.filter(e=>e?.active&&e.life>0);gameState.floatingTexts=gameState.floatingTexts.filter(e=>e?.active&&e.life>0);}

  function syncHud(){
    const set=(id,value)=>{const el=gameState.dom[id];if(el)el.textContent=value;};set('score',String(gameState.score).padStart(7,'0'));set('multiplier',`×${gameState.scoreMultiplier.toFixed(1)}`);set('combo',String(gameState.combo));set('hp',gameState.player?'◆ '.repeat(gameState.player.hp).trim():'');set('weapon-level',`LV.${gameState.activeWeaponLevel}`);
    const remaining=Math.max(0,CONFIG.stage.displayDuration-gameState.elapsedTime);set('stage-time',`${String(Math.floor(remaining/CONFIG.time.minute)).padStart(CONFIG.time.pad,'0')}:${String(Math.floor(remaining%CONFIG.time.minute)).padStart(CONFIG.time.pad,'0')}`);
    const next=gameState.dom['next-core'];if(next){next.textContent=String(gameState.nextCoreLevel);next.className=`core-token level-${gameState.nextCoreLevel}`;}
    const tray=gameState.dom['core-tray'];if(tray){const slots=tray.children;for(let i=0;i<CONFIG.core.traySize;i++){const slot=slots[i];if(!slot)continue;const level=gameState.coreTray[i];slot.textContent=level?String(level):'';slot.className=level?'core-slot occupied':'core-slot';slot.style.setProperty('--core',level?CONFIG.weapons[level].core.color:'transparent');}tray.classList.toggle('shake',gameState.trayShake>0);}
  }
  function syncResult(){const clear=gameState.result==='clear';const title=gameState.dom['result-title'];const kicker=gameState.dom['result-kicker'];const score=gameState.dom['final-score'];if(title)title.textContent=clear?'STAGE CLEAR':'GAME OVER';if(kicker)kicker.textContent=clear?'CORE CARRIER DESTROYED':'WING SIGNAL LOST';if(score)score.textContent=String(gameState.score).padStart(7,'0');}

  function render(){const ctx=gameState.ctx;if(!ctx)return;ctx.save();const sx=gameState.screenShake?randomRange(-gameState.screenShake,gameState.screenShake):0;const sy=gameState.screenShake?randomRange(-gameState.screenShake,gameState.screenShake):0;ctx.translate(sx,sy);renderBackground(ctx);renderCores(ctx);renderEnemies(ctx);renderBoss(ctx);renderBullets(ctx);renderPlayer(ctx);renderParticles(ctx);renderFloatingTexts(ctx);renderHitbox(ctx);renderBossHealth(ctx);ctx.restore();if(gameState.warningFlash>0){ctx.fillStyle=`rgba(255,40,80,${CONFIG.render.lowHpAlpha})`;ctx.fillRect(0,0,CONFIG.width,CONFIG.height);}const p=gameState.player;if(p&&p.hp===1){ctx.strokeStyle=`rgba(255,50,90,${CONFIG.render.lowHpAlpha+Math.sin(gameState.elapsedTime*CONFIG.player.flashRate)*CONFIG.render.lowHpAlpha})`;ctx.lineWidth=CONFIG.render.glow;ctx.strokeRect(0,0,CONFIG.width,CONFIG.height);}}
  function renderBackground(ctx){
    ctx.fillStyle=CONFIG.colors.space;ctx.fillRect(-CONFIG.worldMargin,-CONFIG.worldMargin,CONFIG.width+CONFIG.worldMargin*2,CONFIG.height+CONFIG.worldMargin*2);
    gameState.stars.forEach(star=>{const x=(star.x-gameState.backgroundOffset*star.depth+CONFIG.width)%CONFIG.width;ctx.fillStyle=`rgba(180,225,255,${CONFIG.random.half+star.depth/CONFIG.render.starRange*CONFIG.random.half})`;ctx.fillRect(x,star.y,star.size,star.size);});
    const gradient=ctx.createLinearGradient(0,0,CONFIG.width,CONFIG.height);gradient.addColorStop(0,'transparent');gradient.addColorStop(CONFIG.random.half,`rgba(83,58,190,${CONFIG.render.nebulaAlpha})`);gradient.addColorStop(1,'transparent');ctx.fillStyle=gradient;ctx.fillRect(0,CONFIG.height*CONFIG.random.half,CONFIG.width,CONFIG.height*CONFIG.random.half);
    ctx.strokeStyle=CONFIG.colors.grid;ctx.lineWidth=CONFIG.render.lineWidth/2;ctx.globalAlpha=CONFIG.random.half;for(let x=-(gameState.gridOffset%CONFIG.render.gridGap);x<CONFIG.width;x+=CONFIG.render.gridGap){ctx.beginPath();ctx.moveTo(x,CONFIG.height);ctx.lineTo(CONFIG.width*CONFIG.random.half+(x-CONFIG.width*CONFIG.random.half)*CONFIG.random.half,CONFIG.height*CONFIG.random.half);ctx.stroke();}for(let y=CONFIG.height*CONFIG.random.half;y<CONFIG.height;y+=CONFIG.render.gridGap*CONFIG.random.half){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(CONFIG.width,y);ctx.stroke();}ctx.globalAlpha=1;
  }
  function glow(ctx,color,blur=CONFIG.render.glow){ctx.shadowColor=color;ctx.shadowBlur=blur;}
  function renderPlayer(ctx){const p=gameState.player;if(!p)return;if(p.invincible>0&&Math.floor(p.invincible*CONFIG.player.flashRate)%2===0)ctx.globalAlpha=CONFIG.render.shipFlashAlpha;ctx.save();ctx.translate(p.x,p.y);glow(ctx,CONFIG.colors.cyan,gameState.weaponFlash>0?CONFIG.render.glow*2:CONFIG.render.glow);ctx.fillStyle=CONFIG.colors.cyan;ctx.beginPath();ctx.moveTo(p.radius,0);ctx.lineTo(-p.radius,-CONFIG.player.height/2);ctx.lineTo(-p.radius/2,0);ctx.lineTo(-p.radius,CONFIG.player.height/2);ctx.closePath();ctx.fill();ctx.fillStyle=CONFIG.colors.blue;ctx.fillRect(-p.radius,-CONFIG.player.height/4,p.radius,CONFIG.player.height/2);ctx.fillStyle=CONFIG.colors.white;ctx.beginPath();ctx.arc(0,0,p.hitRadius,0,CONFIG.random.fullCircle);ctx.fill();ctx.restore();ctx.globalAlpha=1;}
  function renderEnemies(ctx){gameState.enemies.forEach(enemy=>{if(!enemy?.active)return;ctx.save();ctx.translate(enemy.x,enemy.y);glow(ctx,enemy.type==='scout'?CONFIG.colors.orange:CONFIG.colors.pink);ctx.strokeStyle=enemy.type==='scout'?CONFIG.colors.orange:CONFIG.colors.pink;ctx.fillStyle='#14162e';ctx.lineWidth=CONFIG.render.lineWidth;ctx.beginPath();if(enemy.type==='scout'){ctx.moveTo(-enemy.radius,0);ctx.lineTo(0,-enemy.radius);ctx.lineTo(enemy.radius,0);ctx.lineTo(0,enemy.radius);}else{ctx.moveTo(-enemy.radius,0);ctx.lineTo(-enemy.radius/2,-enemy.radius);ctx.lineTo(enemy.radius,-enemy.radius/2);ctx.lineTo(enemy.radius/2,enemy.radius);ctx.lineTo(-enemy.radius/2,enemy.radius);}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();});}
  function renderBoss(ctx){const b=gameState.boss;if(!b?.active)return;ctx.save();ctx.translate(b.x,b.y);glow(ctx,CONFIG.colors.boss,CONFIG.render.glow*2);ctx.fillStyle='#1a1232';ctx.strokeStyle=CONFIG.colors.boss;ctx.lineWidth=CONFIG.render.lineWidth*2;ctx.beginPath();ctx.moveTo(-b.radius,0);ctx.lineTo(-b.radius/2,-b.height/2);ctx.lineTo(b.radius/2,-b.height/2);ctx.lineTo(b.radius,0);ctx.lineTo(b.radius/2,b.height/2);ctx.lineTo(-b.radius/2,b.height/2);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle=CONFIG.colors.cyan;ctx.beginPath();ctx.arc(0,0,b.radius*CONFIG.random.half,0,CONFIG.random.fullCircle);ctx.stroke();ctx.fillStyle=CONFIG.colors.white;ctx.beginPath();ctx.arc(-b.radius*CONFIG.random.half,0,CONFIG.bullet.penetratingRadius,0,CONFIG.random.fullCircle);ctx.fill();ctx.restore();}
  function renderBullets(ctx){gameState.playerBullets.forEach(b=>{if(!b?.active)return;ctx.save();glow(ctx,b.penetrating?CONFIG.colors.pink:CONFIG.colors.cyan);ctx.fillStyle=b.penetrating?CONFIG.colors.pink:CONFIG.colors.white;ctx.fillRect(b.x-b.radius,b.y-b.radius*CONFIG.random.half,b.radius*2,b.radius);ctx.restore();});gameState.enemyBullets.forEach(b=>{if(!b?.active)return;ctx.save();glow(ctx,CONFIG.colors.red);ctx.fillStyle=CONFIG.colors.red;ctx.beginPath();ctx.arc(b.x,b.y,b.radius,0,CONFIG.random.fullCircle);ctx.fill();ctx.restore();});}
  function renderCores(ctx){gameState.cores.forEach(core=>{if(!core?.active)return;const def=CONFIG.weapons[core.level]?.core;if(!def)return;ctx.save();ctx.translate(core.x,core.y);glow(ctx,def.color,CONFIG.render.glow+core.level);ctx.fillStyle='#071126';ctx.strokeStyle=def.color;ctx.lineWidth=CONFIG.render.lineWidth;ctx.beginPath();ctx.arc(0,0,core.radius,0,CONFIG.random.fullCircle);ctx.fill();ctx.stroke();ctx.rotate(gameState.elapsedTime*CONFIG.core.orbitSpeed);ctx.beginPath();ctx.arc(0,0,core.radius+CONFIG.render.coreRingGap,0,Math.PI);ctx.stroke();ctx.fillStyle=def.color;ctx.beginPath();ctx.arc(core.radius+CONFIG.render.coreRingGap,0,CONFIG.particle.size,0,CONFIG.random.fullCircle);ctx.fill();ctx.rotate(-gameState.elapsedTime*CONFIG.core.orbitSpeed);ctx.fillStyle=CONFIG.colors.white;ctx.font=`700 ${CONFIG.render.fontMedium}px Orbitron`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(core.level),0,0);ctx.restore();});}
  function renderParticles(ctx){gameState.particles.forEach(p=>{if(!p||p.life<=0)return;ctx.globalAlpha=clamp(p.life/p.maxLife,0,1);ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size*CONFIG.random.half,p.y-p.size*CONFIG.random.half,p.size,p.size);});ctx.globalAlpha=1;}
  function renderFloatingTexts(ctx){ctx.textAlign='center';ctx.font=`700 ${CONFIG.render.fontMedium}px Orbitron`;gameState.floatingTexts.forEach(t=>{if(!t||t.life<=0)return;ctx.globalAlpha=clamp(t.life/t.maxLife,0,1);ctx.fillStyle=t.color;glow(ctx,t.color);ctx.fillText(t.text,t.x,t.y);});ctx.globalAlpha=1;ctx.shadowBlur=0;}
  function renderHitbox(ctx){const p=gameState.player;if(!p||!gameState.input.slowMode)return;ctx.save();glow(ctx,CONFIG.colors.white);ctx.strokeStyle=CONFIG.colors.white;ctx.lineWidth=CONFIG.render.lineWidth;ctx.beginPath();ctx.arc(p.x,p.y,p.hitRadius,0,CONFIG.random.fullCircle);ctx.stroke();ctx.restore();}
  function renderBossHealth(ctx){const b=gameState.boss;if(!b?.active)return;ctx.fillStyle='#090c1f';ctx.fillRect(CONFIG.render.bossBarX,CONFIG.render.bossBarY,CONFIG.render.bossBarWidth,CONFIG.render.bossBarHeight);ctx.fillStyle=CONFIG.colors.boss;ctx.fillRect(CONFIG.render.bossBarX,CONFIG.render.bossBarY,CONFIG.render.bossBarWidth*clamp(b.hp/b.maxHp,0,1),CONFIG.render.bossBarHeight);ctx.strokeStyle=CONFIG.colors.white;ctx.strokeRect(CONFIG.render.bossBarX,CONFIG.render.bossBarY,CONFIG.render.bossBarWidth,CONFIG.render.bossBarHeight);ctx.fillStyle=CONFIG.colors.white;ctx.font=`700 ${CONFIG.render.fontSmall}px Orbitron`;ctx.textAlign='center';ctx.fillText(`${b.name}  ${Math.max(0,Math.ceil(b.hp))} / ${b.maxHp}`,CONFIG.width*CONFIG.random.half,CONFIG.render.bossBarY-CONFIG.render.fontSmall/2);}

  function gameLoop(timestamp){const dt=gameState.lastTimestamp?Math.min((timestamp-gameState.lastTimestamp)/1000,CONFIG.maxDelta):0;gameState.lastTimestamp=timestamp;if(gameState.phase==='playing')update(dt);render();gameState.animationFrame=requestAnimationFrame(gameLoop);}
  function initialize(){cacheDom();bindEvents();resetGame();setPhase('start');if(gameState.animationFrame===null)gameState.animationFrame=requestAnimationFrame(gameLoop);}
  return Object.freeze({initialize});
})();

document.addEventListener('DOMContentLoaded',game.initialize,{once:true});
