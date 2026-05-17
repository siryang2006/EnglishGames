console.log('soldier.js v20 loaded');
class Soldier {
    constructor(scene, isPlayerTeam = true) {
        this.scene = scene;
        this.isPlayerTeam = isPlayerTeam;
        this.group = new THREE.Group();
        this.health = 30;
        this.maxHealth = 30;
        this.alive = true;
        this.speed = 1.5;
        this.patrolCenter = new THREE.Vector3();
        this.patrolAngle = Math.random() * Math.PI * 2;
        this.patrolTimer = 0;
        this.word = null;
        this.letter = '';
        this.usingGltf = false;
        this.mixer = null;
        this.currentAction = null;
        this.fireTimer = 0;
        this.fireCooldown = 1.5 + Math.random();
        this._walkTime = 0;
        this._walking = false;
        this.rifleModel = null;

        this.buildModel();
        this.createHealthBar();
        if (!isPlayerTeam) {
            this.word = window.WordManager && WordManager.getRandomWord ? WordManager.getRandomWord() : { en: 'TEST' };
            this.letter = this.word.en;
            this.createLetterLabel();
        }
        scene.add(this.group);
    }

    buildModel() {
        // HTTP protocol: GLTF model, file:// protocol: procedural fallback
        if (window.location.protocol !== 'file:') {
            this.loadGLTFModel();
        } else {
            this.buildPrimitiveModel();
        }
    }

    loadGLTFModel() {
        const loader = new THREE.GLTFLoader();
        const path = this.isPlayerTeam ? 'models/soldier_friendly.glb?v=3' : 'models/soldier_enemy.glb?v=3';
        console.log('Soldier loading GLTF:', path, 'team:', this.isPlayerTeam ? 'friendly' : 'enemy');
        loader.load(path, (gltf) => {
            const m = gltf.scene;
            console.log('Soldier GLTF loaded:', path, 'nodes:', m.children.length);

            const box = new THREE.Box3().setFromObject(m);
            const size = box.getSize(new THREE.Vector3());
            console.log('Soldier raw size:', size.x.toFixed(2), size.y.toFixed(2), size.z.toFixed(2));
            let soldierScale = 1;
            if (size.y > 0.1) {
                soldierScale = 1.8 / size.y;
                m.scale.setScalar(soldierScale);
                box.setFromObject(m);
            }
            window._soldierDebug = window._soldierDebug || document.getElementById('info');
            if (window._soldierDebug) {
                window._soldierDebug.textContent += '\n[debug] rawH=' + size.y.toFixed(3) + ' sScale=' + soldierScale.toFixed(3);
            }
            const c = box.getCenter(new THREE.Vector3());
            m.position.set(-c.x, -box.min.y, -c.z);

            if (gltf.animations && gltf.animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(m);
                this.mixer.timeScale = 0.65;
                this.animations = {};
                gltf.animations.forEach(a => {
                    this.animations[a.name] = a;
                    console.log('  animation:', a.name);
                });
                const idleClip = gltf.animations.find(a =>
                    a.name.toLowerCase().includes('idle_gun')
                ) || gltf.animations.find(a =>
                    a.name.toLowerCase().includes('idle') || a.name.toLowerCase().includes('stand')
                );
                if (idleClip) {
                    this.currentAction = this.mixer.clipAction(idleClip);
                    this.currentAction.play();
                } else {
                    this.currentAction = this.mixer.clipAction(gltf.animations[0]);
                    this.currentAction.play();
                }
            }

            this.group.add(m);
            this.loadAndAttachRifle(m);
            this.usingGltf = true;
            console.log('Soldier GLTF animations:', this.getAnimationNames());
            console.log('Soldier GLTF added to group');
        }, null, (err) => {
            console.error('Soldier GLTF load error:', path, err.message || err);
            this.buildPrimitiveModel();
        });
    }

    loadAndAttachRifle(soldierModel) {
        const loader = new THREE.GLTFLoader();
        loader.load('models/rifle_quaternius.glb?v=1', (gltf) => {
            const rifle = gltf.scene;
            let wristBone = null;
            soldierModel.traverse((node) => {
                if (node.isMesh && node.skeleton) {
                    for (const b of node.skeleton.bones) {
                        if (b.name === 'WristR') wristBone = b;
                    }
                }
            });
            if (wristBone) {
                const localBox = new THREE.Box3().setFromObject(rifle);
                const localTipY = localBox.max.y;
                const rawGunLen = localBox.max.y - localBox.min.y;
                let totalScale = 1;
                let n = wristBone;
                while (n) {
                    totalScale *= n.scale.x;
                    n = n.parent;
                }
                const worldGunLen = rawGunLen * totalScale;
                const desiredGunLen = 0.35;
                const adjustScale = desiredGunLen / worldGunLen;
                rifle.position.set(0, 0, 0);
                rifle.rotation.set(0, 0, 0);
                rifle.scale.setScalar(adjustScale);
                wristBone.add(rifle);
                this.rifleModel = rifle;
                const t = new THREE.Object3D();
                t.position.set(0, localTipY, 0);
                t.name = 'muzzleTip';
                rifle.add(t);
                console.log('Rifle on WristR, rawLen=' + rawGunLen.toFixed(3) + ' totalScale=' + totalScale.toFixed(3) + ' worldLen=' + worldGunLen.toFixed(3) + ' adjScale=' + adjustScale.toFixed(3));
                if (window._soldierDebug) {
                    window._soldierDebug.textContent += '\n[rifle] totalScale=' + totalScale.toFixed(3) + ' worldLen=' + worldGunLen.toFixed(3) + ' adjScale=' + adjustScale.toFixed(3);
                }
            } else {
                console.warn('Wrist.R not found');
                rifle.scale.setScalar(8);
                rifle.position.set(0.35, 1.2, 0.5);
                rifle.rotation.set(0, 0, 0);
                this.group.add(rifle);
                this.rifleModel = rifle;
            }
        }, null, (err) => {
            console.warn('Rifle load failed:', err.message);
        });
    }

    buildPrimitiveModel() {
        const skinColor = 0xddaa77;
        const uniformColor = this.isPlayerTeam ? 0x3a6b3a : 0x6b2020;
        const bootColor = 0x332211;
        const uniformMat = new THREE.MeshPhongMaterial({ color: uniformColor });
        const skinMat = new THREE.MeshPhongMaterial({ color: skinColor });
        const bootMat = new THREE.MeshPhongMaterial({ color: bootColor });

        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.6, 0.25), uniformMat);
        torso.position.y = 1.2;
        torso.castShadow = true;
        this.group.add(torso);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), skinMat);
        head.position.y = 1.7;
        head.castShadow = true;
        this.group.add(head);

        const helmetMat = new THREE.MeshPhongMaterial({ color: this.isPlayerTeam ? 0x2d5a2d : 0x5a2020 });
        const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6), helmetMat);
        helmet.position.y = 1.78;
        helmet.castShadow = true;
        this.group.add(helmet);

        for (let side = -1; side <= 1; side += 2) {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.14), uniformMat);
            leg.position.set(side * 0.12, 0.55, 0);
            leg.castShadow = true;
            this.group.add(leg);

            const boot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.2), bootMat);
            boot.position.set(side * 0.12, 0.2, 0.03);
            this.group.add(boot);
        }

        const armR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), uniformMat);
        armR.position.set(0.32, 1.15, -0.05);
        armR.rotation.x = -0.3;
        armR.castShadow = true;
        this.group.add(armR);

        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), uniformMat);
        armL.position.set(-0.32, 1.15, -0.1);
        armL.rotation.x = -0.8;
        armL.castShadow = true;
        this.group.add(armL);

        const gunMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
        const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.6), gunMat);
        gunBody.position.set(-0.32, 1.35, -0.45);
        gunBody.castShadow = true;
        this.group.add(gunBody);

        const gunStock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 0.12), new THREE.MeshPhongMaterial({ color: 0x553311 }));
        gunStock.position.set(-0.32, 1.30, -0.15);
        this.group.add(gunStock);
    }

    createHealthBar() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 8;
        this.healthCanvas = canvas;
        this.healthCtx = canvas.getContext('2d');

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        this.healthBar = new THREE.Sprite(mat);
        this.healthBar.scale.set(1.5, 0.2, 1);
        this.healthBar.position.y = 2.2;
        this.group.add(this.healthBar);
        this.updateHealthBar();
    }

    updateHealthBar() {
        const ctx = this.healthCtx;
        if (!ctx) return;
        const w = 64, h = 8;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, w, h);

        const ratio = this.health / this.maxHealth;
        ctx.fillStyle = this.isPlayerTeam ? '#4a4' : '#a44';
        ctx.fillRect(1, 1, (w - 2) * ratio, h - 2);

        this.healthBar.material.map.needsUpdate = true;
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        this.updateHealthBar();
        if (this.health <= 0) {
            this.alive = false;
        }
    }

    setAnimation(name) {
        if (!this.mixer || !this.animations) return;
        const keys = ['walk', 'run', 'move', 'trot'];
        const searchTerms = name === 'walk' ? keys : [name];
        let clip = null;
        for (const term of searchTerms) {
            clip = Object.values(this.animations).find(a => a.name.toLowerCase().includes(term));
            if (clip) break;
        }
        if (!clip) return;
        const newAction = this.mixer.clipAction(clip);
        if (this.currentAction && this.currentAction.getClip() === clip) return;
        if (this.currentAction) {
            this.currentAction.fadeOut(0.3);
        }
        newAction.reset().fadeIn(0.3).play();
        this.currentAction = newAction;
    }

    getAnimationNames() {
        return this.animations ? Object.keys(this.animations) : [];
    }

    canFire() {
        return this.fireTimer <= 0;
    }

    resetFireTimer() {
        this.fireTimer = this.fireCooldown;
    }

    muzzleFlash(pos) {
        const light = new THREE.PointLight(0xff8800, 3, 5);
        light.position.copy(pos);
        this.scene.add(light);
        const c = document.createElement('canvas');
        c.width = c.height = 32;
        const ctx = c.getContext('2d');
        const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        g.addColorStop(0, 'rgba(255,255,200,1)');
        g.addColorStop(0.3, 'rgba(255,200,50,1)');
        g.addColorStop(1, 'rgba(255,100,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 32, 32);
        const tex = new THREE.CanvasTexture(c);
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
        const sprite = new THREE.Sprite(mat);
        sprite.position.copy(pos);
        sprite.scale.setScalar(1.2);
        this.scene.add(sprite);
        setTimeout(() => { this.scene.remove(light); this.scene.remove(sprite); }, 80);
    }

    addGun() {
        const mat = new THREE.MeshPhongMaterial({ color: 0x222222 });
        const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.6), mat);
        barrel.position.set(0.35, 0.85, -0.5);
        this.group.add(barrel);
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.25), mat);
        body.position.set(0.35, 0.85, -0.15);
        this.group.add(body);
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.04), mat);
        grip.position.set(0.35, 0.72, -0.08);
        this.group.add(grip);
    }

    updateAI(dt) {
        if (!this.alive) return;

        if (this.mixer) {
            this.mixer.update(dt);
        }

        this.fireTimer -= dt;

        const origin = this.group.position.clone();
        origin.y += 1.2;
        let target = null;
        if (this.isPlayerTeam) {
            const enemies = window.SoldierManager ? SoldierManager.getEnemySoldiers() : [];
            let closest = Infinity;
            for (const e of enemies) {
                const d = origin.distanceTo(e.group.position);
                if (d < closest) { closest = d; target = e; }
            }
        } else {
            if (window.Game && Game.player && Game.player.alive) {
                const d = origin.distanceTo(Game.player.group.position);
                if (d < 50) target = Game.player;
            }
            if (!target) {
                const friendlies = window.SoldierManager ? SoldierManager.getPlayerSoldiers() : [];
                let closest = Infinity;
                for (const f of friendlies) {
                    const d = origin.distanceTo(f.group.position);
                    if (d < closest) { closest = d; target = f; }
                }
            }
        }

        if (target) {
            const targetPos = target.group ? target.group.position : target.position;
            const dx = targetPos.x - this.group.position.x;
            const dz = targetPos.z - this.group.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
                    if (dist < 80 && dist > 3) {
                    this.group.rotation.y = Math.atan2(dx, dz);
                if (this.canFire()) {
                    const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.quaternion);
                    dir.y = 0;
                    dir.normalize();
                    let tip;
                    const muzzleObj = this.rifleModel ? this.rifleModel.getObjectByName('muzzleTip') : null;
                    if (muzzleObj) {
                        tip = new THREE.Vector3();
                        muzzleObj.getWorldPosition(tip);
                    } else {
                        tip = this.group.position.clone();
                        tip.y += 1.2;
                        tip.add(dir.clone().multiplyScalar(0.5));
                    }
                    if (typeof SoldierBulletManager !== 'undefined') {
                        this.muzzleFlash(tip);
                        SoldierBulletManager.fire(this.scene, tip, dir, this.isPlayerTeam);
                    } else {
                        console.log('SoldierBulletManager UNDEFINED!');
                    }
                    this.resetFireTimer();
                }
            }
        }

        this.patrolTimer -= dt;
        if (this.patrolTimer <= 0) {
            this.patrolAngle += (Math.random() - 0.5) * 2;
            this.patrolTimer = 2 + Math.random() * 3;
        }

        const targetX = this.patrolCenter.x + Math.cos(this.patrolAngle) * 8;
        const targetZ = this.patrolCenter.z + Math.sin(this.patrolAngle) * 8;

        const dx = targetX - this.group.position.x;
        const dz = targetZ - this.group.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 1) {
            this.group.position.x += (dx / dist) * this.speed * dt;
            this.group.position.z += (dz / dist) * this.speed * dt;
            this.group.rotation.y = Math.atan2(dx, dz);
            this.setAnimation('walk');
            this._walking = true;
        } else {
            this.setAnimation('idle');
            this._walking = false;
        }

        if (this._walking) {
            this._walkTime += dt;
            this.group.position.y = Math.abs(Math.sin(this._walkTime * 10)) * 0.08;
            this.group.rotation.z = Math.sin(this._walkTime * 10) * 0.03;
        } else {
            this._walkTime = 0;
            this.group.position.y *= 0.9;
            this.group.rotation.z *= 0.9;
        }

        const bound = 85;
        this.group.position.x = Math.max(-bound, Math.min(bound, this.group.position.x));
        this.group.position.z = Math.max(-bound, Math.min(bound, this.group.position.z));
    }

    createLetterLabel() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        this.letterCanvas = canvas;
        this.letterCtx = canvas.getContext('2d');

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        this.wordSprite = new THREE.Sprite(mat);
        this.wordSprite.scale.set(4, 1.0, 1);
        this.wordSprite.position.y = 2.8;
        this.group.add(this.wordSprite);
        this.drawLetterLabel();
    }

    drawLetterLabel() {
        const ctx = this.letterCtx;
        ctx.clearRect(0, 0, 512, 128);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.moveTo(20, 0); ctx.lineTo(492, 0);
        ctx.quadraticCurveTo(512, 0, 512, 20);
        ctx.lineTo(512, 108); ctx.quadraticCurveTo(512, 128, 492, 128);
        ctx.lineTo(20, 128); ctx.quadraticCurveTo(0, 128, 0, 108);
        ctx.lineTo(0, 20); ctx.quadraticCurveTo(0, 0, 20, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ff6666';
        ctx.lineWidth = 4;
        ctx.stroke();

        const displayWord = this.word ? this.word.en : (this.letter || '');
        ctx.fillStyle = '#ffffff';
        const fontSize = Math.min(72, Math.floor(440 / Math.max(displayWord.length, 1)));
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayWord, 256, 64);
        if (this.wordSprite) this.wordSprite.material.map.needsUpdate = true;
    }

    updateLetterLabel() {
        if (this.letterCanvas) this.drawLetterLabel();
    }

    dispose() {
        this.scene.remove(this.group);
    }
}

const SoldierManager = {
    soldiers: [],
    scene: null,

    init(scene) {
        this.scene = scene;
        this.soldiers = [];
    },

    spawnFriendly(count) {
        for (let i = 0; i < count; i++) {
            const s = new Soldier(this.scene, true);
            const angle = (i / count) * Math.PI * 2;
            const dist = 5 + Math.random() * 3;
            s.group.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
            s.patrolCenter.copy(s.group.position);
            this.soldiers.push(s);
        }
    },

    spawnEnemy(count) {
        for (let i = 0; i < count; i++) {
            const s = new Soldier(this.scene, false);
            const angle = Math.random() * Math.PI * 2;
            const dist = 35 + Math.random() * 30;
            s.group.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
            s.patrolCenter.copy(s.group.position);
            this.soldiers.push(s);
        }
    },

    getPlayerSoldiers() {
        return this.soldiers.filter(s => s.isPlayerTeam && s.alive);
    },

    getEnemySoldiers() {
        return this.soldiers.filter(s => !s.isPlayerTeam && s.alive);
    },

    update(dt) {
        this.soldiers.forEach(s => {
            if (s.alive) s.updateAI(dt);
        });
    },

    updateMixers(dt) {
        this.soldiers.forEach(s => {
            if (s.alive && s.mixer) {
                s.mixer.update(dt);
            }
        });
    },

    clear() {
        this.soldiers.forEach(s => s.dispose());
        this.soldiers = [];
        this.scene = null;
    }
};

window.SoldierManager = SoldierManager;
