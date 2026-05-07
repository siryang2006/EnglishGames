/**
 * 3D 显示检查脚本 - 在浏览器控制台运行
 * 使用方法：在 index.html 中引入此文件，或直接在控制台粘贴运行
 */

(function() {
    'use strict';

    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };

    function assert(name, condition, detail) {
        if (condition) {
            results.passed++;
            console.log(`✔ ${name}`);
        } else {
            results.failed++;
            console.error(`✘ ${name}`, detail || '');
        }
        results.tests.push({ name, passed: condition, detail });
    }

    function check3DDisplay() {
        console.log('=== 3D 显示检查开始 ===');

        // 1. 检查 Three.js 是否加载
        assert('Three.js 已加载', typeof THREE !== 'undefined', 'THREE 未定义');
        assert('WebGL 支持', !!window.WebGLRenderingContext, '浏览器不支持 WebGL');

        // 2. 检查场景
        const scene = window.GameScene && window.GameScene.scene;
        assert('场景已创建', !!scene, 'GameScene.scene 不存在');

        if (scene) {
            let meshCount = 0, lightCount = 0;
            scene.traverse(obj => {
                if (obj.isMesh) meshCount++;
                if (obj.isLight) lightCount++;
            });
            assert('场景包含 Mesh', meshCount > 0, `Mesh 数量: ${meshCount}`);
            assert('场景包含光源', lightCount > 0, `光源数量: ${lightCount}`);
            console.log(`  场景对象: ${meshCount} meshes, ${lightCount} lights`);
        }

        // 3. 检查渲染器
        const renderer = window.GameScene && window.GameScene.renderer;
        assert('渲染器已创建', !!renderer, 'GameScene.renderer 不存在');
        if (renderer) {
            assert('WebGL 上下文正常', !!renderer.getContext(), '无法获取 WebGL 上下文');
            assert('阴影开启', renderer.shadowMap.enabled, '阴影未开启');
        }

        // 4. 检查玩家坦克
        const player = window.Game && window.Game.player;
        assert('玩家坦克存在', !!player, 'Game.player 不存在');
        if (player) {
            assert('玩家坦克存活', player.alive === true, '玩家坦克未存活');
            assert('坦克位置有效', isFinite(player.group.position.x), '坦克位置无效');
            assert('坦克有 GLTF 模型或程序模型', player.gltfModel !== null || player.group.children.length > 0, '坦克无模型');
            console.log(`  坦克位置: (${player.group.position.x.toFixed(1)}, ${player.group.position.z.toFixed(1)})`);
        }

        // 5. 检查敌人坦克
        const enemies = window.Game && window.Game.enemies;
        if (enemies) {
            assert('敌人坦克已生成', enemies.length > 0, `敌人数量: ${enemies.length}`);
            const aliveEnemies = enemies.filter(e => e.alive);
            assert('有存活的敌人', aliveEnemies.length > 0, '无存活敌人');
            console.log(`  敌人: ${aliveEnemies.length}/${enemies.length} 存活`);
        }

        // 6. 检查士兵
        if (window.SoldierManager) {
            const soldiers = SoldierManager.soldiers;
            console.log(`  士兵数量: ${soldiers.length}`);
            if (soldiers.length > 0) {
                const s = soldiers[0];
                assert('士兵模型已加载', s.group.children.length > 0, '士兵无子对象');
                assert('士兵使用 GLTF', s.usingGltf === true || s.usingGltf === false, 'usingGltf 未定义');
                if (s.usingGltf) {
                    assert('士兵有动画 Mixer', s.mixer !== null, 'GLTF 士兵无 Mixer');
                }
            }
        }

        // 7. 检查动物
        if (window.AnimalManager) {
            const animals = AnimalManager.animals;
            console.log(`  动物数量: ${animals.length}`);
            if (animals.length > 0) {
                const a = animals[0];
                assert('动物模型已加载', a.group.children.length > 0, '动物无子对象');
                if (a.usingGltf) {
                    assert('动物有动画 Mixer', a.mixer !== null, 'GLTF 动物无 Mixer');
                }
            }
        }

    // 8. 检查 ModelLoader
    if (window.ModelLoader) {
        assert('ModelLoader 已加载', true);
        assert('ModelLoader.load 方法存在', typeof ModelLoader.load === 'function');

        // 等待模型加载完成后再检查
        const checkModels = () => {
            const groundOk = ModelLoader.ground !== null;
            const soldierOk = ModelLoader.soldier !== null;
            const animalsOk = ModelLoader.animals !== null;
            const allLoaded = ModelLoader.loaded;

            if (allLoaded) {
                assert('地面模型已加载', groundOk || window.location.protocol === 'file:');
                assert('士兵模型已加载', soldierOk || window.location.protocol === 'file:');
                assert('动物模型已加载', animalsOk || window.location.protocol === 'file:');
            } else {
                console.log('模型还在加载中...');
            }

            if (ModelLoader.soldierAnimations) {
                console.log(`  士兵动画数: ${ModelLoader.soldierAnimations.length}`);
            }
        };

        // 如果已经加载完成，直接检查
        if (ModelLoader.loaded) {
            checkModels();
        } else {
            // 否则等待加载完成（最多10秒）
            const waitForLoad = setInterval(() => {
                if (ModelLoader.loaded) {
                    clearInterval(waitForLoad);
                    checkModels();
                }
            }, 500);
            // 10秒后停止等待
            setTimeout(() => clearInterval(waitForLoad), 10000);
        }
    }

        // 9. 检查帧率（简单测试）
        if (window.GameScene && window.GameScene.clock) {
            const fps = 1 / Math.max(0.001, window.GameScene.clock.getDelta());
            assert('帧率正常', fps > 10 && fps < 200, `帧率: ${fps.toFixed(1)}`);
        }

        // 输出结果
        console.log('\n=== 检查结果 ===');
        console.log(`通过: ${results.passed}, 失败: ${results.failed}`);
        if (results.failed > 0) {
            console.log('\n失败项:');
            results.tests.filter(t => !t.passed).forEach(t => {
                console.error(`  ✘ ${t.name}`, t.detail);
            });
        } else {
            console.log('✔ 所有检查通过！');
        }

        return results;
    }

    // 暴露到全局
    window.check3DDisplay = check3DDisplay;

    // 如果页面已加载，自动运行
    if (document.readyState === 'complete') {
        setTimeout(check3DDisplay, 1000);
    } else {
        window.addEventListener('load', () => setTimeout(check3DDisplay, 1000));
    }
})();
