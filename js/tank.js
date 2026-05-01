class Tank {
    constructor(scene, isPlayer = false) {
        this.scene = scene;
        this.isPlayer = isPlayer;
        this.group = new THREE.Group();
        this.turretGroup = new THREE.Group();
        this.health = 100;
        this.maxHealth = 100;
        this.alive = true;
        this.speed = isPlayer ? 12 : 4;
        this.rotSpeed = isPlayer ? 3 : 1.5;
        this.word = null;
        this.fireTimer = 0;
        this.fireCooldown = isPlayer ? 0.5 : 2.5 + Math.random() * 2;
        this.aiState = 'patrol';
        this.aiTimer = 0;
        this.aiTargetAngle = 0;
        this.wordSprite = null;
        this.healthBar = null;

        this.buildModel();
        this.createHealthBar();

        if (!isPlayer) {
            this.word = WordManager.getRandomWord();
            this.createWordLabel();
        } else {
            this.createPlayerIndicator();
        }

        scene.add(this.group);
    }

    buildModel() {
        const bodyColor = this.isPlayer ? 0x3a6b3a : 0x8b2020;
        const trackColor = 0x333333;
        const turretColor = this.isPlayer ? 0x2d5a2d : 0x6b1515;

        // tank body
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(2.4, 0.8, 3.2),
            new THREE.MeshPhongMaterial({ color: bodyColor })
        );
        body.position.y = 0.7;
        body.castShadow = true;
        this.group.add(body);

        // front slope
        const frontGeo = new THREE.BoxGeometry(2.2, 0.4, 0.8);
        const front = new THREE.Mesh(frontGeo, new THREE.MeshPhongMaterial({ color: bodyColor }));
        front.position.set(0, 1.0, -1.6);
        front.rotation.x = -0.3;
        front.castShadow = true;
        this.group.add(front);

        // tracks left
        const trackGeo = new THREE.BoxGeometry(0.5, 0.6, 3.4);
        const trackMat = new THREE.MeshPhongMaterial({ color: trackColor });
        const trackL = new THREE.Mesh(trackGeo, trackMat);
        trackL.position.set(-1.3, 0.4, 0);
        trackL.castShadow = true;
        this.group.add(trackL);

        // tracks right
        const trackR = new THREE.Mesh(trackGeo, trackMat);
        trackR.position.set(1.3, 0.4, 0);
        trackR.castShadow = true;
        this.group.add(trackR);

        // wheels
        const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.3, 8);
        const wheelMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
        for (let side = -1; side <= 1; side += 2) {
            for (let i = -1; i <= 1; i++) {
                const wheel = new THREE.Mesh(wheelGeo, wheelMat);
                wheel.rotation.z = Math.PI / 2;
                wheel.position.set(side * 1.3, 0.3, i * 1.2);
                this.group.add(wheel);
            }
        }

        // turret base
        this.turretGroup.position.set(0, 1.2, -0.2);
        const turretBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.9, 1.0, 0.6, 12),
            new THREE.MeshPhongMaterial({ color: turretColor })
        );
        turretBase.castShadow = true;
        this.turretGroup.add(turretBase);

        // turret top
        const turretTop = new THREE.Mesh(
            new THREE.SphereGeometry(0.7, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2),
            new THREE.MeshPhongMaterial({ color: turretColor })
        );
        turretTop.position.y = 0.25;
        turretTop.castShadow = true;
        this.turretGroup.add(turretTop);

        // barrel
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.15, 2.5, 8),
            new THREE.MeshPhongMaterial({ color: 0x444444 })
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.2, -1.6);
        barrel.castShadow = true;
        this.turretGroup.add(barrel);

        // muzzle brake
        const muzzle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.12, 0.3, 8),
            new THREE.MeshPhongMaterial({ color: 0x333333 })
        );
        muzzle.rotation.x = Math.PI / 2;
        muzzle.position.set(0, 0.2, -2.85);
        this.turretGroup.add(muzzle);

        this.group.add(this.turretGroup);
    }

    createHealthBar() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        this.healthCanvas = canvas;
        this.healthCtx = ctx;

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        this.healthBar = new THREE.Sprite(mat);
        this.healthBar.scale.set(3, 0.4, 1);
        this.healthBar.position.y = 3.5;
        this.group.add(this.healthBar);
        this.updateHealthBar();
    }

    updateHealthBar() {
        const ctx = this.healthCtx;
        const w = 128, h = 16;
        ctx.clearRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, w, h);

        const ratio = this.health / this.maxHealth;
        const color = this.isPlayer
            ? `rgb(${Math.floor(100 * (1 - ratio))}, ${Math.floor(200 * ratio)}, 50)`
            : `rgb(200, ${Math.floor(80 * ratio)}, ${Math.floor(80 * ratio)})`;
        ctx.fillStyle = color;
        ctx.fillRect(2, 2, (w - 4) * ratio, h - 4);

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, w, h);

        this.healthBar.material.map.needsUpdate = true;
    }

    createWordLabel() {
        const canvas = document.createElement('canvas');
        canvas.width = 768;
        canvas.height = 192;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.drawRoundRect(ctx, 10, 10, 748, 172, 20);
        ctx.fill();

        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 4;
        this.drawRoundRect(ctx, 10, 10, 748, 172, 20);
        ctx.stroke();

        ctx.shadowColor = '#ff0';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ffff44';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.word.en, 384, 96);
        ctx.shadowBlur = 0;

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        this.wordSprite = new THREE.Sprite(mat);
        this.wordSprite.scale.set(7.5, 2.0, 1);
        this.wordSprite.position.y = 5.0;
        this.group.add(this.wordSprite);
    }

    createPlayerIndicator() {
        const ringGeo = new THREE.RingGeometry(1.2, 1.5, 24);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x44aaff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.05;
        this.group.add(ring);
        this.playerRing = ring;
    }

    getBarrelTip() {
        return this.turretGroup.localToWorld(new THREE.Vector3(0, 0.2, -3.0));
    }

    getBarrelDirection() {
        const dir = new THREE.Vector3(0, 0, -1);
        dir.applyQuaternion(this.turretGroup.getWorldQuaternion(new THREE.Quaternion()));
        return dir.normalize();
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        this.updateHealthBar();
        if (this.health <= 0 && !this.isPlayer) {
            this.alive = false;
        }
    }

    updateAI(dt, playerPos, friendlySoldiers) {
        if (!this.alive) return;
        this.aiTimer -= dt;
        this.fireTimer -= dt;

        const myPos = this.group.position;

        let targetPos = playerPos;
        let minDist = myPos.distanceTo(playerPos);
        if (friendlySoldiers) {
            for (const s of friendlySoldiers) {
                if (!s.alive) continue;
                const d = myPos.distanceTo(s.group.position);
                if (d < minDist) {
                    minDist = d;
                    targetPos = s.group.position;
                }
            }
        }

        const toTarget = new THREE.Vector3().subVectors(targetPos, myPos);
        const distToTarget = toTarget.length();

        if (this.aiState === 'patrol') {
            if (this.aiTimer <= 0) {
                this.aiTargetAngle = Math.random() * Math.PI * 2;
                this.aiTimer = 2 + Math.random() * 3;
            }

            const currentAngle = this.group.rotation.y;
            let diff = this.aiTargetAngle - currentAngle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            this.group.rotation.y += Math.sign(diff) * Math.min(Math.abs(diff), this.rotSpeed * dt);

            this.group.position.x += Math.sin(this.group.rotation.y) * this.speed * dt * 0.5;
            this.group.position.z += Math.cos(this.group.rotation.y) * this.speed * dt * 0.5;

            if (distToTarget < 40) {
                this.aiState = 'chase';
            }
        } else if (this.aiState === 'chase') {
            const targetAngle = Math.atan2(toTarget.x, toTarget.z);
            let diff = targetAngle - this.group.rotation.y;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            this.group.rotation.y += Math.sign(diff) * Math.min(Math.abs(diff), this.rotSpeed * dt);

            if (distToTarget > 12) {
                this.group.position.x += Math.sin(this.group.rotation.y) * this.speed * dt;
                this.group.position.z += Math.cos(this.group.rotation.y) * this.speed * dt;
            }

            // aim turret at player
            const localTarget = toTarget.clone();
            const bodyQuat = this.group.quaternion.clone().invert();
            localTarget.applyQuaternion(bodyQuat);
            const turretAngle = Math.atan2(localTarget.x, localTarget.z);
            let tDiff = turretAngle - this.turretGroup.rotation.y;
            while (tDiff > Math.PI) tDiff -= Math.PI * 2;
            while (tDiff < -Math.PI) tDiff += Math.PI * 2;
            this.turretGroup.rotation.y += Math.sign(tDiff) * Math.min(Math.abs(tDiff), 3 * dt);

            if (distToTarget > 50) {
                this.aiState = 'patrol';
                this.aiTimer = 0;
            }
        }

        // keep in bounds
        const bound = 85;
        myPos.x = Math.max(-bound, Math.min(bound, myPos.x));
        myPos.z = Math.max(-bound, Math.min(bound, myPos.z));
    }

    canFire() {
        return this.fireTimer <= 0;
    }

    resetFireTimer() {
        this.fireTimer = this.fireCooldown;
    }

    drawRoundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    dispose() {
        this.scene.remove(this.group);
    }
}
