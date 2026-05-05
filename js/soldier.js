class Soldier {
    constructor(scene, isPlayerTeam = true) {
        this.scene = scene;
        this.isPlayerTeam = isPlayerTeam;
        this.group = new THREE.Group();
        this.health = 30;
        this.maxHealth = 30;
        this.alive = true;
        this.speed = 2;
        this.patrolCenter = new THREE.Vector3();
        this.patrolAngle = Math.random() * Math.PI * 2;
        this.patrolTimer = 0;
        this.word = null;
        this.letter = '';

        this.buildModel();
        this.createHealthBar();
        if (!isPlayerTeam) {
            this.word = WordManager.getRandomWord();
            this.letter = this.word.en;
            this.createLetterLabel();
        }
        scene.add(this.group);
    }

    buildModel() {
        this.buildPrimitiveModel();
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

    updateAI(dt) {
        if (!this.alive) return;

        // No GLTF upgrade

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
        ctx.fillStyle = 'rgba(0,0,0,0.88)';
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
            console.log('Spawned friendly soldier at', s.group.position.x.toFixed(1), s.group.position.z.toFixed(1));
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
            console.log('Spawned enemy soldier at', s.group.position.x.toFixed(1), s.group.position.z.toFixed(1));
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

    clear() {
        this.soldiers.forEach(s => s.dispose());
        this.soldiers = [];
        this.scene = null;
    }
};

window.SoldierManager = SoldierManager;
