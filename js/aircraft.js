class Aircraft {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.alive = true;
        this.health = 40;
        this.speed = 15 + Math.random() * 10;
        this.altitude = 20 + Math.random() * 15;
        this.letter = String.fromCharCode(97 + Math.floor(Math.random() * 26));
        this.falling = false;
        this.fallSpeed = 0;
        this.fallRotSpeed = 0;

        this.buildModel();
        this.createLetterLabel();

        const angle = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * 30;
        this.group.position.set(Math.cos(angle) * dist, this.altitude, Math.sin(angle) * dist);

        this.flyDir = new THREE.Vector3(-Math.cos(angle), 0, -Math.sin(angle)).normalize();
        this.group.rotation.y = Math.atan2(this.flyDir.x, this.flyDir.z);

        scene.add(this.group);
    }

    buildModel() {
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x556677, roughness: 0.4, metalness: 0.5 });
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x667788, roughness: 0.5, metalness: 0.4 });
        const accentMat = new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.5 });

        const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 3.5, 8), bodyMat);
        fuselage.rotation.x = Math.PI / 2;
        fuselage.castShadow = true;
        this.group.add(fuselage);

        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), bodyMat);
        nose.position.z = -1.75;
        this.group.add(nose);

        const wingGeo = new THREE.BoxGeometry(5, 0.08, 1.0);
        const wings = new THREE.Mesh(wingGeo, wingMat);
        wings.position.set(0, 0, 0.2);
        wings.castShadow = true;
        this.group.add(wings);

        const tailWing = new THREE.Mesh(new THREE.BoxGeometry(2, 0.06, 0.5), wingMat);
        tailWing.position.set(0, 0, 1.6);
        this.group.add(tailWing);

        const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.0, 0.6), accentMat);
        tailFin.position.set(0, 0.5, 1.6);
        this.group.add(tailFin);

        const propGeo = new THREE.BoxGeometry(1.2, 0.08, 0.08);
        const prop = new THREE.Mesh(propGeo, new THREE.MeshStandardMaterial({ color: 0x333333 }));
        prop.position.z = -2.0;
        this.group.add(prop);
        this.propeller = prop;
    }

    createLetterLabel() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        this.letterCanvas = canvas;
        this.letterCtx = canvas.getContext('2d');

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        this.wordSprite = new THREE.Sprite(mat);
        this.wordSprite.scale.set(3, 3, 1);
        this.wordSprite.position.y = 2.5;
        this.group.add(this.wordSprite);
        this.drawLetterLabel();
    }

    drawLetterLabel() {
        const ctx = this.letterCtx;
        ctx.clearRect(0, 0, 128, 128);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.beginPath();
        ctx.arc(64, 64, 55, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffaa22';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(64, 64, 55, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.letter.toUpperCase(), 64, 62);
        if (this.wordSprite) this.wordSprite.material.map.needsUpdate = true;
    }

    updateLetterLabel() {
        if (this.letterCanvas) this.drawLetterLabel();
    }

    update(dt) {
        if (!this.alive && !this.falling) return;

        if (this.propeller) this.propeller.rotation.z += dt * 30;

        if (this.falling) {
            this.fallSpeed += 15 * dt;
            this.group.position.y -= this.fallSpeed * dt;
            this.group.rotation.x += this.fallRotSpeed * dt;
            this.group.rotation.z += this.fallRotSpeed * 0.7 * dt;

            if (this.group.position.y <= 0.5) {
                this.group.position.y = 0.5;
                this.alive = false;
                this.falling = false;
                return 'crashed';
            }
            return null;
        }

        this.group.position.addScaledVector(this.flyDir, this.speed * dt);
        this.group.position.y = this.altitude + Math.sin(Date.now() * 0.001) * 1.5;

        const bound = 90;
        const pos = this.group.position;
        if (Math.abs(pos.x) > bound || Math.abs(pos.z) > bound) {
            this.flyDir.set(-pos.x, 0, -pos.z).normalize();
            this.group.rotation.y = Math.atan2(this.flyDir.x, this.flyDir.z);
        }

        return null;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0 && !this.falling) {
            this.falling = true;
            this.fallSpeed = 2;
            this.fallRotSpeed = 2 + Math.random() * 3;
        }
    }

    dispose() {
        this.alive = false;
        this.falling = false;
        this.scene.remove(this.group);
    }
}

const AircraftManager = {
    aircraft: [],
    scene: null,
    spawnTimer: 0,

    init(scene) {
        this.scene = scene;
        this.aircraft = [];
        this.spawnTimer = 5;
        for (let i = 0; i < 2; i++) this.spawn();
    },

    spawn() {
        const a = new Aircraft(this.scene);
        this.aircraft.push(a);
    },

    update(dt) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0 && this.aircraft.filter(a => a.alive || a.falling).length < 3) {
            this.spawn();
            this.spawnTimer = 8 + Math.random() * 10;
            if (typeof SpellTracker !== 'undefined') SpellTracker.reassignEnemyLetters();
        }

        for (let i = this.aircraft.length - 1; i >= 0; i--) {
            const a = this.aircraft[i];
            const result = a.update(dt);
            if (result === 'crashed') {
                if (typeof ExplosionManager !== 'undefined') {
                    ExplosionManager.create(this.scene, a.group.position.clone(), true);
                }
                a.dispose();
                this.aircraft.splice(i, 1);
            } else if (!a.alive && !a.falling) {
                a.dispose();
                this.aircraft.splice(i, 1);
            }
        }
    },

    getAlive() {
        return this.aircraft.filter(a => a.alive && !a.falling);
    },

    clear() {
        this.aircraft.forEach(a => a.dispose());
        this.aircraft = [];
        this.scene = null;
    }
};
