const MuzzleFlash = {
    flashes: [],

    create(scene, position, direction) {
        const flash = {
            scene: scene,
            group: new THREE.Group(),
            age: 0,
            maxAge: 0.08,
            alive: true
        };

        const innerGeo = new THREE.SphereGeometry(0.25, 8, 8);
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 1.0
        });
        const inner = new THREE.Mesh(innerGeo, innerMat);
        flash.group.add(inner);
        flash.inner = inner;

        const outerGeo = new THREE.SphereGeometry(0.5, 8, 8);
        const outerMat = new THREE.MeshBasicMaterial({
            color: 0xff8800,
            transparent: true,
            opacity: 0.7
        });
        const outer = new THREE.Mesh(outerGeo, outerMat);
        flash.group.add(outer);
        flash.outer = outer;

        const light = new THREE.PointLight(0xffaa00, 5, 15);
        flash.group.add(light);
        flash.light = light;

        flash.group.position.copy(position);
        flash.group.lookAt(position.clone().add(direction));
        flash.group.rotateX(Math.PI / 2);

        scene.add(flash.group);
        this.flashes.push(flash);

        return flash;
    },

    update(dt) {
        for (let i = this.flashes.length - 1; i >= 0; i--) {
            const flash = this.flashes[i];
            flash.age += dt;

            const t = flash.age / flash.maxAge;
            const scale = 1 + t * 2;
            flash.inner.scale.setScalar(scale);
            flash.outer.scale.setScalar(scale * 1.5);

            const opacity = 1 - t;
            flash.inner.material.opacity = opacity;
            flash.outer.material.opacity = opacity * 0.7;
            flash.light.intensity = (1 - t) * 5;

            if (flash.age >= flash.maxAge) {
                flash.scene.remove(flash.group);
                this.flashes.splice(i, 1);
            }
        }
    },

    clear() {
        for (const flash of this.flashes) {
            flash.scene.remove(flash.group);
        }
        this.flashes = [];
    }
};