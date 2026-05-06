const ModelLoader = {
    ground: null,
    building: null,
    deerModel: null,
    boarModel: null,
    horseModel: null,
    duckModel: null,
    parrotModel: null,
    flamingoModel: null,
    flamingo2Model: null,
    tigerModel: null,
    cowModel: null,
    soldier: null,
    loaded: false,
    loadCount:0,
    totalModels: 11,

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
        loadModel('models/deer.glb', 'deerModel', 'Deer');
        loadModel('models/low_poly_deer.glb', 'lowPolyDeerModel', 'LowPolyDeer');
        loadModel('models/horse.glb', 'horseModel', 'Horse');
        loadModel('models/horse_riggedgame_ready_by_get3dmodels.glb', 'horseRiggedModel', 'HorseRigged');
        loadModel('models/duck.glb', 'duckModel', 'Duck');
        loadModel('models/parrot.glb', 'parrotModel', 'Parrot');
        loadModel('models/flamingo.glb', 'flamingoModel', 'Flamingo');
        loadModel('models/flamingo2.glb', 'flamingo2Model', 'Flamingo2');
        loadModel('models/Tiger.glb', 'tigerModel', 'Tiger');
        loadModel('models/Cow.glb', 'cowModel', 'Cow');
        loadModel('models/soldier.glb', 'soldier', 'Soldier');
    },

    getGround() {
        return this.ground ? this.ground.clone() : null;
    },
    getBuilding() {
        return this.building ? this.building.clone() : null;
    },
    getDeer() {
        if (!this.deerModel) {
            console.warn('Deer model not loaded, will use procedural model');
            return null;
        }
        const clone = this.deerModel.clone();
        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        return clone;
    },
    getBoar() {
        if (!this.boarModel) {
            console.warn('Boar model not loaded, will use procedural model');
            return null;
        }
        const clone = this.boarModel.clone();
        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        return clone;
    },
    getHorse() {
        if (!this.horseModel) {
            console.warn('Horse model not loaded, will use procedural model');
            return null;
        }
        const clone = this.horseModel.clone();
        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        return clone;
    },
    getDuck() {
        if (!this.duckModel) {
            console.warn('Duck model not loaded, will use procedural model');
            return null;
        }
        const clone = this.duckModel.clone();
        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        return clone;
    },
    getParrot() {
        if (!this.parrotModel) {
            console.warn('Parrot model not loaded, will use procedural model');
            return null;
        }
        const clone = this.parrotModel.clone();
        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        return clone;
    },
    getFlamingo() {
        if (!this.flamingoModel) {
            console.warn('Flamingo model not loaded, will use procedural model');
            return null;
        }
        const clone = this.flamingoModel.clone();
        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        return clone;
    },
    getFlamingo2() {
        if (!this.flamingo2Model) {
            console.warn('Flamingo2 model not loaded, will use procedural model');
            return null;
        }
        const clone = this.flamingo2Model.clone();
        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        return clone;
    },
    getLowPolyDeer() {
        if (!this.lowPolyDeerModel) {
            console.warn('LowPolyDeer model not loaded, will use procedural model');
            return null;
        }
        const clone = this.lowPolyDeerModel.clone();
        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        return clone;
    },
    getTiger() {
        if (!this.tigerModel) {
            console.warn('Tiger model not loaded, will use procedural model');
            return null;
        }
        const clone = this.tigerModel.clone();
        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        return clone;
    },
    getCow() {
        if (!this.cowModel) {
            console.warn('Cow model not loaded, will use procedural model');
            return null;
        }
        const clone = this.cowModel.clone();
        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        return clone;
    },
    getHorseRigged() {
        if (!this.horseRiggedModel) {
            console.warn('HorseRigged model not loaded, will use procedural model');
            return null;
        }
        const clone = this.horseRiggedModel.clone();
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