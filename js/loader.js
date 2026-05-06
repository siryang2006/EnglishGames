const ModelLoader = {
    ground: null,
    building: null,
    animals: null,
    soldier: null,
    loaded: false,
    loadCount: 0,
    totalModels: 4,

    load(scene, onComplete) {
        if (this.loaded) {
            if (onComplete) onComplete();
            return;
        }

        if (window.location.protocol === 'file:') {
            console.log('ModelLoader: using procedural models (file:// protocol)');
            this.loaded = true;
            if (onComplete) onComplete();
            return;
        }

        const loader = new THREE.GLTFLoader();
        const self = this;
        const loadModel = (path, target, name) => {
            loader.load(path, (gltf) => {
                self[target] = gltf.scene;
                self.loadCount++;
                console.log(name + ' loaded (' + self.loadCount + '/' + self.totalModels + ')');
                if (self.loadCount >= self.totalModels) {
                    self.loaded = true;
                    console.log('All models loaded!');
                    if (onComplete) onComplete();
                }
            }, null, (err) => {
                console.warn('Load failed:', path, err);
                self.loadCount++;
                if (self.loadCount >= self.totalModels) {
                    self.loaded = true;
                    if (onComplete) onComplete();
                }
            });
        };

        loadModel('models/ground.glb', 'ground', 'Ground');
        loadModel('models/building.glb', 'building', 'Building');
        loadModel('models/animals_real.glb', 'animals', 'Animals');
        loadModel('models/soldier.glb', 'soldier', 'Soldier');
    },

    getGround() {
        return this.ground ? this.ground.clone() : null;
    },
    getBuilding() {
        return this.building ? this.building.clone() : null;
    },
    getAnimals() {
        if (!this.animals) return null;
        const clone = this.animals.clone();
        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        return clone;
    },
    getSoldier() {
        if (!this.soldier) {
            console.log('getSoldier: this.soldier is null');
            return null;
        }
        let meshCount = 0;
        this.soldier.traverse(c => { if (c.isMesh) meshCount++; });
        console.log('getSoldier: found', meshCount, 'meshes');
        return this.soldier.clone();
    }
};

window.ModelLoader = ModelLoader;