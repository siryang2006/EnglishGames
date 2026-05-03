class Pickup {
    constructor(scene, position) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.alive = true;
        this.word = WordManager.getRandomWord();

        const boxMat = new THREE.MeshPhongMaterial({ color: 0x2a5a2a });
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.45), boxMat);
        box.castShadow = true;
        this.group.add(box);

        const stripe = new THREE.Mesh(
            new THREE.BoxGeometry(0.72, 0.12, 0.47),
            new THREE.MeshPhongMaterial({ color: 0xddcc22 })
        );
        this.group.add(stripe);

        this.light = new THREE.PointLight(0xffdd44, 1, 6);
        this.light.position.y = 1;
        this.group.add(this.light);

        this.createWordLabel();

        this.group.position.copy(position);
        this.group.position.y = 0.8;
        this.baseY = 0.8;
        scene.add(this.group);
    }

    createWordLabel() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(4, 4, 248, 56);
        ctx.fillStyle = '#ffdd44';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.word.en, 128, 32);

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        this.wordSprite = new THREE.Sprite(mat);
        this.wordSprite.scale.set(2.5, 0.65, 1);
        this.wordSprite.position.y = 1.2;
        this.group.add(this.wordSprite);
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
    lastCollectedWord: null,

    init(scene) {
        this.scene = scene;
        this.pickups = [];
        for (let i = 0; i < 3; i++) {
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
                this.lastCollectedWord = p.word;
                p.dispose();
                this.pickups.splice(i, 1);
                setTimeout(() => {
                    if (this.scene) this.spawnRandom();
                }, 20000);
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
