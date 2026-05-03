class Animal {
    constructor(scene, type) {
        this.scene = scene;
        this.type = type;
        this.group = new THREE.Group();
        this.alive = true;
        this.health = 30;
        this.speed = type === 'deer' ? 5 : 7;
        this.runTimer = 0;
        this.runDir = new THREE.Vector3();
        this.idleTimer = 2 + Math.random() * 4;
        this.state = 'idle';
        this.word = WordManager.getRandomWord();
        this.letter = this.word.en;

        this.buildModel();
        this.createLetterLabel();
        scene.add(this.group);
    }

    buildModel() {
        if (this.type === 'deer') {
            this.buildDeer();
        } else {
            this.buildBoar();
        }
    }

    buildDeer() {
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xaa7744, roughness: 0.8 });
        const legMat = new THREE.MeshStandardMaterial({ color: 0x886633, roughness: 0.8 });

        const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 1.2), bodyMat);
        body.position.y = 1.0;
        body.castShadow = true;
        this.group.add(body);

        const neck = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.2), bodyMat);
        neck.position.set(0, 1.4, -0.5);
        neck.rotation.x = -0.4;
        this.group.add(neck);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.35), bodyMat);
        head.position.set(0, 1.65, -0.65);
        head.castShadow = true;
        this.group.add(head);

        const antlerMat = new THREE.MeshStandardMaterial({ color: 0x664422, roughness: 0.9 });
        for (let side = -1; side <= 1; side += 2) {
            const a1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.35, 4), antlerMat);
            a1.position.set(side * 0.12, 1.85, -0.6);
            a1.rotation.z = side * -0.4;
            this.group.add(a1);
            const a2 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.2, 4), antlerMat);
            a2.position.set(side * 0.2, 2.0, -0.55);
            a2.rotation.z = side * -0.8;
            this.group.add(a2);
        }

        for (let side = -1; side <= 1; side += 2) {
            for (let fb = -1; fb <= 1; fb += 2) {
                const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6), legMat);
                leg.position.set(side * 0.2, 0.45, fb * 0.4);
                leg.castShadow = true;
                this.group.add(leg);
            }
        }

        const tail = new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 4), new THREE.MeshStandardMaterial({ color: 0xeeddcc }));
        tail.position.set(0, 1.1, 0.65);
        this.group.add(tail);
    }

    buildBoar() {
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x554433, roughness: 0.9 });
        const legMat = new THREE.MeshStandardMaterial({ color: 0x443322, roughness: 0.9 });

        const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 1.0), bodyMat);
        body.position.y = 0.7;
        body.castShadow = true;
        this.group.add(body);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.4), bodyMat);
        head.position.set(0, 0.75, -0.65);
        head.castShadow = true;
        this.group.add(head);

        const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.15, 8), new THREE.MeshStandardMaterial({ color: 0x997766 }));
        snout.position.set(0, 0.68, -0.85);
        snout.rotation.x = Math.PI / 2;
        this.group.add(snout);

        const tuskMat = new THREE.MeshStandardMaterial({ color: 0xeeeedd });
        for (let side = -1; side <= 1; side += 2) {
            const tusk = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.12, 4), tuskMat);
            tusk.position.set(side * 0.1, 0.65, -0.82);
            tusk.rotation.x = 0.3;
            this.group.add(tusk);
        }

        for (let side = -1; side <= 1; side += 2) {
            for (let fb = -1; fb <= 1; fb += 2) {
                const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 6), legMat);
                leg.position.set(side * 0.25, 0.25, fb * 0.35);
                leg.castShadow = true;
                this.group.add(leg);
            }
        }
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
        this.wordSprite.position.y = this.type === 'deer' ? 2.8 : 1.8;
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
        ctx.strokeStyle = '#88cc44';
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

    update(dt, tankPositions) {
        if (!this.alive) return;

        if (this.state === 'idle') {
            this.idleTimer -= dt;
            if (this.idleTimer <= 0) {
                this.state = 'wander';
                this.runDir.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
                this.runTimer = 2 + Math.random() * 3;
            }

            for (const tPos of tankPositions) {
                if (this.group.position.distanceTo(tPos) < 15) {
                    this.state = 'flee';
                    this.runDir.subVectors(this.group.position, tPos).normalize();
                    this.runTimer = 2 + Math.random() * 2;
                    break;
                }
            }
        } else if (this.state === 'wander') {
            this.group.position.addScaledVector(this.runDir, this.speed * 0.4 * dt);
            this.group.rotation.y = Math.atan2(this.runDir.x, this.runDir.z);
            this.runTimer -= dt;
            if (this.runTimer <= 0) {
                this.state = 'idle';
                this.idleTimer = 3 + Math.random() * 5;
            }
        } else if (this.state === 'flee') {
            this.group.position.addScaledVector(this.runDir, this.speed * dt);
            this.group.rotation.y = Math.atan2(this.runDir.x, this.runDir.z);
            this.runTimer -= dt;
            if (this.runTimer <= 0) {
                this.state = 'idle';
                this.idleTimer = 4 + Math.random() * 4;
            }
        }

        const bound = 85;
        const pos = this.group.position;
        if (Math.abs(pos.x) > bound || Math.abs(pos.z) > bound) {
            this.runDir.set(-pos.x, 0, -pos.z).normalize();
            this.state = 'wander';
            this.runTimer = 2;
        }
        pos.x = Math.max(-bound, Math.min(bound, pos.x));
        pos.z = Math.max(-bound, Math.min(bound, pos.z));
    }

    checkTankCollision(tankPos) {
        if (!this.alive) return false;
        const dist = this.group.position.distanceTo(tankPos);
        if (dist < 2.0 && (this.state === 'flee' || this.state === 'wander')) {
            return true;
        }
        return false;
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        if (this.health <= 0) this.alive = false;
    }

    dispose() {
        this.alive = false;
        this.scene.remove(this.group);
    }
}

const AnimalManager = {
    animals: [],
    scene: null,

    init(scene) {
        this.scene = scene;
        this.animals = [];
        const types = ['deer', 'deer', 'boar', 'boar'];
        types.forEach(type => {
            const a = new Animal(scene, type);
            const angle = Math.random() * Math.PI * 2;
            const dist = 25 + Math.random() * 45;
            a.group.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
            this.animals.push(a);
        });
    },

    update(dt, tankPositions) {
        this.animals.forEach(a => a.update(dt, tankPositions));
    },

    checkCollisions(tankPos) {
        for (const a of this.animals) {
            if (a.checkTankCollision(tankPos)) {
                return a;
            }
        }
        return null;
    },

    clear() {
        this.animals.forEach(a => a.dispose());
        this.animals = [];
        this.scene = null;
    }
};
