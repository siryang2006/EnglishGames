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
        this.usingGltf = false;

        this.buildModel();
        this.createLetterLabel();
        scene.add(this.group);
    }

    buildModel() {
        if (typeof ModelLoader !== 'undefined' && ModelLoader.animals) {
            this.loadGLTFModel();
        } else if (this.type === 'deer') {
            this.buildDeer();
        } else {
            this.buildBoar();
        }
    }

    loadGLTFModel() {
        const model = ModelLoader.getAnimals();
        if (model) {
            model.scale.setScalar(0.15);
            model.rotation.y = Math.PI;
            this.group.add(model);
            this.usingGltf = true;
            console.log('Animal: using GLTF model');
        } else {
            if (this.type === 'deer') this.buildDeer();
            else this.buildBoar();
        }
    };

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
        head.position.set(0, 1.7, -0.65);
        this.group.add(head);

        for (let i = 0; i < 4; i++) {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.8, 0.12), legMat);
            const side = i < 2 ? 0.2 : -0.2;
            const front = i % 2 === 0 ? 0.4 : -0.4;
            leg.position.set(side, 0.4, front);
            leg.castShadow = true;
            this.group.add(leg);
        }

        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.15), bodyMat);
        tail.position.set(0, 1.1, 0.65);
        this.group.add(tail);
    };

    buildBoar() {
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x554433, roughness: 0.85 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.9 });

        const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 1.1), bodyMat);
        body.position.y = 0.6;
        body.castShadow = true;
        this.group.add(body);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.5), bodyMat);
        head.position.set(0, 0.55, -0.65);
        head.castShadow = true;
        this.group.add(head);

        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.2), darkMat);
        snout.position.set(0, 0.45, -0.95);
        this.group.add(snout);

        const tuskL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.15), darkMat);
        tuskL.position.set(0.12, 0.5, -0.8);
        tuskL.rotation.x = Math.PI / 4;
        this.group.add(tuskL);

        const tuskR = tuskL.clone();
        tuskR.position.x = -0.12;
        this.group.add(tuskR);

        for (let i = 0; i < 4; i++) {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.12), darkMat);
            const side = i < 2 ? 0.25 : -0.25;
            const front = i % 2 === 0 ? 0.35 : -0.35;
            leg.position.set(side, 0.2, front);
            leg.castShadow = true;
            this.group.add(leg);
        }
    };

    createLetterLabel() {
        if (!this.letter) return;
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, 128, 64);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.letter, 64, 32);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(1.5, 0.75, 1);
        sprite.position.y = 2.5;
        this.group.add(sprite);
        this.letterSprite = sprite;
    };

    update(dt, playerPos) {
        if (!this.alive) return;

        const dist = this.group.position.distanceTo(playerPos);
        if (dist < 4) {
            this.state = 'flee';
            const dir = new THREE.Vector3().subVectors(this.group.position, playerPos).normalize();
            this.runDir.lerp(dir, 0.1);
        }

        if (this.state === 'idle') {
            this.idleTimer -= dt;
            if (this.idleTimer <= 0) {
                this.state = 'walk';
                this.walkDir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
                this.walkTimer = 2 + Math.random() * 3;
            }
        } else if (this.state === 'walk') {
            this.group.position.add(this.walkDir.clone().multiplyScalar(this.speed * dt * 0.3));
            this.group.lookAt(this.group.position.clone().add(this.walkDir));
            this.walkTimer -= dt;
            if (this.walkTimer <= 0) {
                this.state = 'idle';
                this.idleTimer = 2 + Math.random() * 4;
            }
        } else if (this.state === 'flee') {
            this.group.position.add(this.runDir.clone().multiplyScalar(this.speed * dt));
            this.group.lookAt(this.group.position.clone().add(this.runDir));
            this.runTimer -= dt;
            if (this.runTimer <= 0 || this.group.position.length() > 120) {
                this.state = 'idle';
                this.idleTimer = 2 + Math.random() * 4;
            }
        }

        if (this.group.position.x < -120) this.group.position.x = -120;
        if (this.group.position.x > 120) this.group.position.x = 120;
        if (this.group.position.z < -120) this.group.position.z = -120;
        if (this.group.position.z > 120) this.group.position.z = 120;
    };

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
            return true;
        }
        return false;
    };

    die() {
        this.alive = false;
        if (this.letterSprite) {
            this.group.remove(this.letterSprite);
        }
    };

    dispose() {
        if (this.letterSprite) {
            this.letterSprite.material.map.dispose();
            this.letterSprite.material.dispose();
        }
        if (this.group.parent) {
            this.group.parent.remove(this.group);
        }
    };

    checkTankCollision(tankPos) {
        if (!this.alive) return false;
        return this.group.position.distanceTo(tankPos) < 2;
    }
};

const AnimalManager = {
    animals: [],

    init(scene) {
        this.scene = scene;
        this.animals = [];
    },

    spawn(count) {
        for (let i = 0; i < count; i++) {
            const type = Math.random() > 0.5 ? 'deer' : 'boar';
            const animal = new Animal(this.scene, type);
            const angle = Math.random() * Math.PI * 2;
            const dist = 40 + Math.random() * 60;
            animal.group.position.set(Math.sin(angle) * dist, 0, Math.cos(angle) * dist);
            animal.runTimer = 0;
            console.log('Spawned', type, 'at', animal.group.position.x.toFixed(1), animal.group.position.z.toFixed(1));
            this.animals.push(animal);
        }
    },

    update(dt, tankPositions) {
        const playerPos = tankPositions[0];
        this.animals.forEach(a => a.update(dt, playerPos));
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
    }
};

window.AnimalManager = AnimalManager;
