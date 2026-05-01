class Pickup {
    constructor(scene, position) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.alive = true;

        const boxMat = new THREE.MeshPhongMaterial({ color: 0x2a5a2a });
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.45), boxMat);
        box.castShadow = true;
        this.group.add(box);

        const stripe = new THREE.Mesh(
            new THREE.BoxGeometry(0.72, 0.12, 0.47),
            new THREE.MeshPhongMaterial({ color: 0xddcc22 })
        );
        this.group.add(stripe);

        const label = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.15, 0.01),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        label.position.z = 0.23;
        this.group.add(label);

        this.light = new THREE.PointLight(0xffdd44, 1, 6);
        this.light.position.y = 1;
        this.group.add(this.light);

        this.group.position.copy(position);
        this.group.position.y = 0.8;
        this.baseY = 0.8;
        scene.add(this.group);
    }

    update(dt) {
        this.group.rotation.y += dt * 2;
        this.group.position.y = this.baseY + Math.sin(Date.now() * 0.003) * 0.25;
        this.light.intensity = 0.8 + Math.sin(Date.now() * 0.005) * 0.4;
    }

    dispose() {
        this.alive = false;
        this.scene.remove(this.group);
    }
}

const PickupManager = {
    pickups: [],
    scene: null,

    init(scene) {
        this.scene = scene;
        this.pickups = [];
        for (let i = 0; i < 5; i++) {
            this.spawnRandom();
        }
    },

    spawnRandom() {
        const angle = Math.random() * Math.PI * 2;
        const dist = 15 + Math.random() * 50;
        const pos = new THREE.Vector3(
            Math.sin(angle) * dist,
            0,
            Math.cos(angle) * dist
        );
        this.pickups.push(new Pickup(this.scene, pos));
    },

    update(dt, playerPos) {
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const p = this.pickups[i];
            if (!p.alive) continue;
            p.update(dt);

            if (playerPos && playerPos.distanceTo(p.group.position) < 2.5) {
                p.dispose();
                this.pickups.splice(i, 1);
                setTimeout(() => {
                    if (this.scene) this.spawnRandom();
                }, 10000);
                return true;
            }
        }
        return false;
    },

    clear() {
        this.pickups.forEach(p => p.dispose());
        this.pickups = [];
        this.scene = null;
    }
};
