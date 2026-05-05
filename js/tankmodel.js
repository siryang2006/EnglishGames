const TankGLTFLoader = {
    playerModel: null,
    enemyModels: [],
    modelLoaded: false,
    modelReady: false,
    loading: false,
    modelRotationY: Math.PI,
    enemyModelRotationY: 0,
    barrelDirection: -1,

load(scene, onLoad, onError) {
        if (this.loading) return;
        if (this.modelReady && this.playerModel) {
            return;
        }

        if (window.location.protocol === 'file:') {
            console.log('TankGLTFLoader: using procedural model (file:// protocol)');
            this.modelReady = true;
            this.loading = false;
            if (onLoad) onLoad(null);
            return;
        }

        this.loading = true;
        const loader = new THREE.GLTFLoader();
        
        const modelPath = 'models/abrams_player.glb';
        console.log('Loading Abrams tank model from:', modelPath);
        
        loader.load(modelPath, (gltf) => {
            const model = gltf.scene;
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                        child.material.roughness = 0.5;
                        child.material.metalness = 0.6;
                    }
                }
            });
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetSize = 5.0;
            const scale = targetSize / maxDim;
            model.scale.setScalar(scale);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);
            model.position.y = -box.min.y * scale;
            this.playerModel = model;
            this.modelLoaded = true;
            this.modelReady = true;
            this.loading = false;
            console.log('Tank model loaded, scale:', scale);
            if (onLoad) onLoad(model);
        }, null, (err) => {
            console.error('Tank model load error:', err);
            this.loading = false;
            if (onError) onError(err);
        });
    },

    createFromModel(originalModel, isPlayer) {
        if (!originalModel) return null;
        
        const model = originalModel.clone();
        
        const color = isPlayer ? 0x4a5d3a : 0x8b3a2a;
        
        model.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material = child.material.clone();
                if (child.material.color) {
                    child.material.color.setHex(color);
                }
            }
        });
        
        model.rotation.y = Math.PI;
        
        return model;
    },

    isReady() {
        return this.modelReady;
    }
};

window.TankGLTFLoader = TankGLTFLoader;