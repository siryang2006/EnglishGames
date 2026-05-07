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
        this.letter = '';
        this.fireTimer = 0;
        this.fireCooldown = isPlayer ? 0.5 : 2.5 + Math.random() * 2;
        this.aiState = 'patrol';
        this.aiTimer = 0;
        this.aiTargetAngle = 0;
        this.wordSprite = null;
        this.healthBar = null;
        this.gltfModel = null;
        this.treadMeshes = [];
        this.wheelMeshes = [];
        this.treadOffset = 0;
        this.lastPosition = new THREE.Vector3();

        this.loadGLTFModel(isPlayer);
        
        this.createHealthBar();

        if (!isPlayer) {
            this.word = WordManager.getRandomWord();
            this.letter = this.word.en;
            this.createLetterLabel();
        } else {
            this.createPlayerIndicator();
            this.createSpellLabel(null, 0);
        }

        scene.add(this.group);
    }

    loadGLTFModel(isPlayer) {
        if (typeof TankGLTFLoader === 'undefined' || !TankGLTFLoader.playerModel) {
            if (typeof TankGLTFLoader !== 'undefined' && TankGLTFLoader.loading) {
                console.log('Tank: model is loading, waiting...');
                const startTime = Date.now();
                const checkModel = setInterval(() => {
                    if (TankGLTFLoader.playerModel || Date.now() - startTime > 10000) {
                        clearInterval(checkModel);
                        if (TankGLTFLoader.playerModel) {
                            this.loadGLTFModel(isPlayer);
                        } else {
                            console.log('Tank: model load timeout, using procedural');
                            this.buildDetailedModel();
                            this.collectProceduralTreads();
                        }
                    }
                }, 100);
                return;
            }
            console.log('Tank: using procedural model (GLTF not available)');
            this.buildDetailedModel();
            this.collectProceduralTreads();
            return;
        }

        const model = TankGLTFLoader.playerModel.clone();
        
        const color = isPlayer ? 0x4a5d3a : 0x8b3a2a;
        
        model.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material = child.material.clone();
                if (child.material.color) {
                    child.material.color.setHex(color);
                }
                const name = child.name.toLowerCase();
                if (name.includes('tread') || name.includes('track') || name.includes('chain')) {
                    this.treadMeshes.push(child);
                }
                if (name.includes('wheel') || name.includes('road') || name.includes('sprocket') || name.includes('idler')) {
                    this.wheelMeshes.push(child);
                }
            }
        });
        
        model.rotation.x = 0;
        model.rotation.y = 0;
        
        this.group.add(model);
        this.turretGroup = new THREE.Group();
        this.group.add(this.turretGroup);
        this.gltfModel = model;
        this.modelRotationOffset = 0;
        
        if (isPlayer) {
            console.log('Tank oriented correctly! Using group for turret');
        }
    }

    collectProceduralTreads() {
        this.treadMeshes = [];
        this.wheelMeshes = [];
        this.group.traverse((child) => {
            if (!child.isMesh) return;
            const name = child.name.toLowerCase();
            // Identify track/tread by material color or size
            if (child.material && child.material.color) {
                const c = child.material.color;
                if (c.r < 0.15 && c.g < 0.15 && c.b < 0.15) { // dark/black = track
                    this.treadMeshes.push(child);
                }
                if (child.geometry && child.geometry.parameters) {
                    const p = child.geometry.parameters;
                    if (p.radius && p.radius > 0.2 && p.radius < 0.4) {
                        this.wheelMeshes.push(child);
                    }
                }
            }
        });
        console.log('Tread meshes:', this.treadMeshes.length, 'Wheel meshes:', this.wheelMeshes.length);
    }

    updateTreadAnimation(dt) {
        if (!this.alive) return;
        // Calculate movement distance
        const currentPos = this.group.position.clone();
        const distance = currentPos.distanceTo(this.lastPosition);
        this.lastPosition.copy(currentPos);

        if (distance > 0.001) {
            this.treadOffset += distance * 0.3;
            const speed = this.isPlayer ? 12 : 4;
            const factor = distance > 0 ? (distance / (speed * dt)) : 0;
            if (this.treadOffset > 1) this.treadOffset -= 1;

            // Animate tread textures
            this.treadMeshes.forEach(mesh => {
                if (mesh.material && mesh.material.map) {
                    mesh.material.map.wrapS = THREE.RepeatWrapping;
                    mesh.material.map.offset.x = this.treadOffset;
                }
            });

            // Rotate wheels
            this.wheelMeshes.forEach(wheel => {
                wheel.rotation.x += distance * 2;
            });
        }
    }

    buildDetailedModel() {
        const playerGreen = 0x4a5d3a;
        const enemyRed = 0x8b3a2a;
        const trackBlack = 0x1a1a1a;
        const metal = 0x3a3a3a;
        
        const bodyColor = this.isPlayer ? playerGreen : enemyRed;
        const turretColor = this.isPlayer ? 0x3d4d2a : 0x6b2a1a;
        const accentColor = this.isPlayer ? 0x2d3d1a : 0x4d1a1a;

        const armors = [
            { pos: [-1.3, 0.5, 0], size: [0.18, 0.7, 3.5] },
            { pos: [1.3, 0.5, 0], size: [0.18, 0.7, 3.5] },
            { pos: [0, 0.5, -1.7], size: [2.5, 0.65, 0.18] },
            { pos: [0, 0.5, 1.65], size: [2.5, 0.65, 0.18] },
            { pos: [-0.9, 0.95, 0], size: [0.12, 0.25, 2.8] },
            { pos: [0.9, 0.95, 0], size: [0.12, 0.25, 2.8] },
        ];
        
        const armorMat = new THREE.MeshStandardMaterial({ 
            color: bodyColor, roughness: 0.6, metalness: 0.45 
        });
        armors.forEach(a => {
            const armor = new THREE.Mesh(
                new THREE.BoxGeometry(a.size[0], a.size[1], a.size[2]),
                armorMat
            );
            armor.position.set(a.pos[0], a.pos[1], a.pos[2]);
            armor.castShadow = true;
            armor.receiveShadow = true;
            this.group.add(armor);
        });

        const chassis = new THREE.Mesh(
            new THREE.BoxGeometry(2.4, 0.45, 3.4),
            new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.55, metalness: 0.5 })
        );
        chassis.position.set(0, 0.45, 0);
        chassis.castShadow = true;
        chassis.receiveShadow = true;
        this.group.add(chassis);

        const engineDeck = new THREE.Mesh(
            new THREE.BoxGeometry(2.2, 0.25, 1.2),
            new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.65, metalness: 0.35 })
        );
        engineDeck.position.set(0, 0.85, 1.1);
        engineDeck.castShadow = true;
        this.group.add(engineDeck);

        const grillMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8, metalness: 0.2 });
        for (let i = 0; i < 5; i++) {
            const grill = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.02, 0.08), grillMat);
            grill.position.set(0, 0.72, 1.65 + i * 0.12);
            this.group.add(grill);
        }

        const trackMat = new THREE.MeshStandardMaterial({ color: trackBlack, roughness: 0.85, metalness: 0.3 });
        
        for (let side = -1; side <= 1; side += 2) {
            const track = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 3.8), trackMat);
            track.position.set(side * 1.45, 0.32, 0);
            track.castShadow = true;
            this.group.add(track);
            
            for (let i = 0; i < 8; i++) {
                const link = new THREE.Mesh(
                    new THREE.BoxGeometry(0.32, 0.35, 0.42),
                    trackMat
                );
                link.position.set(side * 1.45, 0.32, -1.5 + i * 0.43);
                link.castShadow = true;
                this.group.add(link);
            }
            
            const roadWheel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.28, 20), trackMat);
            roadWheel1.rotation.z = Math.PI / 2;
            roadWheel1.position.set(side * 1.45, 0.32, -1.5);
            roadWheel1.castShadow = true;
            this.group.add(roadWheel1);
            
            const roadWheel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.28, 20), trackMat);
            roadWheel2.rotation.z = Math.PI / 2;
            roadWheel2.position.set(side * 1.45, 0.32, 1.5);
            roadWheel2.castShadow = true;
            this.group.add(roadWheel2);
            
            const idlerWheel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.32, 0.32, 0.3, 16),
                new THREE.MeshStandardMaterial({ color: metal, roughness: 0.4, metalness: 0.7 })
            );
            idlerWheel.rotation.z = Math.PI / 2;
            idlerWheel.position.set(side * 1.45, 0.32, 1.9);
            idlerWheel.castShadow = true;
            this.group.add(idlerWheel);
            
            const driveSprocket = new THREE.Mesh(
                new THREE.CylinderGeometry(0.28, 0.28, 0.32, 12),
                new THREE.MeshStandardMaterial({ color: metal, roughness: 0.4, metalness: 0.7 })
            );
            driveSprocket.rotation.z = Math.PI / 2;
            driveSprocket.position.set(side * 1.45, 0.32, -1.9);
            driveSprocket.castShadow = true;
            this.group.add(driveSprocket);
        }

        const trackSkirt = new THREE.Mesh(
            new THREE.BoxGeometry(2.7, 0.08, 3.6),
            new THREE.MeshStandardMaterial({ color: trackBlack, roughness: 0.9, metalness: 0.2 })
        );
        trackSkirt.position.set(0, 0.1, 0);
        trackSkirt.receiveShadow = true;
        this.group.add(trackSkirt);

        this.turretGroup.position.set(0, 0.98, -0.15);

        const turretBase = new THREE.Mesh(
            new THREE.BoxGeometry(1.7, 0.45, 1.9),
            new THREE.MeshStandardMaterial({ color: turretColor, roughness: 0.55, metalness: 0.4 })
        );
        turretBase.position.y = 0.1;
        turretBase.castShadow = true;
        this.turretGroup.add(turretBase);

        const turretMiddle = new THREE.Mesh(
            new THREE.BoxGeometry(1.4, 0.35, 1.5),
            new THREE.MeshStandardMaterial({ color: turretColor, roughness: 0.5, metalness: 0.45 })
        );
        turretMiddle.position.y = 0.5;
        turretMiddle.castShadow = true;
        this.turretGroup.add(turretMiddle);

        const turretTop = new THREE.Mesh(
            new THREE.BoxGeometry(1.1, 0.25, 1.2),
            new THREE.MeshStandardMaterial({ color: turretColor, roughness: 0.5, metalness: 0.45 })
        );
        turretTop.position.y = 0.85;
        turretTop.castShadow = true;
        this.turretGroup.add(turretTop);

        const loaderGroup = new THREE.Group();
        
        const loader1 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.28, 0.6, 12),
            new THREE.MeshStandardMaterial({ color: metal, roughness: 0.35, metalness: 0.65 })
        );
        loader1.rotation.x = Math.PI / 2;
        loader1.position.set(-0.5, 0.35, 0);
        loaderGroup.add(loader1);
        
        const loader2 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.28, 0.6, 12),
            new THREE.MeshStandardMaterial({ color: metal, roughness: 0.35, metalness: 0.65 })
        );
        loader2.rotation.x = Math.PI / 2;
        loader2.position.set(0.5, 0.35, 0);
        loaderGroup.add(loader2);
        
        loaderGroup.position.set(0, 0.52, 0.45);
        this.turretGroup.add(loaderGroup);

        const cupola = new THREE.Mesh(
            new THREE.CylinderGeometry(0.32, 0.35, 0.32, 10),
            new THREE.MeshStandardMaterial({ color: turretColor, roughness: 0.5, metalness: 0.45 })
        );
        cupola.position.set(0.55, 0.72, -0.35);
        cupola.castShadow = true;
        this.turretGroup.add(cupola);

        const hatch = new THREE.Mesh(
            new THREE.CylinderGeometry(0.22, 0.22, 0.08, 10),
            new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.45, metalness: 0.5 })
        );
        hatch.position.set(0.55, 0.9, -0.35);
        this.turretGroup.add(hatch);

        const barrelMat = new THREE.MeshStandardMaterial({ color: 0x2d2d2d, roughness: 0.35, metalness: 0.7 });
        
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.095, 0.11, 3.2, 16),
            barrelMat
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.28, 1.8);
        barrel.castShadow = true;
        this.turretGroup.add(barrel);

        const muzzle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.14, 0.095, 0.4, 14),
            barrelMat
        );
        muzzle.rotation.x = Math.PI / 2;
        muzzle.position.set(0, 0.28, 3.45);
        muzzle.castShadow = true;
        this.turretGroup.add(muzzle);

        for (let i = 0; i < 4; i++) {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.13, 0.018, 8, 16),
                barrelMat
            );
            ring.rotation.x = Math.PI / 2;
            ring.position.set(0, 0.28, 3.2 + i * 0.1);
            this.turretGroup.add(ring);
        }

        const coaxMachineGun = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.025, 0.8, 8),
            barrelMat
        );
        coaxMachineGun.rotation.x = Math.PI / 2;
        coaxMachineGun.position.set(0, 0.08, 0.95);
        this.turretGroup.add(coaxMachineGun);

        for (let i = 0; i < 3; i++) {
            const antenna = new THREE.Mesh(
                new THREE.CylinderGeometry(0.012, 0.012, 0.4 + i * 0.15, 6),
                new THREE.MeshStandardMaterial({ color: metal, roughness: 0.3, metalness: 0.8 })
            );
            antenna.position.set(0.7 + i * 0.08, 1.15 + i * 0.12, -0.65 + i * 0.1);
            antenna.rotation.z = 0.1 * (i + 1);
            this.turretGroup.add(antenna);
        }

        const lensMat = new THREE.MeshStandardMaterial({ 
            color: 0x88ffff, 
            emissive: 0x88ffff, 
            emissiveIntensity: 0.3,
            roughness: 0.1, 
            metalness: 0.9 
        });
        
        const headlamp = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), lensMat);
        headlamp.position.set(-0.7, 0.72, 0.92);
        this.group.add(headlamp);
        
        const taillamp = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), lensMat);
        taillamp.position.set(-0.7, 0.72, -1.65);
        taillamp.material = lensMat.clone();
        taillamp.material.color.setHex(0xff3333);
        taillamp.material.emissive.setHex(0xff3333);
        this.group.add(taillamp);

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

    createLetterLabel() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 256;
        this.letterCanvas = canvas;
        this.letterCtx = canvas.getContext('2d');

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        this.wordSprite = new THREE.Sprite(mat);
        this.wordSprite.scale.set(7, 1.75, 1);
        this.wordSprite.position.y = 5.5;
        this.group.add(this.wordSprite);
        this.drawLetterLabel();
    }

    drawLetterLabel() {
        const ctx = this.letterCtx;
        const w = 1024, h = 256;
        ctx.clearRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
        ctx.beginPath();
        ctx.moveTo(32, 0);
        ctx.lineTo(w - 32, 0);
        ctx.quadraticCurveTo(w, 0, w, 32);
        ctx.lineTo(w, h - 32);
        ctx.quadraticCurveTo(w, h, w - 32, h);
        ctx.lineTo(32, h);
        ctx.quadraticCurveTo(0, h, 0, h - 32);
        ctx.lineTo(0, 32);
        ctx.quadraticCurveTo(0, 0, 32, 0);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 6;
        ctx.stroke();

        const displayWord = this.word ? this.word.en : (this.letter || '');
        ctx.fillStyle = '#ffffff';
        const fontSize = Math.min(120, Math.floor(880 / Math.max(displayWord.length, 1)));
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayWord, w / 2, h / 2);

        if (this.wordSprite) {
            this.wordSprite.material.map.needsUpdate = true;
        }
    }

    updateLetterLabel() {
        if (this.letterCanvas) {
            this.drawLetterLabel();
        }
    }

    createSpellLabel(word, index) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 256;
        this.spellCanvas = canvas;
        this.spellCtx = canvas.getContext('2d');

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        this.spellSprite = new THREE.Sprite(mat);
        this.spellSprite.scale.set(7, 1.8, 1);
        this.spellSprite.position.y = 5.0;
        this.group.add(this.spellSprite);

        if (word) this.drawSpellLabel(word, index);
    }

    updateSpellLabel(word, index) {
        if (this.spellCanvas) {
            this.drawSpellLabel(word, index);
        }
    }

    drawSpellLabel(word, index) {
        const ctx = this.spellCtx;
        const w = 1024, h = 256;
        ctx.clearRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.drawRoundRect(ctx, 8, 8, w - 16, h - 16, 20);
        ctx.fill();

        const grd = ctx.createLinearGradient(8, 8, 8, h - 8);
        grd.addColorStop(0, 'rgba(68, 170, 255, 0.3)');
        grd.addColorStop(1, 'rgba(68, 170, 255, 0.05)');
        ctx.fillStyle = grd;
        this.drawRoundRect(ctx, 8, 8, w - 16, h - 16, 20);
        ctx.fill();

        ctx.strokeStyle = '#44aaff';
        ctx.lineWidth = 4;
        this.drawRoundRect(ctx, 8, 8, w - 16, h - 16, 20);
        ctx.stroke();

        if (!word) return;

        const pulse = Math.sin(Date.now() * 0.005) * 0.15 + 0.85;

        ctx.fillStyle = `rgba(255, 255, 100, ${pulse})`;
        ctx.font = 'bold 100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(word.cn, w / 2, 100);

        ctx.fillStyle = 'rgba(180, 220, 255, 0.8)';
        ctx.font = '40px Arial';
        ctx.fillText(word.ph || '', w / 2, 200);

        if (this.spellSprite) {
            this.spellSprite.material.map.needsUpdate = true;
        }
    }

    createPlayerIndicator() {
        const ringGeo = new THREE.RingGeometry(1.2, 1.5, 24);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x44aaff, transparent: true, opacity: 0.5, side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.05;
        this.group.add(ring);
        this.playerRing = ring;
    }

    getBarrelTip() {
        if (this.gltfModel) {
            const forward = new THREE.Vector3(1, 0, 0);
            forward.applyQuaternion(this.group.quaternion);
            const pos = this.group.position.clone();
            pos.y += 1;
            pos.addScaledVector(forward, 4);
            return pos;
        }
        return this.turretGroup.localToWorld(new THREE.Vector3(0, 0.2, -3.0));
    }

    getBarrelDirection() {
        if (this.gltfModel) {
            const forward = new THREE.Vector3(1, 0, 0);
            forward.applyQuaternion(this.group.quaternion);
            forward.normalize();
            return forward;
        }
        return new THREE.Vector3(0, 0, -1);
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        this.updateHealthBar();
        if (this.health <= 0 && !this.isPlayer) this.alive = false;
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
                if (d < minDist) { minDist = d; targetPos = s.group.position; }
            }
        }

        const toTarget = new THREE.Vector3().subVectors(targetPos, myPos);
        const distToTarget = toTarget.length();

        if (this.aiState === 'patrol') {
            if (this.aiTimer <= 0) {
                this.aiTargetAngle = Math.random() * Math.PI * 2;
                this.aiTimer = 2 + Math.random() * 3;
            }
            let diff = this.aiTargetAngle - this.group.rotation.y;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            this.group.rotation.y += Math.sign(diff) * Math.min(Math.abs(diff), this.rotSpeed * dt);
            this.group.position.x += Math.sin(this.group.rotation.y) * this.speed * dt * 0.5;
            this.group.position.z += Math.cos(this.group.rotation.y) * this.speed * dt * 0.5;
            if (distToTarget < 40) this.aiState = 'chase';
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
            const localTarget = toTarget.clone();
            localTarget.applyQuaternion(this.group.quaternion.clone().invert());
            const turretAngle = Math.atan2(localTarget.x, localTarget.z);
            let tDiff = turretAngle - this.turretGroup.rotation.y;
            while (tDiff > Math.PI) tDiff -= Math.PI * 2;
            while (tDiff < -Math.PI) tDiff += Math.PI * 2;
            this.turretGroup.rotation.y += Math.sign(tDiff) * Math.min(Math.abs(tDiff), 3 * dt);
            if (distToTarget > 50) { this.aiState = 'patrol'; this.aiTimer = 0; }
        }

        const bound = 85;
        myPos.x = Math.max(-bound, Math.min(bound, myPos.x));
        myPos.z = Math.max(-bound, Math.min(bound, myPos.z));

        this.updateTreadAnimation(dt);
    }

    canFire() { return this.fireTimer <= 0; }
    resetFireTimer() { this.fireTimer = this.fireCooldown; }

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

    dispose() { this.scene.remove(this.group); }
}
