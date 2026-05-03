const GameScene = {
    scene: null,
    camera: null,
    renderer: null,
    clock: null,
    buildings: [],
    bunkers: [],
    barrels: [],
    trees: [],
    rocks: [],
    ships: [],
    obstacles: [],
    ocean: null,
    dustParticles: null,
    windTime: 0,

    init() {
        this.clock = new THREE.Clock();
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x4a8ab8);
        this.scene.fog = new THREE.FogExp2(0x6aaad0, 0.004);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
        this.camera.position.set(0, 12, 20);

        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('gameCanvas'),
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        this.createLights();
        this.createGround();
        this.createOcean();
        this.createSkyDome();
        this.createEnvironment();
        this.createDustParticles();

        window.addEventListener('resize', () => this.onResize());
    },

    createLights() {
        const ambient = new THREE.AmbientLight(0x8899bb, 0.45);
        this.scene.add(ambient);
        const sun = new THREE.DirectionalLight(0xfff4e0, 1.2);
        sun.position.set(50, 80, 30);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 200;
        sun.shadow.camera.left = -80;
        sun.shadow.camera.right = 80;
        sun.shadow.camera.top = 80;
        sun.shadow.camera.bottom = -80;
        sun.shadow.bias = -0.0005;
        sun.shadow.normalBias = 0.02;
        this.scene.add(sun);
        const hemi = new THREE.HemisphereLight(0x88bbdd, 0xc8a060, 0.5);
        this.scene.add(hemi);
        const fill = new THREE.DirectionalLight(0x8899cc, 0.3);
        fill.position.set(-30, 40, -20);
        this.scene.add(fill);
    },

    createGround() {
        const size = 200;
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 0, 1024);
        grad.addColorStop(0, '#c8a860');
        grad.addColorStop(0.3, '#b89850');
        grad.addColorStop(0.6, '#a88840');
        grad.addColorStop(1, '#987830');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1024, 1024);
        for (let i = 0; i < 8000; i++) {
            const x = Math.random() * 1024;
            const y = Math.random() * 1024;
            const l = 55 + Math.random() * 25;
            ctx.fillStyle = `hsl(40, ${30 + Math.random() * 20}%, ${l}%)`;
            ctx.fillRect(x, y, 1 + Math.random(), 1 + Math.random() * 2);
        }
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * 1024;
            const y = Math.random() * 1024;
            ctx.fillStyle = `hsla(30, 20%, 80%, ${0.1 + Math.random() * 0.15})`;
            ctx.beginPath();
            ctx.arc(x, y, 1 + Math.random() * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(6, 6);
        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(size, size, 32, 32),
            new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9, metalness: 0.0 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    },

    createOcean() {
        const oceanGeo = new THREE.PlaneGeometry(300, 150, 24, 24);
        const oceanMat = new THREE.MeshStandardMaterial({
            color: 0x1a6090, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.85
        });
        this.ocean = new THREE.Mesh(oceanGeo, oceanMat);
        this.ocean.rotation.x = -Math.PI / 2;
        this.ocean.position.set(0, -0.3, -130);
        this.scene.add(this.ocean);
        const foamGeo = new THREE.PlaneGeometry(200, 8);
        const foamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
        const foam = new THREE.Mesh(foamGeo, foamMat);
        foam.rotation.x = -Math.PI / 2;
        foam.position.set(0, 0.02, -55);
        this.scene.add(foam);
    },

    createSkyDome() {
        const skyGeo = new THREE.SphereGeometry(200, 48, 24);
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#0a1830');
        gradient.addColorStop(0.15, '#1a4080');
        gradient.addColorStop(0.35, '#3070b0');
        gradient.addColorStop(0.55, '#5098d0');
        gradient.addColorStop(0.7, '#70b8e0');
        gradient.addColorStop(0.85, '#90d0f0');
        gradient.addColorStop(1, '#b0e0f8');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1024, 512);
        for (let i = 0; i < 18; i++) {
            const cx = Math.random() * 1024;
            const cy = 180 + Math.random() * 200;
            const w = 50 + Math.random() * 100;
            const h = 12 + Math.random() * 22;
            ctx.fillStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.2})`;
            ctx.beginPath();
            ctx.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        const sunX = 700, sunY = 330;
        const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 100);
        sunGrad.addColorStop(0, 'rgba(255,252,230,0.5)');
        sunGrad.addColorStop(0.4, 'rgba(255,245,210,0.15)');
        sunGrad.addColorStop(1, 'rgba(255,240,200,0)');
        ctx.fillStyle = sunGrad;
        ctx.fillRect(sunX - 100, sunY - 100, 200, 200);
        const skyMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), side: THREE.BackSide });
        this.scene.add(new THREE.Mesh(skyGeo, skyMat));
    },

    createEnvironment() {
        this.trees = [];
        this.rocks = [];
        this.buildings = [];
        this.bunkers = [];
        this.barrels = [];
        this.ships = [];
        this.obstacles = [];
        this.createPalmTrees();
        this.createRocks();
        this.createBeachHuts();
        this.createBarrels();
        this.createShips();
    },

    createPalmTrees() {
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b6b3a, roughness: 0.9 });
        const positions = [
            {x: -40, z: 35}, {x: 35, z: 40}, {x: -20, z: 50}, {x: 50, z: 30},
            {x: -55, z: 20}, {x: 25, z: 55}
        ];
        positions.forEach(p => {
            const tree = new THREE.Group();
            const trunkH = 5 + Math.random() * 3;
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.3, trunkH, 8), trunkMat);
            trunk.position.y = trunkH / 2;
            trunk.rotation.z = (Math.random() - 0.5) * 0.15;
            trunk.castShadow = true;
            tree.add(trunk);
            const frondMat = new THREE.MeshStandardMaterial({ color: 0x2a7a2a, roughness: 0.8, side: THREE.DoubleSide });
            for (let j = 0; j < 7; j++) {
                const angle = (j / 7) * Math.PI * 2;
                const frond = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 3), frondMat);
                frond.position.set(Math.cos(angle) * 0.8, trunkH + 0.5, Math.sin(angle) * 0.8);
                frond.rotation.x = -0.8;
                frond.rotation.y = angle;
                tree.add(frond);
            }
            tree.position.set(p.x, 0, p.z);
            this.scene.add(tree);
            const treeData = { group: tree, position: new THREE.Vector3(p.x, 0, p.z), radius: 1.0, alive: true, health: 60 };
            const wordLabel = this.createWordLabel(WordManager.getRandomWord(), trunkH + 2);
            tree.add(wordLabel.sprite);
            treeData.word = wordLabel.word;
            treeData.letter = wordLabel.word.en;
            treeData._drawLabel = wordLabel.drawLabel;
            treeData.updateLetterLabel = function() { this._drawLabel(this.word.en); };
            this.trees.push(treeData);
            this.obstacles.push(treeData);
        });
    },

    createRocks() {
        const rockColors = [0x888888, 0x777766, 0x666655];
        const positions = [{x: -30, z: 15}, {x: 40, z: 20}, {x: -15, z: 45}, {x: 55, z: 50}];
        positions.forEach(p => {
            const s = 0.8 + Math.random() * 1.5;
            const rockMat = new THREE.MeshStandardMaterial({
                color: rockColors[Math.floor(Math.random() * rockColors.length)], roughness: 0.9, metalness: 0.05
            });
            const group = new THREE.Group();
            const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 1), rockMat);
            rock.position.y = s * 0.35;
            rock.rotation.set(Math.random(), Math.random(), Math.random());
            rock.castShadow = true;
            group.add(rock);
            group.position.set(p.x, 0, p.z);
            this.scene.add(group);
            const rockData = { group, position: new THREE.Vector3(p.x, 0, p.z), radius: s * 0.8, alive: true, health: 80 };
            const wordLabel = this.createWordLabel(WordManager.getRandomWord(), s * 0.7 + 2);
            group.add(wordLabel.sprite);
            rockData.word = wordLabel.word;
            rockData.letter = wordLabel.word.en;
            rockData._drawLabel = wordLabel.drawLabel;
            rockData.updateLetterLabel = function() { this._drawLabel(this.word.en); };
            this.rocks.push(rockData);
            this.obstacles.push(rockData);
        });
    },

    createBeachHuts() {
        this.buildings = [];
        const positions = [{x: 30, z: 30}, {x: -35, z: 25}, {x: -50, z: 40}];
        positions.forEach(p => {
            const group = new THREE.Group();
            const w = 4 + Math.random() * 2, d = 3 + Math.random() * 2, h = 3;
            const wallMat = new THREE.MeshStandardMaterial({ color: 0xddcc99, roughness: 0.85 });
            const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
            body.position.y = h / 2;
            body.castShadow = true;
            group.add(body);
            const roofMat = new THREE.MeshStandardMaterial({ color: 0x8a7040, roughness: 0.95 });
            const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.7, 2, 4), roofMat);
            roof.position.y = h + 1;
            roof.rotation.y = Math.PI / 4;
            roof.castShadow = true;
            group.add(roof);
            group.position.set(p.x, 0, p.z);
            this.scene.add(group);
            const bData = { group, health: 150, alive: true, position: new THREE.Vector3(p.x, 0, p.z), radius: Math.max(w, d) / 2 + 1 };
            const wordLabel = this.createWordLabel(WordManager.getRandomWord(), h + 4);
            group.add(wordLabel.sprite);
            bData.word = wordLabel.word;
            bData.letter = wordLabel.word.en;
            bData._drawLabel = wordLabel.drawLabel;
            bData.updateLetterLabel = function() { this._drawLabel(this.word.en); };
            this.buildings.push(bData);
            this.obstacles.push(bData);
        });
    },

    createBarrels() {
        this.barrels = [];
        const barrelMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.3 });
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.4 });
        const positions = [{x: 15, z: 15}, {x: -20, z: 20}, {x: 35, z: -10}];
        positions.forEach(p => {
            const group = new THREE.Group();
            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12), barrelMat);
            body.position.y = 0.6;
            body.castShadow = true;
            group.add(body);
            const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.25, 12), stripeMat);
            stripe.position.y = 0.6;
            group.add(stripe);
            group.position.set(p.x, 0, p.z);
            this.scene.add(group);
            const barrelData = { group, health: 1, alive: true, position: new THREE.Vector3(p.x, 0, p.z), radius: 0.5 };
            const wordLabel = this.createWordLabel(WordManager.getRandomWord(), 2.5);
            group.add(wordLabel.sprite);
            barrelData.word = wordLabel.word;
            barrelData.letter = wordLabel.word.en;
            barrelData._drawLabel = wordLabel.drawLabel;
            barrelData.updateLetterLabel = function() { this._drawLabel(this.word.en); };
            this.barrels.push(barrelData);
            this.obstacles.push(barrelData);
        });
    },

    createShips() {
        this.ships = [];
        const shipPositions = [{x: -25, z: -80}, {x: 20, z: -90}, {x: -10, z: -110}, {x: 40, z: -75}];
        shipPositions.forEach(p => {
            const group = new THREE.Group();
            const hullMat = new THREE.MeshStandardMaterial({ color: 0x553322, roughness: 0.7 });
            const hull = new THREE.Mesh(new THREE.BoxGeometry(2, 1.2, 5), hullMat);
            hull.position.y = 0.6;
            hull.castShadow = true;
            group.add(hull);
            const deckMat = new THREE.MeshStandardMaterial({ color: 0x997755, roughness: 0.8 });
            const deck = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 4.5), deckMat);
            deck.position.y = 1.25;
            group.add(deck);
            const cabinMat = new THREE.MeshStandardMaterial({ color: 0xddddcc, roughness: 0.7 });
            const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1, 1.5), cabinMat);
            cabin.position.set(0, 1.8, 0.5);
            cabin.castShadow = true;
            group.add(cabin);
            const mastMat = new THREE.MeshStandardMaterial({ color: 0x664422, roughness: 0.8 });
            const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4, 6), mastMat);
            mast.position.set(0, 3.2, -0.8);
            group.add(mast);
            const sailMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, side: THREE.DoubleSide });
            const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.5), sailMat);
            sail.position.set(0, 3.5, -0.8);
            sail.rotation.y = Math.PI / 2;
            group.add(sail);
            group.position.set(p.x, -0.3, p.z);
            group.rotation.y = Math.random() * 0.4 - 0.2;
            this.scene.add(group);
            const shipData = {
                group, health: 100, alive: true,
                position: new THREE.Vector3(p.x, 0, p.z),
                radius: 3.5, bobPhase: Math.random() * Math.PI * 2, baseY: -0.3
            };
            const wordLabel = this.createWordLabel(WordManager.getRandomWord(), 7);
            group.add(wordLabel.sprite);
            shipData.word = wordLabel.word;
            shipData.letter = wordLabel.word.en;
            shipData._drawLabel = wordLabel.drawLabel;
            shipData.updateLetterLabel = function() { this._drawLabel(this.word.en); };
            this.ships.push(shipData);
        });
    },

    createDustParticles() {
        const count = 80;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = [];
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 120;
            positions[i * 3 + 1] = 2 + Math.random() * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
            velocities.push({ x: (Math.random() - 0.5) * 0.8, y: (Math.random() - 0.5) * 0.15, z: (Math.random() - 0.5) * 0.8 });
        }
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.4, sizeAttenuation: true });
        this.dustParticles = new THREE.Points(geo, mat);
        this.dustParticles.userData.velocities = velocities;
        this.scene.add(this.dustParticles);
    },

    createWordLabel(word, yOffset) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');
        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(6, 1.0, 1);
        sprite.position.y = yOffset;

        const drawLabel = function(text) {
            ctx.clearRect(0, 0, 1024, 160);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
            const x = 8, y = 8, w = 1008, h = 144, rr = 24;
            ctx.beginPath();
            ctx.moveTo(x + rr, y);
            ctx.lineTo(x + w - rr, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
            ctx.lineTo(x + w, y + h - rr);
            ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
            ctx.lineTo(x + rr, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
            ctx.lineTo(x, y + rr);
            ctx.quadraticCurveTo(x, y, x + rr, y);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 200, 80, 0.95)';
            ctx.lineWidth = 6;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            const fontSize = Math.min(88, Math.floor(920 / Math.max(text.length, 1)));
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 512, 80);
            texture.needsUpdate = true;
        };

        drawLabel(word.en);
        return { sprite, word, drawLabel };
    },

    updateParticles(dt) {
        this.windTime += dt;
        if (this.dustParticles) {
            const pos = this.dustParticles.geometry.attributes.position;
            const vels = this.dustParticles.userData.velocities;
            const windX = Math.sin(this.windTime * 0.3) * 1.0;
            const windZ = Math.cos(this.windTime * 0.2) * 0.6;
            for (let i = 0; i < pos.count; i++) {
                let x = pos.getX(i) + (vels[i].x + windX) * dt;
                let y = pos.getY(i) + vels[i].y * dt;
                let z = pos.getZ(i) + (vels[i].z + windZ) * dt;
                if (y < 1) y = 10;
                if (y > 12) y = 2;
                if (Math.abs(x) > 60) x = -x * 0.5;
                if (Math.abs(z) > 60) z = -z * 0.5;
                pos.setXYZ(i, x, y, z);
            }
            pos.needsUpdate = true;
        }
        for (const ship of this.ships) {
            if (!ship.alive) continue;
            ship.group.position.y = ship.baseY + Math.sin(this.windTime * 0.8 + ship.bobPhase) * 0.3;
            ship.group.rotation.z = Math.sin(this.windTime * 0.6 + ship.bobPhase) * 0.03;
        }
        this._oceanFrame = (this._oceanFrame || 0) + 1;
        if (this.ocean && this._oceanFrame % 4 === 0) {
            const verts = this.ocean.geometry.attributes.position;
            for (let i = 0; i < verts.count; i++) {
                const x = verts.getX(i);
                const z = verts.getZ(i);
                verts.setY(i, Math.sin(x * 0.1 + this.windTime) * 0.3 + Math.cos(z * 0.08 + this.windTime * 0.7) * 0.2);
            }
            verts.needsUpdate = true;
            this.ocean.geometry.computeVertexNormals();
        }
    },

    getObstacles() {
        return this.obstacles.filter(o => o.alive);
    },

    removeDestructible(obj) {
        if (obj.group) this.scene.remove(obj.group);
        obj.alive = false;
    },

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
};
