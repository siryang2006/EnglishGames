console.log('bullet-soldier.js v2 loaded');
class SoldierBullet {
    constructor(scene, position, direction, isPlayer) {
        this.scene = scene;
        this.isPlayer = isPlayer;
        this.alive = true;
        this.speed = 100;
        this.direction = direction.normalize();
        this.age = 0;
        this.maxAge = 2.5;

        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        g.addColorStop(0, '#ffffcc');
        g.addColorStop(0.3, '#ffdd44');
        g.addColorStop(1, 'rgba(255,200,50,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 32, 32);
        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
        this.sprite = new THREE.Sprite(mat);
        this.sprite.scale.set(0.3, 0.3, 1);
        this.sprite.position.copy(position);
        scene.add(this.sprite);
        this.mesh = this.sprite;
    }

    update(dt) {
        this.age += dt;
        if (this.age >= this.maxAge) { this.dispose(); return; }
        this.mesh.position.add(this.direction.clone().multiplyScalar(this.speed * dt));
        if (this.mesh.position.y < 0) this.dispose();
    }

    getPosition() { return this.mesh.position; }

    dispose() {
        this.alive = false;
        this.scene.remove(this.mesh);
    }
}

const SoldierBulletManager = {
    bullets: [],
    fire(scene, position, direction, isPlayer) {
        this.bullets.push(new SoldierBullet(scene, position, direction, isPlayer));
    },
    update(dt) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update(dt);
            if (!this.bullets[i].alive) this.bullets.splice(i, 1);
        }
    },
    clear() {
        this.bullets.forEach(b => b.dispose());
        this.bullets = [];
    }
};
window.SoldierBulletManager = SoldierBulletManager;
