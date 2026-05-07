const ModelLoader = {
    ground: null,
    building: null,
    animals: null,
    soldier: null,
    soldierAnimations: [],
    animalsAnimations: [],
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
        const loadModel = (path, target, name, animTarget) => {
            loader.load(path, (gltf) => {
                self[target] = gltf.scene;
                // Store animations if available
                if (animTarget && gltf.animations && gltf.animations.length > 0) {
                    self[animTarget] = gltf.animations;
                    console.log(name + ' animations loaded:', gltf.animations.length);
                }
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

        loadModel('models/ground.glb', 'ground', 'Ground', null);
        loadModel('models/building.glb', 'building', 'Building', null);
        loadModel('models/stylized_soldier_rigged.glb', 'soldier', 'Soldier', 'soldierAnimations');
        loadModel('models/animals_real.glb', 'animals', 'Animals', 'animalsAnimations');
    },

    getGround() {
        return this.ground ? this.ground.clone() : null;
    },
    getBuilding() {
        if (!this.building) return null;
        const clone = this.building.clone();
        const maxAnisotropy = (typeof GameScene !== 'undefined' && GameScene.renderer) ?
            GameScene.renderer.capabilities.getMaxAnisotropy() : 1;
        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material = child.material.clone();
                    // 提高纹理清晰度
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
                }
            }
        });
        return clone;
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
            return null;
        }
        const clone = this.soldier.clone();
        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        return clone;
    }
};

window.ModelLoader = ModelLoader;