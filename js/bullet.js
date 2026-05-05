class Bullet {
    constructor(scene, position, direction, isPlayer = true) {
        this.scene = scene;
        this.isPlayer = isPlayer;
        this.alive = true;
        this.speed = 60;
        this.direction = direction.normalize();
        this.age = 0;
        this.maxAge = 4;

        const color = isPlayer ? 0x88ff88 : 0xff8888;

        // bullet core - bright emissive
        const geo = new THREE.SphereGeometry(0.2, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: color });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.copy(position);
        scene.add(this.mesh);

        // glow
        const glowGeo = new THREE.SphereGeometry(0.5, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.6
        });
        this.glow = new THREE.Mesh(glowGeo, glowMat);
        this.mesh.add(this.glow);

        // trail light - brighter
        this.light = new THREE.PointLight(color, 4, 12);
        this.mesh.add(this.light);

        // trail particles
        this.trail = [];
    }

    update(dt) {
        this.age += dt;
        if (this.age >= this.maxAge) {
            this.dispose();
            return;
        }

        const move = this.direction.clone().multiplyScalar(this.speed * dt);
        this.mesh.position.add(move);

        // add trail particle
        if (Math.random() < 0.25) {
            const trailGeo = new THREE.SphereGeometry(0.06, 4, 4);
            const trailMat = new THREE.MeshBasicMaterial({
                color: this.isPlayer ? 0x88ff88 : 0xff8888,
                transparent: true,
                opacity: 0.6
            });
            const trail = new THREE.Mesh(trailGeo, trailMat);
            trail.position.copy(this.mesh.position);
            trail.userData.life = 0.3;
            this.scene.add(trail);
            this.trail.push(trail);
        }

        // update trail
        for (let i = this.trail.length - 1; i >= 0; i--) {
            this.trail[i].userData.life -= dt;
            this.trail[i].material.opacity = this.trail[i].userData.life / 0.3;
            if (this.trail[i].userData.life <= 0) {
                this.scene.remove(this.trail[i]);
                this.trail.splice(i, 1);
            }
        }

        // ground check
        if (this.mesh.position.y < 0) {
            this.dispose();
        }
    }

    getPosition() {
        return this.mesh.position;
    }

    dispose() {
        this.alive = false;
        this.scene.remove(this.mesh);
        this.trail.forEach(t => this.scene.remove(t));
        this.trail = [];
    }
}

const BulletManager = {
    bullets: [],

    fire(scene, position, direction, isPlayer) {
        if (typeof MuzzleFlash !== 'undefined') {
            MuzzleFlash.create(scene, position, direction);
        }
        if (typeof AudioManager !== 'undefined') {
            AudioManager.playGunshot();
        }
        this.bullets.push(new Bullet(scene, position, direction, isPlayer));
    },

    update(dt) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update(dt);
            if (!this.bullets[i].alive) {
                this.bullets.splice(i, 1);
            }
        }
    },

    clear() {
        this.bullets.forEach(b => b.dispose());
        this.bullets = [];
    }
};

window.BulletManager = BulletManager;
