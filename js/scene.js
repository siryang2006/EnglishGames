const GameScene = {
    scene: null,
    camera: null,
    renderer: null,
    clock: null,
    buildings: [],
    bunkers: [],
    barrels: [],

    init() {
        this.clock = new THREE.Clock();
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.008);

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

        this.createLights();
        this.createGround();
        this.createSkyDome();
        this.createEnvironment();

        window.addEventListener('resize', () => this.onResize());
    },

    createLights() {
        const ambient = new THREE.AmbientLight(0x6688aa, 0.5);
        this.scene.add(ambient);

        const sun = new THREE.DirectionalLight(0xffeedd, 1.0);
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
        this.scene.add(sun);

        const hemi = new THREE.HemisphereLight(0x88aacc, 0x445522, 0.4);
        this.scene.add(hemi);
    },

    createGround() {
        const size = 200;
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#4a7a3a';
        ctx.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 3000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            ctx.fillStyle = `hsl(${100 + Math.random() * 30}, ${40 + Math.random() * 30}%, ${25 + Math.random() * 20}%)`;
            ctx.fillRect(x, y, 2, 4);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(10, 10);

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(size, size),
            new THREE.MeshLambertMaterial({ map: texture })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    },

    createSkyDome() {
        const skyGeo = new THREE.SphereGeometry(200, 32, 16);
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, '#1a3a6a');
        gradient.addColorStop(0.4, '#4a8aca');
        gradient.addColorStop(0.7, '#87ceeb');
        gradient.addColorStop(1, '#b0d8f0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 256);

        for (let i = 0; i < 8; i++) {
            const cx = Math.random() * 512;
            const cy = 100 + Math.random() * 100;
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.ellipse(cx, cy, 40 + Math.random() * 30, 10 + Math.random() * 10, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        const skyMat = new THREE.MeshBasicMaterial({
            map: new THREE.CanvasTexture(canvas),
            side: THREE.BackSide
        });
        this.scene.add(new THREE.Mesh(skyGeo, skyMat));
    },

    createEnvironment() {
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5a3a1a });
        const leafMat = new THREE.MeshLambertMaterial({ color: 0x2a6a2a });

        for (let i = 0; i < 30; i++) {
            const x = (Math.random() - 0.5) * 160;
            const z = (Math.random() - 0.5) * 160;
            if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;

            const tree = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 4, 6), trunkMat);
            trunk.position.y = 2;
            trunk.castShadow = true;
            tree.add(trunk);

            const leafSize = 1.5 + Math.random() * 1.5;
            const leaves = new THREE.Mesh(new THREE.SphereGeometry(leafSize, 8, 6), leafMat);
            leaves.position.y = 4.5 + Math.random();
            leaves.castShadow = true;
            tree.add(leaves);

            tree.position.set(x, 0, z);
            this.scene.add(tree);
        }

        const rockMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
        for (let i = 0; i < 15; i++) {
            const x = (Math.random() - 0.5) * 140;
            const z = (Math.random() - 0.5) * 140;
            if (Math.abs(x) < 12 && Math.abs(z) < 12) continue;

            const s = 0.5 + Math.random() * 1.5;
            const rock = new THREE.Mesh(
                new THREE.DodecahedronGeometry(s, 0),
                rockMat
            );
            rock.position.set(x, s * 0.4, z);
            rock.rotation.set(Math.random(), Math.random(), Math.random());
            rock.castShadow = true;
            this.scene.add(rock);
        }

        this.createBuildings();
        this.createBunkers();
        this.createBarrels();
    },

    createBuildings() {
        this.buildings = [];
        const wallMat = new THREE.MeshPhongMaterial({ color: 0xbbaa88 });
        const roofMat = new THREE.MeshPhongMaterial({ color: 0x885544 });
        const windowMat = new THREE.MeshPhongMaterial({ color: 0x224466 });

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

            const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
            body.position.y = h / 2;
            body.castShadow = true;
            body.receiveShadow = true;
            group.add(body);

            const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.3, d + 0.4), roofMat);
            roof.position.y = h + 0.15;
            roof.castShadow = true;
            group.add(roof);

            for (let f = 0; f < floors; f++) {
                const wy = f * 3.5 + 2;
                for (let side = -1; side <= 1; side += 2) {
                    const winCount = Math.floor(w / 2);
                    for (let wi = 0; wi < winCount; wi++) {
                        const wx = -w / 2 + 1.2 + wi * (w - 2) / Math.max(1, winCount - 1);
                        const win = new THREE.Mesh(
                            new THREE.BoxGeometry(0.8, 1.2, 0.1),
                            windowMat
                        );
                        win.position.set(wx, wy, side * (d / 2 + 0.05));
                        group.add(win);
                    }
                    for (let wi = 0; wi < Math.floor(d / 2); wi++) {
                        const wz = -d / 2 + 1.2 + wi * (d - 2) / Math.max(1, Math.floor(d / 2) - 1);
                        const win = new THREE.Mesh(
                            new THREE.BoxGeometry(0.1, 1.2, 0.8),
                            windowMat
                        );
                        win.position.set(side * (w / 2 + 0.05), wy, wz);
                        group.add(win);
                    }
                }
            }

            group.position.set(p.x, 0, p.z);
            group.rotation.y = Math.random() * Math.PI * 0.5;
            this.scene.add(group);
            this.buildings.push({ group, health: 200, alive: true, position: new THREE.Vector3(p.x, 0, p.z), radius: Math.max(w, d) / 2 + 1 });
        });
    },

    createBunkers() {
        this.bunkers = [];
        const sandMat = new THREE.MeshPhongMaterial({ color: 0xc2a060 });
        const concreteMat = new THREE.MeshPhongMaterial({ color: 0x888888 });

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
                        const bag = new THREE.Mesh(
                            new THREE.BoxGeometry(0.6, 0.3, 0.35),
                            sandMat
                        );
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
            this.bunkers.push({ group, health: 100, alive: true, position: new THREE.Vector3(p.x, 0, p.z), radius: 2.5 });
        });
    },

    createBarrels() {
        this.barrels = [];
        const barrelMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const stripeMat = new THREE.MeshPhongMaterial({ color: 0xcc2222 });

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

    removeDestructible(obj) {
        if (obj.group) {
            this.scene.remove(obj.group);
        }
        obj.alive = false;
    },

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
};
