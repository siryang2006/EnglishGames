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
    obstacles: [],

    init() {
        this.clock = new THREE.Clock();
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x6ab4e8);
        this.scene.fog = new THREE.FogExp2(0x8ac4f0, 0.006);

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
        this.renderer.toneMappingExposure = 1.1;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        this.createLights();
        this.createGround();
        this.createSkyDome();
        this.createEnvironment();

        window.addEventListener('resize', () => this.onResize());
    },

    createLights() {
        const ambient = new THREE.AmbientLight(0x8899bb, 0.6);
        this.scene.add(ambient);

        const sun = new THREE.DirectionalLight(0xfff0dd, 1.2);
        sun.position.set(50, 80, 30);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 4096;
        sun.shadow.mapSize.height = 4096;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 200;
        sun.shadow.camera.left = -80;
        sun.shadow.camera.right = 80;
        sun.shadow.camera.top = 80;
        sun.shadow.camera.bottom = -80;
        sun.shadow.bias = -0.001;
        this.scene.add(sun);

        const hemi = new THREE.HemisphereLight(0x99bbdd, 0x556633, 0.5);
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

        const grad = ctx.createRadialGradient(512, 512, 0, 512, 512, 600);
        grad.addColorStop(0, '#5a8a4a');
        grad.addColorStop(0.5, '#4a7a3a');
        grad.addColorStop(1, '#3a6a2a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1024, 1024);

        for (let i = 0; i < 8000; i++) {
            const x = Math.random() * 1024;
            const y = Math.random() * 1024;
            const h = 90 + Math.random() * 40;
            const s = 30 + Math.random() * 40;
            const l = 20 + Math.random() * 25;
            ctx.fillStyle = `hsl(${h}, ${s}%, ${l}%)`;
            ctx.fillRect(x, y, 1 + Math.random(), 2 + Math.random() * 4);
        }

        for (let i = 0; i < 200; i++) {
            const x = Math.random() * 1024;
            const y = Math.random() * 1024;
            ctx.fillStyle = `hsla(40, 30%, 50%, ${0.1 + Math.random() * 0.15})`;
            ctx.beginPath();
            ctx.arc(x, y, 2 + Math.random() * 5, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(8, 8);
        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(size, size, 32, 32),
            new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9, metalness: 0.0 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    },

    createSkyDome() {
        const skyGeo = new THREE.SphereGeometry(200, 48, 24);
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#0a1a3a');
        gradient.addColorStop(0.2, '#1a4a8a');
        gradient.addColorStop(0.45, '#4a8aca');
        gradient.addColorStop(0.7, '#7ab8e8');
        gradient.addColorStop(0.85, '#a0d0f0');
        gradient.addColorStop(1, '#c8e4f8');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1024, 512);

        for (let i = 0; i < 15; i++) {
            const cx = Math.random() * 1024;
            const cy = 180 + Math.random() * 200;
            const w = 50 + Math.random() * 80;
            const h = 12 + Math.random() * 20;
            ctx.fillStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.25})`;
            ctx.beginPath();
            ctx.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.15})`;
            ctx.beginPath();
            ctx.ellipse(cx + w * 0.3, cy - h * 0.5, w * 0.6, h * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        const sunX = 700, sunY = 350;
        const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 80);
        sunGrad.addColorStop(0, 'rgba(255,250,220,0.4)');
        sunGrad.addColorStop(0.5, 'rgba(255,240,200,0.1)');
        sunGrad.addColorStop(1, 'rgba(255,240,200,0)');
        ctx.fillStyle = sunGrad;
        ctx.fillRect(sunX - 80, sunY - 80, 160, 160);

        const skyMat = new THREE.MeshBasicMaterial({
            map: new THREE.CanvasTexture(canvas),
            side: THREE.BackSide
        });
        this.scene.add(new THREE.Mesh(skyGeo, skyMat));
    },

    createEnvironment() {
        this.trees = [];
        this.rocks = [];
        this.obstacles = [];

        this.createTrees();
        this.createRocks();
        this.createBuildings();
        this.createBunkers();
        this.createBarrels();
        this.createGrass();
    },

    createTrees() {
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });

        for (let i = 0; i < 35; i++) {
            const x = (Math.random() - 0.5) * 160;
            const z = (Math.random() - 0.5) * 160;
            if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;

            const tree = new THREE.Group();
            const trunkH = 3 + Math.random() * 2;
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, trunkH, 8), trunkMat);
            trunk.position.y = trunkH / 2;
            trunk.castShadow = true;
            tree.add(trunk);

            const leafColors = [0x2a6a2a, 0x337733, 0x2a7a3a, 0x3a8a3a];
            const leafSize = 1.5 + Math.random() * 1.8;
            for (let j = 0; j < 3; j++) {
                const lMat = new THREE.MeshStandardMaterial({
                    color: leafColors[Math.floor(Math.random() * leafColors.length)],
                    roughness: 0.8
                });
                const lSize = leafSize * (1 - j * 0.2);
                const leaves = new THREE.Mesh(new THREE.SphereGeometry(lSize, 8, 6), lMat);
                leaves.position.set(
                    (Math.random() - 0.5) * 0.8,
                    trunkH + 0.5 + j * 0.8,
                    (Math.random() - 0.5) * 0.8
                );
                leaves.castShadow = true;
                tree.add(leaves);
            }

            tree.position.set(x, 0, z);
            this.scene.add(tree);
            const treeData = { group: tree, position: new THREE.Vector3(x, 0, z), radius: 1.0, alive: true, health: 60 };
            this.trees.push(treeData);
            this.obstacles.push(treeData);
        }
    },

    createRocks() {
        const rockColors = [0x777777, 0x888888, 0x666666, 0x7a7a6a];

        for (let i = 0; i < 18; i++) {
            const x = (Math.random() - 0.5) * 140;
            const z = (Math.random() - 0.5) * 140;
            if (Math.abs(x) < 12 && Math.abs(z) < 12) continue;

            const s = 0.6 + Math.random() * 1.8;
            const rockMat = new THREE.MeshStandardMaterial({
                color: rockColors[Math.floor(Math.random() * rockColors.length)],
                roughness: 0.95,
                metalness: 0.05
            });
            const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 1), rockMat);
            rock.position.set(x, s * 0.35, z);
            rock.rotation.set(Math.random(), Math.random(), Math.random());
            rock.castShadow = true;
            rock.receiveShadow = true;
            this.scene.add(rock);
            const rockData = { group: rock, position: new THREE.Vector3(x, 0, z), radius: s * 0.8, alive: true };
            this.rocks.push(rockData);
            this.obstacles.push(rockData);
        }
    },

    createGrass() {
        const grassMat = new THREE.MeshBasicMaterial({ color: 0x3a7a2a, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
        for (let i = 0; i < 300; i++) {
            const x = (Math.random() - 0.5) * 160;
            const z = (Math.random() - 0.5) * 160;
            const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.4 + Math.random() * 0.3), grassMat);
            blade.position.set(x, 0.2, z);
            blade.rotation.y = Math.random() * Math.PI;
            blade.rotation.x = -0.1 + Math.random() * 0.2;
            this.scene.add(blade);
        }
    },

    createBuildings() {
        this.buildings = [];
        const positions = [
            { x: 35, z: 25 }, { x: -40, z: 30 }, { x: 45, z: -35 },
            { x: -35, z: -40 }, { x: 60, z: 10 }, { x: -55, z: -15 },
            { x: 20, z: -50 }, { x: -25, z: 55 }
        ];

        positions.forEach(p => {
            const group = new THREE.Group();
            const w = 5 + Math.random() * 3;
            const d = 4 + Math.random() * 3;
            const floors = 2 + Math.floor(Math.random() * 2);
            const h = floors * 3.5;

            const wallMat = new THREE.MeshStandardMaterial({ color: 0xbbaa88, roughness: 0.85 });
            const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
            body.position.y = h / 2;
            body.castShadow = true;
            body.receiveShadow = true;
            group.add(body);

            const roofMat = new THREE.MeshStandardMaterial({ color: 0x885544, roughness: 0.7 });
            const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.3, d + 0.4), roofMat);
            roof.position.y = h + 0.15;
            roof.castShadow = true;
            group.add(roof);

            const windowMat = new THREE.MeshStandardMaterial({ color: 0x88bbdd, roughness: 0.3, metalness: 0.2 });
            for (let f = 0; f < floors; f++) {
                const wy = f * 3.5 + 2;
                for (let side = -1; side <= 1; side += 2) {
                    const winCount = Math.floor(w / 2);
                    for (let wi = 0; wi < winCount; wi++) {
                        const wx = -w / 2 + 1.2 + wi * (w - 2) / Math.max(1, winCount - 1);
                        const win = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.1), windowMat);
                        win.position.set(wx, wy, side * (d / 2 + 0.05));
                        group.add(win);
                    }
                    for (let wi = 0; wi < Math.floor(d / 2); wi++) {
                        const wz = -d / 2 + 1.2 + wi * (d - 2) / Math.max(1, Math.floor(d / 2) - 1);
                        const win = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.8), windowMat);
                        win.position.set(side * (w / 2 + 0.05), wy, wz);
                        group.add(win);
                    }
                }
            }

            const doorMat = new THREE.MeshStandardMaterial({ color: 0x553322, roughness: 0.8 });
            const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.12), doorMat);
            door.position.set(0, 1.1, d / 2 + 0.06);
            group.add(door);

            group.position.set(p.x, 0, p.z);
            group.rotation.y = Math.random() * Math.PI * 0.5;
            this.scene.add(group);
            const bData = { group, health: 200, alive: true, position: new THREE.Vector3(p.x, 0, p.z), radius: Math.max(w, d) / 2 + 1 };
            this.buildings.push(bData);
            this.obstacles.push(bData);
        });
    },

    createBunkers() {
        this.bunkers = [];
        const sandMat = new THREE.MeshStandardMaterial({ color: 0xc2a060, roughness: 0.95 });
        const concreteMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 });

        const positions = [
            { x: 15, z: 15 }, { x: -18, z: 12 }, { x: 12, z: -18 },
            { x: -15, z: -15 }, { x: 30, z: -10 }, { x: -30, z: 5 },
            { x: 5, z: 30 }, { x: -8, z: -30 }, { x: 50, z: -20 },
            { x: -45, z: 25 }
        ];

        positions.forEach((p, idx) => {
            const group = new THREE.Group();
            if (idx % 3 === 0) {
                const wall = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 0.8), concreteMat);
                wall.position.y = 0.75;
                wall.castShadow = true;
                group.add(wall);
            } else {
                const rows = 3;
                const cols = 4 + Math.floor(Math.random() * 3);
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const bag = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.35), sandMat);
                        const offset = (r % 2 === 0) ? 0 : 0.3;
                        bag.position.set(c * 0.55 - cols * 0.275 + offset, r * 0.28 + 0.15, 0);
                        bag.castShadow = true;
                        group.add(bag);
                    }
                }
            }
            group.position.set(p.x, 0, p.z);
            group.rotation.y = Math.random() * Math.PI;
            this.scene.add(group);
            const bData = { group, health: 100, alive: true, position: new THREE.Vector3(p.x, 0, p.z), radius: 2.5 };
            this.bunkers.push(bData);
            this.obstacles.push(bData);
        });
    },

    createBarrels() {
        this.barrels = [];
        const barrelMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.3 });
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.5 });

        const positions = [
            { x: 20, z: 8 }, { x: 21.5, z: 8.5 }, { x: -25, z: 18 },
            { x: 38, z: -12 }, { x: 39, z: -11 }, { x: -42, z: -22 },
            { x: 55, z: 30 }, { x: -50, z: -35 }, { x: 10, z: -40 },
            { x: -15, z: 42 }, { x: 30, z: 45 }, { x: -60, z: 10 },
            { x: 48, z: -45 }
        ];

        positions.forEach(p => {
            const group = new THREE.Group();
            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12), barrelMat);
            body.position.y = 0.6;
            body.castShadow = true;
            group.add(body);
            const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.25, 12), stripeMat);
            stripe.position.y = 0.6;
            group.add(stripe);
            const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.05, 12), barrelMat);
            cap.position.y = 1.22;
            group.add(cap);
            group.position.set(p.x, 0, p.z);
            this.scene.add(group);
            this.barrels.push({ group, health: 1, alive: true, position: new THREE.Vector3(p.x, 0, p.z) });
        });
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
