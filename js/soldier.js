class Soldier {
    constructor(scene, isPlayerTeam = true) {
        this.scene = scene;
        this.isPlayerTeam = isPlayerTeam;
        this.group = new THREE.Group();
        this.health = 30;
        this.maxHealth = 30;
        this.alive = true;
        this.speed = 2;
        this.patrolCenter = new THREE.Vector3();
        this.patrolAngle = Math.random() * Math.PI * 2;
        this.patrolTimer = 0;
        this.word = null;
        this.letter = '';
        this.usingGltf = false;
        this.mixer = null;
        this.currentAction = null;

        this.usingGltf = false;
        this.buildModel();
        this.createHealthBar();
        if (!isPlayerTeam) {
            this.word = WordManager.getRandomWord();
            this.letter = this.word.en;
            this.createLetterLabel();
        }
        scene.add(this.group);
    }

buildModel() {
        if (typeof ModelLoader !== 'undefined' && ModelLoader.hasModel('soldier')) {
            this.loadGLTFModel();
        } else {
            this.buildPrimitiveModel();
        }
    },

    loadGLTFModel() {
        const scale = ModelConfig.scales.soldier || 0.8;
        const model = ModelLoader.getModel('soldier');
        if (model) {
            model.scale.setScalar(scale);
            model.rotation.y = Math.PI;
            
            // Setup animation mixer
            const animations = ModelLoader.getAnimation('soldier');
            if (animations && animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(model);
                const keywords = ModelConfig.animationKeywords.soldier || ['walk', 'idle'];
                const clip = animations.find(a =>
                    keywords.some(k => a.name.toLowerCase().includes(k))
                ) || animations[0];
                if (clip) {
                    this.currentAction = this.mixer.clipAction(clip);
                    this.currentAction.play();
                }
            }
            
            this.group.add(model);
            this.usingGltf = true;
            console.log('Soldier: using GLTF model, scale:', scale);
        } else {
            this.buildPrimitiveModel();
        }
    },

    spawnFriendly(count) {
        for (let i = 0; i < count; i++) {
            const s = new Soldier(this.scene, true);
            const angle = (i / count) * Math.PI * 2;
            const dist = 5 + Math.random() * 3;
            s.group.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
            s.patrolCenter.copy(s.group.position);
            console.log('Spawned friendly soldier at', s.group.position.x.toFixed(1), s.group.position.z.toFixed(1));
            this.soldiers.push(s);
        }
    },

    spawnEnemy(count) {
        for (let i = 0; i < count; i++) {
            const s = new Soldier(this.scene, false);
            const angle = Math.random() * Math.PI * 2;
            const dist = 35 + Math.random() * 30;
            s.group.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
            s.patrolCenter.copy(s.group.position);
            console.log('Spawned enemy soldier at', s.group.position.x.toFixed(1), s.group.position.z.toFixed(1));
            this.soldiers.push(s);
        }
    },

    getPlayerSoldiers() {
        return this.soldiers.filter(s => s.isPlayerTeam && s.alive);
    },

    getEnemySoldiers() {
        return this.soldiers.filter(s => !s.isPlayerTeam && s.alive);
    },

    update(dt) {
        this.soldiers.forEach(s => {
            if (s.alive) s.updateAI(dt);
        });
    },

    updateMixers(dt) {
        this.soldiers.forEach(s => {
            if (s.alive && s.mixer) {
                s.mixer.update(dt);
            }
        });
    },

    clear() {
        this.soldiers.forEach(s => s.dispose());
        this.soldiers = [];
        this.scene = null;
    }
};

window.SoldierManager = SoldierManager;
