const Game = {
    player: null,
    enemies: [],
    maxEnemies: 3,
    score: 0,
    kills: 0,
    ammo: 30,
    running: false,
    cameraOffset: new THREE.Vector3(0, 10, 14),
    cameraOffsetAim: new THREE.Vector3(0, 3, 4),
    cameraLookOffset: new THREE.Vector3(0, 2, 0),
    playerYaw: 0,
    screenShake: { intensity: 0, duration: 0, timer: 0 },
    invulnerable: false,
    invulnTimer: 0,
    respawning: false,
    aiming: false,
    aimFov: 30,
    normalFov: 60,
    spellLabelTimer: 0,
    gameTime: 600,
    maxGameTime: 600,
    aimPitch: 0,

init() {
        GameScene.init();
        InputManager.init();
        
        if (typeof TankGLTFLoader !== 'undefined') {
            TankGLTFLoader.load(GameScene.scene, (model) => {
                console.log('Real Abrams tank model ready, size:', model ? model.scale.x : 'default');
            }, (err) => {
                console.warn('Model load failed, using default:', err);
            });
        }
        
        if (typeof ModelLoader !== 'undefined') {
            ModelLoader.load(GameScene.scene, () => {
                console.log('All models loaded!');
            });
        }
    },

    start() {
        this.score = 0;
        this.kills = 0;
        this.ammo = 15;
        this.running = true;
        this.playerYaw = 0;
        this.invulnerable = false;
        this.invulnTimer = 0;
        this.respawning = false;
        this.spellLabelTimer = 0;
        this.gameTime = this.maxGameTime;
        this.aimPitch = 0;

        if (typeof AudioManager !== 'undefined') AudioManager.init();

        WordManager.reset();
        BulletManager.clear();
        ExplosionManager.clear();

        const checkAndStart = () => {
            this.player = new Tank(GameScene.scene, true);
            this.player.group.position.set(0, 0, 0);
            console.log('Player tank created with GLTF:', typeof TankGLTFLoader !== 'undefined' && TankGLTFLoader.playerModel ? 'YES' : 'NO');

            this.enemies = [];
            for (let i = 0; i < this.maxEnemies; i++) this.spawnEnemy();

            SoldierManager.init(GameScene.scene);
            SoldierManager.spawnFriendly(2);
            SoldierManager.spawnEnemy(2);

            PickupManager.init(GameScene.scene);
            AnimalManager.init(GameScene.scene);
            AircraftManager.init(GameScene.scene);
            SpellTracker.init(this.player);

            UI.reset();
            const canvas = document.getElementById('gameCanvas');
            canvas.requestPointerLock();
            this.loop();
        };

        const modelsReady = () => {
            const tankReady = typeof TankGLTFLoader === 'undefined' || TankGLTFLoader.modelReady;
            const modelsLoaded = typeof ModelLoader === 'undefined' || ModelLoader.loaded;
            return tankReady && modelsLoaded;
        };

        if (modelsReady()) {
            checkAndStart();
        } else {
            const waitForModels = setInterval(() => {
                console.log('Waiting for models... tank:', typeof TankGLTFLoader !== 'undefined' && TankGLTFLoader.modelReady, 'models:', typeof ModelLoader !== 'undefined' && ModelLoader.loaded);
                if (modelsReady()) {
                    clearInterval(waitForModels);
                    checkAndStart();
                }
            }, 500);
        }
    },

    spawnEnemy() {
        const enemy = new Tank(GameScene.scene, false);
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 40;
        enemy.group.position.set(Math.sin(angle) * dist, 0, Math.cos(angle) * dist);
        enemy.group.rotation.y = Math.random() * Math.PI * 2;
        this.enemies.push(enemy);
    },

    loop() {
        if (!this.running) return;
        requestAnimationFrame(() => this.loop());
        const dt = Math.min(GameScene.clock.getDelta(), 0.05);
        if (!GameScene.renderer) {
            console.error('Renderer not initialized');
            return;
        }

        this.handleInput(dt);
        this.updateEnemies(dt);
        this.updateInvulnerability(dt);
        this.updateTimer(dt);
        SoldierManager.update(dt);

        const tankPositions = [this.player.group.position];
        this.enemies.forEach(e => { if (e.alive) tankPositions.push(e.group.position); });
        AnimalManager.update(dt, tankPositions);
        AircraftManager.update(dt);
        this.checkAnimalCollisions();

        this.checkCollisions();
        BulletManager.update(dt);
        if (typeof MuzzleFlash !== 'undefined') MuzzleFlash.update(dt);
        ExplosionManager.update(dt);
        UI.update(dt);
        GameScene.updateParticles(dt);

        if (PickupManager.update(dt, this.player ? this.player.group.position : null)) {
        }

        this.spellLabelTimer += dt;
        if (this.spellLabelTimer > 0.15 && this.player && SpellTracker.currentWord) {
            this.spellLabelTimer = 0;
            this.player.updateSpellLabel(SpellTracker.currentWord, 0);
        }

        this.updateCorrectIndicator();

        this.updateCamera(dt);
        GameScene.renderer.render(GameScene.scene, GameScene.camera);
    },

    handleInput(dt) {
        if (!this.player || !this.player.alive) return;
        const p = this.player;
        let moveX = 0, moveZ = 0;

        if (InputManager.isKeyDown('KeyW')) moveZ = -1;
        if (InputManager.isKeyDown('KeyS')) moveZ = 1;
        if (InputManager.isKeyDown('KeyA')) moveX = -1;
        if (InputManager.isKeyDown('KeyD')) moveX = 1;

        this.aiming = InputManager.rightMouseDown || InputManager.isKeyDown('KeyR');
        const sensitivity = this.aiming ? 0.002 : 0.003;
        const mouseDelta = InputManager.consumeMouseDelta();
        this.playerYaw -= mouseDelta.dx * sensitivity;
        this.aimPitch = Math.max(-0.5, Math.min(0.8, (this.aimPitch || 0) - mouseDelta.dy * sensitivity * 0.5));

        const targetFov = this.aiming ? this.aimFov : this.normalFov;
        GameScene.camera.fov += (targetFov - GameScene.camera.fov) * 8 * dt;
        GameScene.camera.updateProjectionMatrix();

        const scope = document.getElementById('scope-overlay');
        if (scope) scope.style.display = this.aiming ? 'block' : 'none';

        p.group.rotation.y = this.playerYaw;
        p.turretGroup.rotation.y = 0;

        if (moveX !== 0 || moveZ !== 0) {
            const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerYaw);
            const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerYaw);
            const moveDir = new THREE.Vector3();
            moveDir.addScaledVector(forward, -moveZ);
            moveDir.addScaledVector(right, moveX);
            moveDir.normalize();

            const oldPos = p.group.position.clone();
            p.group.position.addScaledVector(moveDir, p.speed * dt);
            if (this.checkObstacleCollision(p.group.position, 2.0)) p.group.position.copy(oldPos);

            const bound = 85;
            p.group.position.x = Math.max(-bound, Math.min(bound, p.group.position.x));
            p.group.position.z = Math.max(-bound, Math.min(bound, p.group.position.z));
        }

        if (p.playerRing) {
            p.playerRing.material.opacity = this.invulnerable
                ? 0.3 + Math.sin(Date.now() * 0.02) * 0.5
                : 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
        }

        p.fireTimer -= dt;
        if ((InputManager.mouseDown || InputManager.isKeyDown('Space')) && p.canFire()) {
            this.playerFire();
            p.resetFireTimer();
        }
    },

    checkObstacleCollision(pos, tankRadius) {
        for (const obs of GameScene.getObstacles()) {
            if (pos.distanceTo(obs.position) < obs.radius + tankRadius) return true;
        }
        return false;
    },

    checkAnimalCollisions() {
        if (!this.player || !this.player.alive) return;
        const hit = AnimalManager.checkCollisions(this.player.group.position);
        if (hit) {
            this.triggerShake(0.3, 0.25);
            hit.state = 'flee';
            hit.runDir.subVectors(hit.group.position, this.player.group.position).normalize();
            hit.runTimer = 3;
        }
    },

    playerFire() {
        const p = this.player;
        const dir = p.getBarrelDirection();
        
        if (this.aiming) {
            dir.y += this.aimPitch || 0;
            dir.normalize();
        }
        
        console.log('Firing direction:', dir.x, dir.y, dir.z);
        BulletManager.fire(GameScene.scene, p.getBarrelTip(), dir, true);
    },

    updateEnemies(dt) {
        const playerPos = this.player ? this.player.group.position : new THREE.Vector3();
        const friendlySoldiers = SoldierManager.getPlayerSoldiers();

        this.enemies.forEach(enemy => {
            if (!enemy.alive) return;
            enemy.updateAI(dt, playerPos, friendlySoldiers);
            const oldPos = enemy.group.position.clone();
            if (this.checkObstacleCollision(enemy.group.position, 2.0)) {
                enemy.group.position.copy(oldPos);
                enemy.aiState = 'patrol';
                enemy.aiTimer = 0;
            }
            if (enemy.canFire() && enemy.aiState === 'chase') {
                const toPlayer = new THREE.Vector3().subVectors(playerPos, enemy.group.position);
                if (toPlayer.length() < 40) {
                    BulletManager.fire(GameScene.scene, enemy.getBarrelTip(), enemy.getBarrelDirection(), false);
                    enemy.resetFireTimer();
                }
            }
        });
    },

    checkCollisions() {
        const bullets = BulletManager.bullets;
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            if (!b.alive) continue;
            const bPos = b.getPosition();
            if (b.isPlayer) this.checkPlayerBullet(b, bPos);
            else this.checkEnemyBullet(b, bPos);
        }
    },

    checkPlayerBullet(b, bPos) {
        for (let j = this.enemies.length - 1; j >= 0; j--) {
            const enemy = this.enemies[j];
            if (!enemy.alive) continue;
            if (bPos.distanceTo(enemy.group.position) < 2.5) {
                enemy.takeDamage(50);
                b.dispose();
                if (!enemy.alive) this.onEnemyKilled(enemy, j);
                else ExplosionManager.create(GameScene.scene, bPos.clone(), false);
                return;
            }
        }

        const enemySoldiers = SoldierManager.getEnemySoldiers();
        for (const s of enemySoldiers) {
            if (bPos.distanceTo(s.group.position) < 1.0) {
                s.takeDamage(30);
                b.dispose();
                ExplosionManager.create(GameScene.scene, bPos.clone(), false);
                if (!s.alive) this.onEntityKilled(s);
                return;
            }
        }

        for (const ac of AircraftManager.getAlive()) {
            if (bPos.distanceTo(ac.group.position) < 3.0) {
                ac.takeDamage(40);
                b.dispose();
                ExplosionManager.create(GameScene.scene, bPos.clone(), false);
                if (ac.falling) this.onEntityKilled(ac);
                return;
            }
        }

        for (const animal of AnimalManager.animals) {
            if (!animal.alive) continue;
            if (bPos.distanceTo(animal.group.position) < 1.5) {
                animal.takeDamage(30);
                b.dispose();
                ExplosionManager.create(GameScene.scene, bPos.clone(), false);
                if (!animal.alive) {
                    this.onEntityKilled(animal);
                    animal.dispose();
                }
                return;
            }
        }

        this.checkBulletVsEnvironment(b, bPos);
    },

    checkEnemyBullet(b, bPos) {
        if (this.player && this.player.alive && !this.invulnerable) {
            if (bPos.distanceTo(this.player.group.position) < 2.5) {
                this.player.takeDamage(15);
                b.dispose();
                ExplosionManager.create(GameScene.scene, bPos.clone(), false);
                UI.showDamageFlash();
                UI.updateHealth(this.player.health, this.player.maxHealth);
                if (this.player.health <= 0) this.onPlayerDeath();
                return;
            }
        }
        const friendlySoldiers = SoldierManager.getPlayerSoldiers();
        for (const s of friendlySoldiers) {
            if (bPos.distanceTo(s.group.position) < 1.0) {
                s.takeDamage(30);
                b.dispose();
                ExplosionManager.create(GameScene.scene, bPos.clone(), false);
                return;
            }
        }
        this.checkBulletVsEnvironment(b, bPos);
    },

    checkBulletVsEnvironment(b, bPos) {
        for (const barrel of GameScene.barrels) {
            if (!barrel.alive) continue;
            if (bPos.distanceTo(barrel.position) < 1.5) { b.dispose(); this.explodeBarrel(barrel); this.onDestructibleHit(barrel); return; }
        }
        for (const rock of GameScene.rocks) {
            if (!rock.alive) continue;
            if (bPos.distanceTo(rock.position) < rock.radius + 0.5) {
                rock.health -= 40; b.dispose();
                ExplosionManager.create(GameScene.scene, bPos.clone(), false);
                if (rock.health <= 0) { ExplosionManager.create(GameScene.scene, rock.position.clone(), false); this.onDestructibleHit(rock); GameScene.removeDestructible(rock); }
                return;
            }
        }
        for (const tree of GameScene.trees) {
            if (!tree.alive) continue;
            if (bPos.distanceTo(tree.position) < tree.radius + 0.5) {
                tree.health -= 30; b.dispose();
                ExplosionManager.create(GameScene.scene, bPos.clone(), false);
                if (tree.health <= 0) { ExplosionManager.create(GameScene.scene, tree.position.clone(), false); this.onDestructibleHit(tree); GameScene.removeDestructible(tree); }
                return;
            }
        }
        for (const building of GameScene.buildings) {
            if (!building.alive) continue;
            if (bPos.distanceTo(building.position) < building.radius) {
                building.health -= 50; b.dispose();
                ExplosionManager.create(GameScene.scene, bPos.clone(), false);
                if (building.health <= 0) { ExplosionManager.create(GameScene.scene, building.position.clone(), true); this.triggerShake(0.4, 0.3); this.onDestructibleHit(building); GameScene.removeDestructible(building); }
                return;
            }
        }
        for (const bunker of GameScene.bunkers) {
            if (!bunker.alive) continue;
            if (bPos.distanceTo(bunker.position) < bunker.radius) {
                bunker.health -= 50; b.dispose();
                ExplosionManager.create(GameScene.scene, bPos.clone(), false);
                if (bunker.health <= 0) { ExplosionManager.create(GameScene.scene, bunker.position.clone(), true); this.triggerShake(0.3, 0.2); this.onDestructibleHit(bunker); GameScene.removeDestructible(bunker); }
                return;
            }
        }
        for (const ship of GameScene.ships) {
            if (!ship.alive) continue;
            if (bPos.distanceTo(ship.position) < ship.radius) {
                ship.health -= 50; b.dispose();
                ExplosionManager.create(GameScene.scene, bPos.clone(), false);
                if (ship.health <= 0) { ExplosionManager.create(GameScene.scene, ship.position.clone(), true); this.triggerShake(0.4, 0.3); this.onDestructibleHit(ship); GameScene.removeDestructible(ship); }
                return;
            }
        }
    },

    onDestructibleHit(obj) {
        if (!obj.word) return;
        const result = SpellTracker.checkWord(obj.word);
        if (result === 'correct') {
            this.score += 100;
            UI.updateScore(this.score);
            UI.showScorePopup(100);
            UI.showWordPopup(obj.word);
            SpellTracker.speakWord(obj.word);
            SpellTracker.completed++;
            this.triggerShake(0.2, 0.15);
            setTimeout(() => { if (this.running) SpellTracker.nextWord(); }, 1500);
        } else {
            UI.showWrongPopup(obj.word.en, SpellTracker.currentWord ? SpellTracker.currentWord.en : '');
        }
    },

    onEnemyKilled(enemy, index) {
        ExplosionManager.create(GameScene.scene, enemy.group.position.clone(), true);
        this.triggerShake(0.6, 0.4);
        this.kills++;
        UI.updateKills(this.kills);

        const result = SpellTracker.checkWord(enemy.word);
        if (result === 'correct') {
            this.score += 100;
            UI.updateScore(this.score);
            UI.showScorePopup(100);
            UI.showWordPopup(enemy.word);
            SpellTracker.speakWord(enemy.word);
            SpellTracker.completed++;
            setTimeout(() => { if (this.running) SpellTracker.nextWord(); }, 1500);
        } else {
            UI.showWrongPopup(enemy.word ? enemy.word.en : '', SpellTracker.currentWord ? SpellTracker.currentWord.en : '');
        }

        enemy.dispose();
        this.enemies.splice(index, 1);
        setTimeout(() => { if (this.running) this.spawnEnemy(); }, 1500);
    },

    onEntityKilled(entity) {
        const result = SpellTracker.checkWord(entity.word);
        if (result === 'correct') {
            this.score += 100;
            UI.updateScore(this.score);
            UI.showScorePopup(100);
            UI.showWordPopup(entity.word);
            SpellTracker.speakWord(entity.word);
            SpellTracker.completed++;
            setTimeout(() => { if (this.running) SpellTracker.nextWord(); }, 1500);
        } else {
            UI.showWrongPopup(entity.word ? entity.word.en : '', SpellTracker.currentWord ? SpellTracker.currentWord.en : '');
        }
    },

    explodeBarrel(barrel) {
        if (!barrel.alive) return;
        barrel.alive = false;
        GameScene.removeDestructible(barrel);
        ExplosionManager.create(GameScene.scene, barrel.position.clone(), true);
        this.triggerShake(0.5, 0.35);
        this.damageNearby(barrel.position, 5, 40);
        setTimeout(() => {
            if (!this.running) return;
            for (const other of GameScene.barrels) {
                if (other.alive && barrel.position.distanceTo(other.position) < 6) this.explodeBarrel(other);
            }
        }, 100);
    },

    damageNearby(pos, radius, damage) {
        if (this.player && this.player.alive && !this.invulnerable && pos.distanceTo(this.player.group.position) < radius) {
            this.player.takeDamage(damage);
            UI.updateHealth(this.player.health, this.player.maxHealth);
            UI.showDamageFlash();
            if (this.player.health <= 0) this.onPlayerDeath();
        }
        this.enemies.forEach(e => { if (e.alive && pos.distanceTo(e.group.position) < radius) e.takeDamage(damage); });
        SoldierManager.soldiers.forEach(s => { if (s.alive && pos.distanceTo(s.group.position) < radius) s.takeDamage(damage); });
    },

    onPlayerDeath() {
        if (this.respawning) return;
        this.respawning = true;
        this.player.alive = false;
        ExplosionManager.create(GameScene.scene, this.player.group.position.clone(), true);
        UI.showCrackScreen();
        this.triggerShake(0.8, 0.5);
        setTimeout(() => { if (this.running) this.respawnPlayer(); }, 2000);
    },

    respawnPlayer() {
        UI.hideCrackScreen();
        this.respawning = false;
        this.player.health = this.player.maxHealth;
        this.player.alive = true;
        this.player.updateHealthBar();
        this.player.group.position.set(0, 0, 0);
        this.playerYaw = 0;
        this.player.group.rotation.y = 0;
        UI.updateHealth(this.player.health, this.player.maxHealth);
        this.invulnerable = true;
        this.invulnTimer = 1.5;
    },

    updateInvulnerability(dt) {
        if (!this.invulnerable) return;
        this.invulnTimer -= dt;
        if (this.invulnTimer <= 0) {
            this.invulnerable = false;
            if (this.player && this.player.group) this.player.group.visible = true;
        } else if (this.player && this.player.group) {
            this.player.group.visible = Math.sin(Date.now() * 0.03) > 0;
        }
    },

    updateTimer(dt) {
        this.gameTime -= dt;
        if (this.gameTime <= 0) {
            this.gameTime = 0;
            this.gameOver();
        }
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        const timerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('timer').textContent = timerText;
        const timerDisplay = document.getElementById('timer-display');
        if (this.gameTime < 60) {
            timerDisplay.classList.add('warning');
        } else {
            timerDisplay.classList.remove('warning');
        }
    },

    updateCorrectIndicator() {
        if (!this.correctIndicator) {
            const ringGeo = new THREE.RingGeometry(2.5, 3.0, 32);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0x44ff44, transparent: true, opacity: 0.6, side: THREE.DoubleSide
            });
            this.correctIndicator = new THREE.Mesh(ringGeo, ringMat);
            this.correctIndicator.rotation.x = -Math.PI / 2;
            GameScene.scene.add(this.correctIndicator);

            const arrowGeo = new THREE.ConeGeometry(0.5, 1.5, 8);
            const arrowMat = new THREE.MeshBasicMaterial({ color: 0x44ff44, transparent: true, opacity: 0.7 });
            this.correctArrow = new THREE.Mesh(arrowGeo, arrowMat);
            GameScene.scene.add(this.correctArrow);
        }

        const target = SpellTracker.correctTarget;
        if (target && target.alive) {
            const pos = target.group ? target.group.position : target.position;
            this.correctIndicator.visible = true;
            this.correctArrow.visible = true;
            this.correctIndicator.position.set(pos.x, 0.15, pos.z);
            this.correctIndicator.rotation.z = Date.now() * 0.002;
            const pulse = 0.5 + Math.sin(Date.now() * 0.005) * 0.2;
            this.correctIndicator.material.opacity = pulse;
            this.correctArrow.position.set(pos.x, 8 + Math.sin(Date.now() * 0.004) * 1, pos.z);
            this.correctArrow.rotation.x = Math.PI;
        } else {
            this.correctIndicator.visible = false;
            this.correctArrow.visible = false;
        }
    },

    triggerShake(intensity, duration) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
        this.screenShake.duration = Math.max(this.screenShake.duration, duration);
        this.screenShake.timer = this.screenShake.duration;
    },

    updateCamera(dt) {
        if (!this.player) return;
        const playerPos = this.player.group.position;
        const baseOffset = this.aiming ? this.cameraOffsetAim : this.cameraOffset;
        const offset = baseOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerYaw);
        offset.y += (this.aimPitch || 0) * -3;
        const targetCamPos = playerPos.clone().add(offset);
        GameScene.camera.position.lerp(targetCamPos, (this.aiming ? 8 : 5) * dt);

        if (this.screenShake.timer > 0) {
            this.screenShake.timer -= dt;
            const shakeAmt = this.screenShake.intensity * (this.screenShake.timer / this.screenShake.duration);
            GameScene.camera.position.x += (Math.random() - 0.5) * shakeAmt;
            GameScene.camera.position.y += (Math.random() - 0.5) * shakeAmt * 0.5;
            GameScene.camera.position.z += (Math.random() - 0.5) * shakeAmt;
            if (this.screenShake.timer <= 0) { this.screenShake.intensity = 0; this.screenShake.duration = 0; }
        }

        const lookAt = playerPos.clone().add(this.cameraLookOffset);
        const forwardDir = new THREE.Vector3(0, 0, -10).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerYaw);
        forwardDir.y += (this.aimPitch || 0) * 10;
        lookAt.add(forwardDir);
        GameScene.camera.lookAt(lookAt);
    },

    gameOver() {
        this.running = false;
        if (document.pointerLockElement) document.exitPointerLock();
        UI.showGameOver(this.score, this.kills);
    },

    cleanup() {
        this.running = false;
        if (this.player) { this.player.dispose(); this.player = null; }
        this.enemies.forEach(e => e.dispose());
        this.enemies = [];
        BulletManager.clear();
        ExplosionManager.clear();
        SoldierManager.clear();
        PickupManager.clear();
        AnimalManager.clear();
        AircraftManager.clear();
        SpellTracker.reset();
        if (this.correctIndicator) {
            GameScene.scene.remove(this.correctIndicator);
            GameScene.scene.remove(this.correctArrow);
            this.correctIndicator = null;
            this.correctArrow = null;
        }
    }
};

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    try {
        Game.init();
        Game.start();
    } catch(e) {
        alert('Error: ' + e.message);
        console.error(e);
    }
}

function restartGame() {
    Game.cleanup();
    const toRemove = [];
    GameScene.scene.traverse(child => { if (child !== GameScene.scene) toRemove.push(child); });
    toRemove.forEach(obj => GameScene.scene.remove(obj));
    GameScene.createLights();
    GameScene.createGround();
    GameScene.createOcean();
    GameScene.createSkyDome();
    GameScene.createEnvironment();
    GameScene.createDustParticles();
    Game.start();
}
