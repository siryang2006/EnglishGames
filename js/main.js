const Game = {
    player: null,
    enemies: [],
    maxEnemies: 5,
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

    init() {
        GameScene.init();
        InputManager.init();
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

        WordManager.reset();
        BulletManager.clear();
        ExplosionManager.clear();

        this.player = new Tank(GameScene.scene, true);
        this.player.group.position.set(0, 0, 0);

        this.enemies = [];
        for (let i = 0; i < this.maxEnemies; i++) this.spawnEnemy();

        SoldierManager.init(GameScene.scene);
        SoldierManager.spawnFriendly(4);
        SoldierManager.spawnEnemy(4);

        PickupManager.init(GameScene.scene);
        AnimalManager.init(GameScene.scene);
        AircraftManager.init(GameScene.scene);
        SpellTracker.init(this.player);

        UI.reset();
        this.loop();
    },

    spawnEnemy() {
        const enemy = new Tank(GameScene.scene, false);
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 40;
        enemy.group.position.set(Math.sin(angle) * dist, 0, Math.cos(angle) * dist);
        enemy.group.rotation.y = Math.random() * Math.PI * 2;
        this.enemies.push(enemy);
        SpellTracker.reassignEnemyLetters();
    },

    loop() {
        if (!this.running) return;
        requestAnimationFrame(() => this.loop());
        const dt = Math.min(GameScene.clock.getDelta(), 0.05);

        this.handleInput(dt);
        this.updateEnemies(dt);
        this.updateInvulnerability(dt);
        SoldierManager.update(dt);

        const tankPositions = [this.player.group.position];
        this.enemies.forEach(e => { if (e.alive) tankPositions.push(e.group.position); });
        AnimalManager.update(dt, tankPositions);
        AircraftManager.update(dt);
        this.checkAnimalCollisions();

        this.checkCollisions();
        BulletManager.update(dt);
        ExplosionManager.update(dt);
        UI.update(dt);

        if (PickupManager.update(dt, this.player ? this.player.group.position : null)) {
            this.ammo = Math.min(30, this.ammo + 5);
            UI.updateAmmo(this.ammo);
        }

        this.spellLabelTimer += dt;
        if (this.spellLabelTimer > 0.1 && this.player && SpellTracker.currentWord) {
            this.spellLabelTimer = 0;
            this.player.updateSpellLabel(SpellTracker.currentWord, SpellTracker.currentIndex);
        }

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
        const sensitivity = this.aiming ? 0.0015 : 0.003;
        const mouseDelta = InputManager.consumeMouseDelta();
        this.playerYaw -= mouseDelta.dx * sensitivity;

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
        BulletManager.fire(GameScene.scene, p.getBarrelTip(), p.getBarrelDirection(), true);
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
            if (bPos.distanceTo(barrel.position) < 1.5) { b.dispose(); this.explodeBarrel(barrel); return; }
        }
        for (const tree of GameScene.trees) {
            if (!tree.alive) continue;
            if (bPos.distanceTo(tree.position) < tree.radius + 0.5) {
                tree.health -= 30; b.dispose();
                ExplosionManager.create(GameScene.scene, bPos.clone(), false);
                if (tree.health <= 0) { ExplosionManager.create(GameScene.scene, tree.position.clone(), false); GameScene.removeDestructible(tree); }
                return;
            }
        }
        for (const building of GameScene.buildings) {
            if (!building.alive) continue;
            if (bPos.distanceTo(building.position) < building.radius) {
                building.health -= 50; b.dispose();
                ExplosionManager.create(GameScene.scene, bPos.clone(), false);
                if (building.health <= 0) { ExplosionManager.create(GameScene.scene, building.position.clone(), true); this.triggerShake(0.4, 0.3); GameScene.removeDestructible(building); }
                return;
            }
        }
        for (const bunker of GameScene.bunkers) {
            if (!bunker.alive) continue;
            if (bPos.distanceTo(bunker.position) < bunker.radius) {
                bunker.health -= 50; b.dispose();
                ExplosionManager.create(GameScene.scene, bPos.clone(), false);
                if (bunker.health <= 0) { ExplosionManager.create(GameScene.scene, bunker.position.clone(), true); this.triggerShake(0.3, 0.2); GameScene.removeDestructible(bunker); }
                return;
            }
        }
    },

    onEnemyKilled(enemy, index) {
        ExplosionManager.create(GameScene.scene, enemy.group.position.clone(), true);
        this.triggerShake(0.6, 0.4);
        this.kills++;
        UI.updateKills(this.kills);

        const result = SpellTracker.checkLetter(enemy.letter);
        if (result === 'correct') {
            this.score += 10;
            UI.updateScore(this.score);
            SpellTracker.speakWord(SpellTracker.currentWord);
        } else if (result === 'complete') {
            this.score += 110;
            UI.updateScore(this.score);
            SpellTracker.completed++;
            UI.showWordPopup(SpellTracker.currentWord);
            SpellTracker.speakWord(SpellTracker.currentWord);
            setTimeout(() => { if (this.running) SpellTracker.nextWord(); }, 1500);
        } else {
            SpellTracker.speakWord(SpellTracker.currentWord);
        }

        enemy.dispose();
        this.enemies.splice(index, 1);
        setTimeout(() => { if (this.running) this.spawnEnemy(); }, 1500);
    },

    onEntityKilled(entity) {
        const result = SpellTracker.checkLetter(entity.letter);
        if (result === 'correct') {
            this.score += 10;
            UI.updateScore(this.score);
            SpellTracker.speakWord(SpellTracker.currentWord);
        } else if (result === 'complete') {
            this.score += 110;
            UI.updateScore(this.score);
            SpellTracker.completed++;
            UI.showWordPopup(SpellTracker.currentWord);
            SpellTracker.speakWord(SpellTracker.currentWord);
            setTimeout(() => { if (this.running) SpellTracker.nextWord(); }, 1500);
        } else {
            SpellTracker.speakWord(SpellTracker.currentWord);
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
        lookAt.add(new THREE.Vector3(0, 0, -10).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerYaw));
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
    }
};

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    Game.init();
    Game.start();
}

function restartGame() {
    Game.cleanup();
    const toRemove = [];
    GameScene.scene.traverse(child => { if (child !== GameScene.scene) toRemove.push(child); });
    toRemove.forEach(obj => GameScene.scene.remove(obj));
    GameScene.createLights();
    GameScene.createGround();
    GameScene.createSkyDome();
    GameScene.createEnvironment();
    Game.start();
}
