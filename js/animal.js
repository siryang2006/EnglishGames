class Animal {
    constructor(scene, type) {
        this.scene = scene;
        this.type = type;
        this.group = new THREE.Group();
        this.alive = true;
        this.health = 30;
        this.speed = (type === 'deer' || type === 'low_poly_deer') ? 5 : 
                     (type === 'tiger' || type === 'cow') ? 6 : 7;
        this.runTimer = 0;
        this.runDir = new THREE.Vector3();
        this.idleTimer = 2 + Math.random() * 4;
        this.state = 'idle';
        this.word = WordManager.getRandomWord();
        this.letter = this.word.en;
        this.usingGltf = false;

        console.log('Creating animal type:', type, 'speed:', this.speed);
        this.buildModel();
        this.createLetterLabel();
        scene.add(this.group);
    }

    buildModel() {
        // Temporarily disable GLTF models to ensure animals display correctly
        // Will re-enable after debugging
        this.buildProcedural();
    }

    loadGLTFModel() {
        let model = null;
        let scale = 0.15; // default scale
        switch(this.type) {
            case 'deer': model = ModelLoader.getDeer(); scale = 0.15; break;
            case 'low_poly_deer': model = ModelLoader.getLowPolyDeer(); scale = 0.15; break;
            case 'horse': model = ModelLoader.getHorse(); scale = 0.012; break;
            case 'horse_rigged': model = ModelLoader.getHorseRigged(); scale = 0.012; break;
            case 'duck': model = ModelLoader.getDuck(); scale = 0.2; break;
            case 'parrot': model = ModelLoader.getParrot(); scale = 0.2; break;
            case 'flamingo': model = ModelLoader.getFlamingo(); scale = 0.15; break;
            case 'flamingo2': model = ModelLoader.getFlamingo2(); scale = 0.15; break;
            // Tiger/Cow temporarily disabled - use procedural
            case 'tiger': 
            case 'cow':
                console.log('Animal:', this.type, 'using procedural model (GLTF too large)');
                this.buildProcedural();
                return;
            default: model = ModelLoader.getDeer(); scale = 0.15;
        }
        if (model) {
            model.scale.setScalar(scale);
            model.rotation.y = Math.PI; // face -X to match tank forward
            this.group.add(model);
            this.usingGltf = true;
            console.log('Animal:', this.type, 'scale:', scale, 'children:', model.children.length);
        } else {
            console.warn('Animal: no GLTF model for', this.type, ', using procedural');
            this.buildProcedural();
        }
    }

    buildProcedural() {
        if (this.type === 'deer' || this.type === 'low_poly_deer') {
            this.buildDeer();
        } else if (this.type === 'horse' || this.type === 'horse_rigged') {
            this.buildHorse();
        } else if (this.type === 'tiger') {
            this.buildTiger();
        } else if (this.type === 'cow') {
            this.buildCow();
        } else if (this.type === 'duck' || this.type === 'parrot') {
            this.buildBird();
        } else if (this.type === 'flamingo' || this.type === 'flamingo2') {
            this.buildFlamingo();
        } else {
            this.buildBoar();
        }
    }

    buildTiger() {
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xFFA500, roughness: 0.8 });
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.8 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 1.4), bodyMat);
        body.position.y = 0.8; body.castShadow = true;
        this.group.add(body);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.4), bodyMat);
        head.position.set(0, 1.1, -0.7); this.group.add(head);
        const legMat = new THREE.MeshStandardMaterial({ color: 0xCC5500, roughness: 0.8 });
        for (let i = 0; i < 4; i++) {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.12), legMat);
            const side = i < 2 ? 0.25 : -0.25;
            const front = i % 2 === 0 ? 0.5 : -0.5;
            leg.position.set(side, 0.35, front); leg.castShadow = true;
            this.group.add(leg);
        }
    }

    buildCow() {
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.8 });
        const spotMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.8 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 1.6), bodyMat);
        body.position.y = 0.8; body.castShadow = true;
        this.group.add(body);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.5), bodyMat);
        head.position.set(0, 1.2, -0.9); this.group.add(head);
        const legMat = new THREE.MeshStandardMaterial({ color: 0xCCCCCC, roughness: 0.8 });
        for (let i = 0; i < 4; i++) {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8, 0.15), legMat);
            const side = i < 2 ? 0.35 : -0.35;
            const front = i % 2 === 0 ? 0.6 : -0.6;
            leg.position.set(side, 0.4, front); leg.castShadow = true;
            this.group.add(leg);
        }
    }

    buildHorse() {
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.4), bodyMat);
        body.position.y = 1.0; body.castShadow = true;
        this.group.add(body);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.5), bodyMat);
        head.position.set(0, 1.3, -0.7); this.group.add(head);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x663300, roughness: 0.8 });
        for (let i = 0; i < 4; i++) {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.0, 0.15), legMat);
            const side = i < 2 ? 0.25 : -0.25;
            const front = i % 2 === 0 ? 0.5 : -0.5;
            leg.position.set(side, 0.5, front); leg.castShadow = true;
            this.group.add(leg);
        }
    }

    buildBird() {
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.8 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.6), bodyMat);
        body.position.y = 1.0; body.castShadow = true;
        this.group.add(body);
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.4), bodyMat);
        wing.position.set(0, 1.1, 0); this.group.add(wing);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.3), bodyMat);
        head.position.set(0, 1.2, -0.4); this.group.add(head);
    }

    buildFlamingo() {
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xFF69B4, roughness: 0.8 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.4), bodyMat);
        body.position.y = 1.2; body.castShadow = true;
        this.group.add(body);
        const neck = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8, 0.15), bodyMat);
        neck.position.set(0, 1.8, -0.2); this.group.add(neck);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.3), bodyMat);
        head.position.set(0, 2.3, -0.3); this.group.add(head);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.8 });
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.1), legMat);
        leg.position.set(0, 0.5, 0.2); leg.castShadow = true;
        this.group.add(leg);
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
        // Use simple type list for procedural models
        const types = ['deer', 'horse', 'duck', 'cow', 'boar'];
        for (let i = 0; i < count; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
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
