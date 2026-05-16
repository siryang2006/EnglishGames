const GameScene = {
    scene: null,
    camera: null,
    renderer: null,
    composer: null,
    clock: null,
    envMap: null,
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
        console.log('GameScene.init called');
        this.clock = new THREE.Clock();
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x6aaad0);
        this.scene.fog = new THREE.FogExp2(0x6aaad0, 0.004);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
        this.camera.position.set(0, 12, 20);

        const canvas = document.getElementById('gameCanvas');
        console.log('Canvas found:', !!canvas);

        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            powerPreference: 'high-performance'
        });
        console.log('Renderer created');
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.3;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        // 纹理质量在各向异性设置中处理

        this.initPostProcessing();
        this.loadHDRI();

        this.createLights();
        this.createGround();
        this.createOcean();
        this.createEnvironment();
        this.createDustParticles();

        // 移除已删除的 checkAndAddGLTFGround 调用

        window.addEventListener('resize', () => this.onResize());
        console.log('GameScene.init complete');
        console.log('Scene children:', this.scene.children.length);
    },

    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    },

    loadHDRI() {
        // HDRI disabled
        this.scene.background = new THREE.Color(0x87ceeb); // Solid blue sky
        return;
        
        // 使用 HDR 贴图创建逼真天空和环境光
        if (typeof THREE.RGBELoader === 'undefined') {
            console.warn('RGBELoader not available, using procedural sky');
            this.createDefaultSky();
            return;
        }

        const hdrLoader = new THREE.RGBELoader();
        const hdrPath = 'textures/venice_1k.hdr';

        try {
            hdrLoader.load(hdrPath, (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                this.scene.background = texture;
                this.scene.environment = texture;
                this.envMap = texture;

                // 更新灯光使用 HDR 环境光
                if (this.sunLight) {
                    this.scene.environmentIntensity = 1.0;
                }
                console.log('HDRI loaded:', hdrPath);
            }, undefined, (err) => {
                console.warn('HDRI load failed, using procedural sky:', err.message || err);
                this.createDefaultSky();
            });
        } catch(e) {
            console.warn('HDRI exception, using procedural sky:', e.message);
            this.createDefaultSky();
        }
    },

    createDefaultSky() {
        console.log('Creating procedural sky...');

        const skyGeo = new THREE.SphereGeometry(250, 64, 32);
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
        gradient.addColorStop(0, '#0a1830');
        gradient.addColorStop(0.1, '#1a3050');
        gradient.addColorStop(0.25, '#2a5080');
        gradient.addColorStop(0.4, '#4070a0');
        gradient.addColorStop(0.55, '#5098c0');
        gradient.addColorStop(0.7, '#70b8e0');
        gradient.addColorStop(0.85, '#90d0f0');
        gradient.addColorStop(1, '#b0e0f8');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 2048, 1024);

        for (let i = 0; i < 25; i++) {
            const cx = Math.random() * 2048;
            const cy = 150 + Math.random() * 350;
            const w = 80 + Math.random() * 150;
            const h = 15 + Math.random() * 30;
            const opacity = 0.12 + Math.random() * 0.18;
            ctx.fillStyle = `rgba(255,255,255,${opacity})`;
            ctx.beginPath();
            ctx.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        const sunX = 1400, sunY = 650;
        const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 200);
        sunGrad.addColorStop(0, 'rgba(255,252,230,0.9)');
        sunGrad.addColorStop(0.15, 'rgba(255,248,210,0.5)');
        sunGrad.addColorStop(0.4, 'rgba(255,240,200,0.2)');
        sunGrad.addColorStop(0.7, 'rgba(255,235,190,0.08)');
        sunGrad.addColorStop(1, 'rgba(255,230,180,0)');
        ctx.fillStyle = sunGrad;
        ctx.fillRect(sunX - 200, sunY - 200, 400, 400);

        const glowGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 500);
        glowGrad.addColorStop(0, 'rgba(255,250,220,0.15)');
        glowGrad.addColorStop(0.5, 'rgba(255,245,210,0.05)');
        glowGrad.addColorStop(1, 'rgba(255,240,200,0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, 2048, 1024);

        const skyMat = new THREE.MeshBasicMaterial({
            map: new THREE.CanvasTexture(canvas),
            side: THREE.BackSide
        });
        const skyMesh = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(skyMesh);
    },

    initPostProcessing() {
        console.log('Visual upgrades active - enhanced rendering');
    },

    createLights() {
        const ambient = new THREE.AmbientLight(0x8899bb, 0.5);
        this.scene.add(ambient);

        const sun = new THREE.DirectionalLight(0xfff8e0, 1.6);
        sun.position.set(50, 80, 30);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 250;
        sun.shadow.camera.left = -100;
        sun.shadow.camera.right = 100;
        sun.shadow.camera.top = 100;
        sun.shadow.camera.bottom = -100;
        sun.shadow.bias = -0.0005;
        sun.shadow.normalBias = 0.02;
        this.scene.add(sun);
        this.sunLight = sun;

        const hemi = new THREE.HemisphereLight(0x88bbdd, 0xc8a060, 0.7);
        this.scene.add(hemi);

        const fill = new THREE.DirectionalLight(0x8899cc, 0.4);
        fill.position.set(-30, 40, -20);
        this.scene.add(fill);

        const rim = new THREE.DirectionalLight(0xffaa66, 0.3);
        rim.position.set(-50, 20, 50);
        this.scene.add(rim);
    },

    createGround() {
        // Ground model disabled - no fallback
        return;
        
        const size = 250;

        // 尝试使用 GLTF 地面模型
        if (false && typeof ModelLoader !== 'undefined' && ModelLoader.hasModel('ground')) {
            const scale = ModelConfig.scales.ground || 2.0;
            const gModel = ModelLoader.getModel('ground');
            if (gModel) {
                const maxAnisotropy = this.renderer ? this.renderer.capabilities.getMaxAnisotropy() : 1;

                gModel.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material = child.material.clone();
                        child.material.envMapIntensity = 1.0;

                        if (child.material.map) {
                            child.material.map.minFilter = THREE.LinearMipmapLinearFilter;
                            child.material.map.magFilter = THREE.LinearFilter;
                            child.material.map.anisotropy = maxAnisotropy;
                            child.material.map.needsUpdate = true;
                        }
                        if (child.material.normalMap) {
                            child.material.normalMap.anisotropy = maxAnisotropy;
                        }
                        if (child.material.roughnessMap) {
                            child.material.roughnessMap.anisotropy = maxAnisotropy;
                        }
                        if (child.material.metalnessMap) {
                            child.material.metalnessMap.anisotropy = maxAnisotropy;
                        }

                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                gModel.scale.setScalar(scale);
                // 调整位置使模型贴地
                const box = new THREE.Box3().setFromObject(gModel);
                const minY = box.min.y * scale;
                gModel.position.y = -minY;
                this.scene.add(gModel);
                console.log('GLTF ground added, scale:', scale, 'y offset:', -minY);
                return;
            }
        }

        // 降级到程序化地面
        console.log('Using procedural ground');
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 2048;
        const ctx = canvas.getContext('2d');

        const grad = ctx.createLinearGradient(0, 0, 0, 2048);
        grad.addColorStop(0, '#c8a860');
        grad.addColorStop(0.25, '#b89850');
        grad.addColorStop(0.5, '#a88840');
        grad.addColorStop(0.75, '#987830');
        grad.addColorStop(1, '#886820');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 2048, 2048);

        for (let i = 0; i < 15000; i++) {
            const x = Math.random() * 2048;
            const y = Math.random() * 2048;
            const l = 45 + Math.random() * 35;
            ctx.fillStyle = `hsl(40, ${25 + Math.random() * 25}%, ${l}%)`;
            ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 3);
        }

        for (let i = 0; i < 200; i++) {
            const x = Math.random() * 2048;
            const y = Math.random() * 2048;
            ctx.fillStyle = `hsla(30, 15%, 75%, ${0.08 + Math.random() * 0.12})`;
            ctx.beginPath();
            ctx.arc(x, y, 2 + Math.random() * 5, 0, Math.PI * 2);
            ctx.fill();
        }

        for (let i = 0; i < 80; i++) {
            const x = Math.random() * 2048;
            const y = Math.random() * 2048;
            const len = 10 + Math.random() * 30;
            const angle = Math.random() * Math.PI * 2;
            ctx.strokeStyle = `hsla(35, 20%, 60%, ${0.05 + Math.random() * 0.08})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(8, 8);
        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(size, size, 64, 64),
            new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.85,
                metalness: 0.05,
                normalScale: new THREE.Vector2(0.3, 0.3)
            })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    },

    createOcean() {
        // Ocean disabled - no fallback
        return;
        
        // 检查 Three.js Water shader 是否可用
        if (typeof THREE.Water === 'undefined') {
            console.warn('THREE.Water not available, using procedural ocean');
            this.createProceduralOcean();
            return;
        }

        try {
            const waterNormals = new THREE.TextureLoader().load('textures/waternormals.jpg', (texture) => {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
            });

            const waterGeo = new THREE.PlaneGeometry(1000, 500, 256, 256);
            const water = new THREE.Water(waterGeo, {
                textureWidth: 2048,
                textureHeight: 2048,
                waterNormals: waterNormals,
                sunDirection: new THREE.Vector3(0.5, 0.5, -0.5).normalize(),
                sunColor: 0xffffff,
                waterColor: 0x0077be,
                distortionScale: 3.0,
                fog: false,
                alpha: 0.95
            });
            water.rotation.x = -Math.PI / 2;
            water.position.set(0, -0.3, -400);
            water.material.uniforms['size'].value = 8.0;
            this.scene.add(water);
            this.ocean = water;

            // 海岸泡沫效果
            const foamGeo = new THREE.PlaneGeometry(300, 12);
            const foamMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.35,
                side: THREE.DoubleSide
            });
            const foam = new THREE.Mesh(foamGeo, foamMat);
            foam.rotation.x = -Math.PI / 2;
            foam.position.set(0, 0.05, -60);
            this.scene.add(foam);
            this.foam = foam;

            console.log('Realistic ocean created with Water shader');
        } catch(e) {
            console.warn('Water shader failed, falling back to procedural:', e.message);
            this.createProceduralOcean();
        }
    },

    createProceduralOcean() {
        const oceanGeo = new THREE.PlaneGeometry(400, 200, 32, 32);
        const oceanMat = new THREE.MeshStandardMaterial({
            color: 0x1a6090,
            roughness: 0.15,
            metalness: 0.3,
            transparent: true,
            opacity: 0.9,
            envMapIntensity: 1.0
        });
        this.ocean = new THREE.Mesh(oceanGeo, oceanMat);
        this.ocean.rotation.x = -Math.PI / 2;
        this.ocean.position.set(0, -0.3, -160);
        this.scene.add(this.ocean);

        const foamGeo = new THREE.PlaneGeometry(300, 12);
        const foamMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide
        });
        const foam = new THREE.Mesh(foamGeo, foamMat);
        foam.rotation.x = -Math.PI / 2;
        foam.position.set(0, 0.05, -60);
        this.scene.add(foam);
        this.foam = foam;
        console.log('Procedural ocean created (fallback)');
    },

    createSkyDome() {
        // Disabled - no fallback
        return;
        
        const skyGeo = new THREE.SphereGeometry(250, 64, 32);
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
        gradient.addColorStop(0, '#0a1830');
        gradient.addColorStop(0.1, '#1a3050');
        gradient.addColorStop(0.25, '#2a5080');
        gradient.addColorStop(0.4, '#4070a0');
        gradient.addColorStop(0.55, '#5098c0');
        gradient.addColorStop(0.7, '#70b8e0');
        gradient.addColorStop(0.85, '#90d0f0');
        gradient.addColorStop(1, '#b0e0f8');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 2048, 1024);

        for (let i = 0; i < 25; i++) {
            const cx = Math.random() * 2048;
            const cy = 150 + Math.random() * 350;
            const w = 80 + Math.random() * 150;
            const h = 15 + Math.random() * 30;
            const opacity = 0.12 + Math.random() * 0.18;
            ctx.fillStyle = `rgba(255,255,255,${opacity})`;
            ctx.beginPath();
            ctx.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        const sunX = 1400, sunY = 650;
        const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 200);
        sunGrad.addColorStop(0, 'rgba(255,252,230,0.9)');
        sunGrad.addColorStop(0.15, 'rgba(255,248,210,0.5)');
        sunGrad.addColorStop(0.4, 'rgba(255,240,200,0.2)');
        sunGrad.addColorStop(0.7, 'rgba(255,235,190,0.08)');
        sunGrad.addColorStop(1, 'rgba(255,230,180,0)');
        ctx.fillStyle = sunGrad;
        ctx.fillRect(sunX - 200, sunY - 200, 400, 400);

        const glowGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 500);
        glowGrad.addColorStop(0, 'rgba(255,250,220,0.15)');
        glowGrad.addColorStop(0.5, 'rgba(255,245,210,0.05)');
        glowGrad.addColorStop(1, 'rgba(255,240,200,0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, 2048, 1024);

        const skyMat = new THREE.MeshBasicMaterial({ 
            map: new THREE.CanvasTexture(canvas), 
            side: THREE.BackSide 
        });
        const skyMesh = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(skyMesh);
        this.skyMesh = skyMesh;
    },

    createEnvironment() {
        this.trees = [];
        this.rocks = [];
        this.buildings = [];
        this.bunkers = [];
        this.barrels = [];
        this.ships = [];
        this.obstacles = [];

        // Environment objects disabled
        // try { this.createPalmTrees(); } catch(e) { console.warn('createPalmTrees failed:', e.message); }
        // try { this.createRocks(); } catch(e) { console.warn('createRocks failed:', e.message); }
        // try { this.createBeachHuts(); } catch(e) { console.warn('createBeachHuts failed:', e.message); }
        // try { this.createBarrels(); } catch(e) { console.warn('createBarrels failed:', e.message); }
        // try { this.createShips(); } catch(e) { console.warn('createShips failed:', e.message); }
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
        const positions = [{x: -30, z: 15}, {x: 40, z: 20}, {x: -15, z: 45}, {x: 55, z: 50}];
        
        if (typeof ModelLoader !== 'undefined' && ModelLoader.hasModel('rock')) {
            const baseScale = ModelConfig.scales.rock || 0.5;
            const collisionR = ModelConfig.collisionRadius.rock || 1.5;
            
            positions.forEach(p => {
                const rockModel = ModelLoader.getModel('rock');
                if (!rockModel) return;
                
                const scale = baseScale + Math.random() * 0.5;
                rockModel.scale.setScalar(scale);
                rockModel.position.set(p.x, 0, p.z);
                rockModel.rotation.y = Math.random() * Math.PI * 2;
                this.scene.add(rockModel);
                
                const rockData = { 
                    group: rockModel, 
                    position: new THREE.Vector3(p.x, 0, p.z), 
                    radius: collisionR * scale, 
                    alive: true, 
                    health: 80 
                };
                const wordLabel = this.createWordLabel(WordManager.getRandomWord(), 2 + scale);
                rockModel.add(wordLabel.sprite);
                rockData.word = wordLabel.word;
                rockData.letter = wordLabel.word.en;
                rockData._drawLabel = wordLabel.drawLabel;
                rockData.updateLetterLabel = function() { this._drawLabel(this.word.en); };
                this.rocks.push(rockData);
                this.obstacles.push(rockData);
            });
            console.log('Rocks created from GLTF model');
            return;
        }

        const rockColors = [0x888888, 0x777766, 0x666655];
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

        if (typeof ModelLoader !== 'undefined' && ModelLoader.building) {
            positions.forEach(p => {
                const modelClone = ModelLoader.getBuilding();
                if (modelClone) {
                    const maxAnisotropy = this.renderer ? this.renderer.capabilities.getMaxAnisotropy() : 1;

                    modelClone.traverse((child) => {
                        if (child.isMesh && child.material) {
                            child.material = child.material.clone();
                            child.material.envMapIntensity = 1.0;

                            // 强制提高纹理质量
                            if (child.material.map) {
                                child.material.map.minFilter = THREE.LinearMipmapLinearFilter;
                                child.material.map.magFilter = THREE.NearestFilter; // 强制最清晰
                                child.material.map.anisotropy = maxAnisotropy; // 最大各向异性
                                child.material.map.needsUpdate = true;
                                child.material.map.generateMipmaps = true;
                            }
                            if (child.material.normalMap) {
                                child.material.normalMap.anisotropy = maxAnisotropy;
                            }
                            if (child.material.roughnessMap) {
                                child.material.roughnessMap.anisotropy = maxAnisotropy;
                            }
                            if (child.material.metalnessMap) {
                                child.material.metalnessMap.anisotropy = maxAnisotropy;
                            }

                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });

                    // 调整缩放比例，避免过大或过小
                    modelClone.scale.setScalar(1.0);
                    modelClone.position.set(p.x, 0, p.z);

                    // 添加额外光照改善显示
                    const spotLight = new THREE.SpotLight(0xffffff, 0.5);
                    spotLight.position.set(p.x, 10, p.z);
                    spotLight.target = modelClone;
                    spotLight.castShadow = false;
                    this.scene.add(spotLight);

                    this.scene.add(modelClone);
                    const bData = {
                        group: modelClone,
                        health: 150,
                        alive: true,
                        position: new THREE.Vector3(p.x, 0, p.z),
                        radius: 3
                    };
                    const wordLabel = this.createWordLabel(WordManager.getRandomWord(), 8);
                    modelClone.add(wordLabel.sprite);
                    bData.word = wordLabel.word;
                    bData.letter = wordLabel.word.en;
                    bData._drawLabel = wordLabel.drawLabel;
                    bData.updateLetterLabel = function() { this._drawLabel(this.word.en); };
                    this.buildings.push(bData);
                    this.obstacles.push(bData);
                } else {
                    this.createBuildingProgrammatic(p);
                }
            });
            console.log('Using GLTF building model, count:', this.buildings.length);
            return;
        }

        positions.forEach(p => this.createBuildingProgrammatic(p));
    },

    createBuildingProgrammatic(p) {
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
            ship.group.position.y = ship.baseY + Math.sin(this.windTime * 0.8 + ship.bobPhase) * 0.4;
            ship.group.rotation.z = Math.sin(this.windTime * 0.6 + ship.bobPhase) * 0.04;
        }
        this._oceanFrame = (this._oceanFrame || 0) + 1;
        if (this.ocean && this._oceanFrame % 3 === 0) {
            const verts = this.ocean.geometry.attributes.position;
            for (let i = 0; i < verts.count; i++) {
                const x = verts.getX(i);
                const z = verts.getZ(i);
                verts.setY(i, Math.sin(x * 0.08 + this.windTime * 1.2) * 0.35 + 
                            Math.cos(z * 0.06 + this.windTime * 0.9) * 0.25 +
                            Math.sin((x + z) * 0.04 + this.windTime * 1.5) * 0.15);
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

// 暴露到全局供测试使用
window.GameScene = GameScene;
