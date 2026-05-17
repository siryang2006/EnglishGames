// 模块化模型加载器 - 集中管理所有模型加载
var ModelLoader = (function() {
    var _models = {};
    var _animations = {};
    var _loaded = false;
    var _loadCount = 0;
    var _totalModels = 0;

    function _optimizeTexture(material) {
        var maxAnisotropy = (typeof GameScene !== 'undefined' && GameScene.renderer) 
            ? GameScene.renderer.capabilities.getMaxAnisotropy() : 1;
        
        ['map', 'normalMap', 'roughnessMap', 'metalnessMap'].forEach(function(prop) {
            if (material[prop]) {
                material[prop].minFilter = THREE.LinearMipmapLinearFilter;
                material[prop].magFilter = THREE.LinearFilter;
                material[prop].anisotropy = maxAnisotropy;
                material[prop].needsUpdate = true;
            }
        });
    }

    var _api = {
        // 新API - 直接访问内部数据
        get models() { return _models; },
        get animations() { return _animations; },
        get loaded() { return _loaded; },
        get loadCount() { return _loadCount; },
        get totalModels() { return _totalModels; },

        load: function(scene, config, onComplete) {
            if (_loaded) {
                if (onComplete) onComplete();
                return;
            }

            if (window.location.protocol === 'file:') {
                console.log('ModelLoader: file:// protocol, completing immediately');
                _loaded = true;
                if (onComplete) onComplete();
                return;
            }

            var loader = new THREE.GLTFLoader();
            var paths = Object.entries(config.paths);
            _totalModels = paths.length;

            paths.forEach(function(item) {
                var key = item[0];
                var path = item[1];
                
                loader.load(path, function(gltf) {
                    _models[key] = gltf.scene;
                    if (gltf.animations && gltf.animations.length > 0) {
                        _animations[key] = gltf.animations;
                        console.log(key + ' animations:', gltf.animations.map(function(a) { return a.name; }).join(', '));
                    }
                    _loadCount++;
                    console.log(key + ' loaded (' + _loadCount + '/' + _totalModels + ')');
                    if (_loadCount >= _totalModels) {
                        _loaded = true;
                        console.log('All models loaded!');
                        if (onComplete) onComplete();
                    }
                }, null, function(err) {
                    console.warn('Load failed:', path, err);
                    _loadCount++;
                    if (_loadCount >= _totalModels) {
                        _loaded = true;
                        if (onComplete) onComplete();
                    }
                });
            });
        },

        getModel: function(name) {
            if (!_models[name]) return null;
            var clone = _models[name].clone();
            clone.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                        child.material = child.material.clone();
                        _optimizeTexture(child.material);
                    }
                }
            });
            return clone;
        },

        getAnimation: function(name) {
            return _animations[name] || [];
        },

        hasModel: function(name) {
            return !!_models[name];
        },

        // 兼容旧API - 代理属���
        get ground() { return _models.ground; },
        get building() { return _models.ocean; },
        get animals() { return _models.animal; },
        get soldier() { return _models.soldier; },
        get rock() { return _models.rock; },
        get soldierAnimations() { return _animations.soldier || []; },
        get animalsAnimations() { return _animations.animal || []; },

        // 兼容旧方法
        getGround: function() {
            if (!this.ground) return null;
            var clone = this.ground.clone();
            clone.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            return clone;
        },
        getBuilding: function() {
            if (!this.building) return null;
            var clone = this.building.clone();
            clone.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                        child.material = child.material.clone();
                        _optimizeTexture(child.material);
                    }
                }
            });
            return clone;
        },
        getAnimals: function() {
            if (!this.animals) return null;
            var clone = this.animals.clone();
            clone.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            return clone;
        },
        getSoldier: function() {
            if (!this.soldier) return null;
            var clone = this.soldier.clone();
            clone.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            return clone;
        },
        getRock: function() {
            if (!this.rock) return null;
            var clone = this.rock.clone();
            clone.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            return clone;
        }
    };

    return _api;
})();

window.ModelLoader = ModelLoader;