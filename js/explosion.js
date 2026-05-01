class Explosion {
    constructor(scene, position, isEnemy = true) {
        this.scene = scene;
        this.particles = [];
        this.debris = [];
        this.shockwave = null;
        this.shockwave2 = null;
        this.light = null;
        this.scorch = null;
        this.alive = true;
        this.age = 0;
        this.maxAge = isEnemy ? 3.0 : 0.8;
        this.position = position.clone();
        this.secondaryTimers = isEnemy ? [0.25, 0.55] : [];

        if (isEnemy) {
            this.createBigExplosion(position);
        } else {
            this.createSmallExplosion(position);
        }
    }

    createBigExplosion(pos) {
        for (let i = 0; i < 150; i++) {
            const size = 0.15 + Math.random() * 0.45;
            const geo = new THREE.SphereGeometry(size, 4, 4);
            const hue = Math.random() * 0.12;
            const mat = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(hue, 1, 0.4 + Math.random() * 0.4),
                transparent: true,
                opacity: 1
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(pos);

            const speed = 3 + Math.random() * 18;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            mesh.userData.velocity = new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.abs(Math.cos(phi)) * speed * 0.8 + 3,
                Math.sin(phi) * Math.sin(theta) * speed
            );
            mesh.userData.life = 0.5 + Math.random() * 1.8;
            mesh.userData.maxLife = mesh.userData.life;

            this.scene.add(mesh);
            this.particles.push(mesh);
        }

        for (let i = 0; i < 50; i++) {
            const size = 0.6 + Math.random() * 1.2;
            const geo = new THREE.SphereGeometry(size, 6, 6);
            const gray = 0.15 + Math.random() * 0.25;
            const mat = new THREE.MeshBasicMaterial({
                color: new THREE.Color(gray, gray, gray),
                transparent: true,
                opacity: 0.7
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(pos).add(new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                Math.random() * 2,
                (Math.random() - 0.5) * 3
            ));
            mesh.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                1.5 + Math.random() * 4,
                (Math.random() - 0.5) * 3
            );
            mesh.userData.life = 1.2 + Math.random() * 1.8;
            mesh.userData.maxLife = mesh.userData.life;
            mesh.userData.isSmoke = true;

            this.scene.add(mesh);
            this.particles.push(mesh);
        }

        for (let i = 0; i < 40; i++) {
            const geo = new THREE.SphereGeometry(0.05, 3, 3);
            const mat = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(0.12, 1, 0.8 + Math.random() * 0.2),
                transparent: true,
                opacity: 1
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(pos);

            const speed = 15 + Math.random() * 25;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.6;
            mesh.userData.velocity = new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.cos(phi) * speed,
                Math.sin(phi) * Math.sin(theta) * speed
            );
            mesh.userData.life = 0.15 + Math.random() * 0.4;
            mesh.userData.maxLife = mesh.userData.life;
            mesh.userData.isSpark = true;

            this.scene.add(mesh);
            this.particles.push(mesh);
        }

        for (let i = 0; i < 35; i++) {
            const s = 0.2 + Math.random() * 0.6;
            const geo = new THREE.BoxGeometry(s, s * 0.5, s * 0.7);
            const mat = new THREE.MeshLambertMaterial({
                color: new THREE.Color().setHSL(0, 0.7, 0.15 + Math.random() * 0.2)
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(pos);

            const speed = 5 + Math.random() * 15;
            const theta = Math.random() * Math.PI * 2;
            mesh.userData.velocity = new THREE.Vector3(
                Math.cos(theta) * speed,
                4 + Math.random() * 10,
                Math.sin(theta) * speed
            );
            mesh.userData.rotSpeed = new THREE.Vector3(
                (Math.random() - 0.5) * 12,
                (Math.random() - 0.5) * 12,
                (Math.random() - 0.5) * 12
            );
            mesh.userData.life = 1.0 + Math.random() * 1.2;
            mesh.userData.maxLife = mesh.userData.life;

            this.scene.add(mesh);
            this.debris.push(mesh);
        }

        const ringGeo = new THREE.RingGeometry(0.5, 2.0, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xff8800,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        this.shockwave = new THREE.Mesh(ringGeo, ringMat);
        this.shockwave.position.copy(pos);
        this.shockwave.position.y = 0.5;
        this.shockwave.rotation.x = -Math.PI / 2;
        this.scene.add(this.shockwave);

        const ring2Geo = new THREE.RingGeometry(0.3, 1.0, 32);
        const ring2Mat = new THREE.MeshBasicMaterial({
            color: 0xffcc44,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        this.shockwave2 = new THREE.Mesh(ring2Geo, ring2Mat);
        this.shockwave2.position.copy(pos);
        this.shockwave2.position.y = 2;
        this.shockwave2.rotation.x = -Math.PI / 2;
        this.scene.add(this.shockwave2);

        this.light = new THREE.PointLight(0xff6600, 8, 40);
        this.light.position.copy(pos);
        this.light.position.y += 3;
        this.scene.add(this.light);

        const scorchGeo = new THREE.CircleGeometry(3.5, 16);
        const scorchMat = new THREE.MeshBasicMaterial({
            color: 0x111111,
            transparent: true,
            opacity: 0.6
        });
        this.scorch = new THREE.Mesh(scorchGeo, scorchMat);
        this.scorch.position.copy(pos);
        this.scorch.position.y = 0.06;
        this.scorch.rotation.x = -Math.PI / 2;
        this.scene.add(this.scorch);
    }

    createSmallExplosion(pos) {
        for (let i = 0; i < 25; i++) {
            const size = 0.08 + Math.random() * 0.18;
            const geo = new THREE.SphereGeometry(size, 4, 4);
            const mat = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(0.08 * Math.random(), 1, 0.6),
                transparent: true,
                opacity: 1
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(pos);

            const speed = 2 + Math.random() * 6;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            mesh.userData.velocity = new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.abs(Math.cos(phi)) * speed * 0.5 + 1,
                Math.sin(phi) * Math.sin(theta) * speed
            );
            mesh.userData.life = 0.3 + Math.random() * 0.5;
            mesh.userData.maxLife = mesh.userData.life;

            this.scene.add(mesh);
            this.particles.push(mesh);
        }

        this.light = new THREE.PointLight(0xff4400, 4, 15);
        this.light.position.copy(pos);
        this.light.position.y += 1;
        this.scene.add(this.light);
    }

    spawnSecondary(pos) {
        const offset = new THREE.Vector3(
            (Math.random() - 0.5) * 6,
            Math.random() * 2,
            (Math.random() - 0.5) * 6
        );
        const subPos = pos.clone().add(offset);

        for (let i = 0; i < 40; i++) {
            const size = 0.1 + Math.random() * 0.3;
            const geo = new THREE.SphereGeometry(size, 4, 4);
            const mat = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(Math.random() * 0.1, 1, 0.5 + Math.random() * 0.3),
                transparent: true,
                opacity: 1
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(subPos);

            const speed = 3 + Math.random() * 8;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            mesh.userData.velocity = new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.abs(Math.cos(phi)) * speed * 0.6 + 2,
                Math.sin(phi) * Math.sin(theta) * speed
            );
            mesh.userData.life = 0.3 + Math.random() * 0.8;
            mesh.userData.maxLife = mesh.userData.life;

            this.scene.add(mesh);
            this.particles.push(mesh);
        }

        const subLight = new THREE.PointLight(0xff8800, 4, 20);
        subLight.position.copy(subPos);
        subLight.userData.life = 0.5;
        this.scene.add(subLight);
        this.particles.push(subLight);
    }

    update(dt) {
        this.age += dt;
        if (this.age >= this.maxAge) {
            this.dispose();
            return;
        }

        for (let i = this.secondaryTimers.length - 1; i >= 0; i--) {
            if (this.age >= this.secondaryTimers[i]) {
                this.spawnSecondary(this.position);
                this.secondaryTimers.splice(i, 1);
            }
        }

        const gravity = -15;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            if (p.isLight) {
                if (p.userData.life !== undefined) {
                    p.userData.life -= dt;
                    if (p.userData.life <= 0) {
                        this.scene.remove(p);
                        this.particles.splice(i, 1);
                    } else {
                        p.intensity = p.userData.life * 8;
                    }
                }
                continue;
            }

            p.userData.life -= dt;
            if (p.userData.life <= 0) {
                this.scene.remove(p);
                this.particles.splice(i, 1);
                continue;
            }

            const lifeRatio = p.userData.life / p.userData.maxLife;
            p.material.opacity = lifeRatio;

            if (p.userData.isSpark) {
                p.userData.velocity.y += gravity * dt * 0.5;
                p.position.add(p.userData.velocity.clone().multiplyScalar(dt));
            } else {
                p.userData.velocity.y += gravity * dt * 0.3;
                p.position.add(p.userData.velocity.clone().multiplyScalar(dt));
            }

            if (p.userData.isSmoke) {
                p.scale.multiplyScalar(1 + dt * 0.6);
                p.userData.velocity.multiplyScalar(0.96);
            }

            if (p.position.y < 0.1) {
                p.position.y = 0.1;
                p.userData.velocity.y *= -0.3;
            }
        }

        for (let i = this.debris.length - 1; i >= 0; i--) {
            const d = this.debris[i];
            d.userData.life -= dt;
            if (d.userData.life <= 0) {
                this.scene.remove(d);
                this.debris.splice(i, 1);
                continue;
            }

            d.userData.velocity.y += gravity * dt;
            d.position.add(d.userData.velocity.clone().multiplyScalar(dt));
            d.rotation.x += d.userData.rotSpeed.x * dt;
            d.rotation.y += d.userData.rotSpeed.y * dt;
            d.rotation.z += d.userData.rotSpeed.z * dt;

            if (d.position.y < 0.2) {
                d.position.y = 0.2;
                d.userData.velocity.y *= -0.4;
                d.userData.velocity.x *= 0.7;
                d.userData.velocity.z *= 0.7;
            }
        }

        if (this.shockwave) {
            const scale = 1 + this.age * 18;
            this.shockwave.scale.set(scale, scale, 1);
            this.shockwave.material.opacity = Math.max(0, 0.9 - this.age * 1.5);
        }

        if (this.shockwave2) {
            const scale = 1 + Math.max(0, this.age - 0.1) * 12;
            this.shockwave2.scale.set(scale, scale, 1);
            this.shockwave2.material.opacity = Math.max(0, 0.6 - this.age * 1.0);
        }

        if (this.light) {
            this.light.intensity = Math.max(0, 8 * (1 - this.age / (this.maxAge * 0.4)));
        }

        if (this.scorch) {
            this.scorch.material.opacity = Math.max(0, 0.6 - this.age * 0.15);
        }
    }

    dispose() {
        this.alive = false;
        this.particles.forEach(p => this.scene.remove(p));
        this.debris.forEach(d => this.scene.remove(d));
        if (this.shockwave) this.scene.remove(this.shockwave);
        if (this.shockwave2) this.scene.remove(this.shockwave2);
        if (this.light) this.scene.remove(this.light);
        if (this.scorch) this.scene.remove(this.scorch);
        this.particles = [];
        this.debris = [];
    }
}

const ExplosionManager = {
    explosions: [],

    create(scene, position, isEnemy) {
        this.explosions.push(new Explosion(scene, position, isEnemy));
    },

    update(dt) {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            this.explosions[i].update(dt);
            if (!this.explosions[i].alive) {
                this.explosions.splice(i, 1);
            }
        }
    },

    clear() {
        this.explosions.forEach(e => e.dispose());
        this.explosions = [];
    }
};
