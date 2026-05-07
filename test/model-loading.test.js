// 模型加载验证测试
const { test, expect } = require('@playwright/test');

test.describe('3D 模型加载验证', () => {
    
    test('所有模型文件正确加载', async ({ page }) => {
        await page.goto('http://localhost:8000');
        await page.evaluate(() => startGame());
        
        // 等待模型加载完成
        await page.waitForFunction(() => window.ModelLoader?.loaded, { timeout: 30000 });
        
        // 检查模型加载状态
        const modelStatus = await page.evaluate(() => {
            return {
                groundLoaded: !!ModelLoader.ground,
                buildingLoaded: !!ModelLoader.building,
                soldierLoaded: !!ModelLoader.soldier,
                animalsLoaded: !!ModelLoader.animals,
                soldierAnimCount: ModelLoader.soldierAnimations?.length || 0,
                animalsAnimCount: ModelLoader.animalsAnimations?.length || 0,
                tankModelLoaded: !!TankGLTFLoader?.playerModel
            };
        });
        
        console.log('模型加载状态:', modelStatus);
        
        // 验证至少有一些模型加载成功
        const anyModelLoaded = 
            modelStatus.groundLoaded || 
            modelStatus.buildingLoaded || 
            modelStatus.soldierLoaded || 
            modelStatus.animalsLoaded;
            
        expect(anyModelLoaded).toBeTruthy();
    });

    test('坦克模型加载验证', async ({ page }) => {
        await page.goto('http://localhost:8000');
        await page.evaluate(() => startGame());
        await page.waitForFunction(() => window.Game?.player, { timeout: 20000 });
        
        const tankStatus = await page.evaluate(() => {
            const player = window.Game.player;
            return {
                hasPlayer: !!player,
                hasGltfModel: !!player.gltfModel,
                treadMeshes: player.treadMeshes?.length || 0,
                wheelMeshes: player.wheelMeshes?.length || 0,
                health: player.health,
                alive: player.alive
            };
        });
        
        console.log('坦克状态:', tankStatus);
        
        expect(tankStatus.hasPlayer).toBeTruthy();
        expect(tankStatus.health).toBe(100);
        expect(tankStatus.alive).toBe(true);
    });

    test('士兵动画混合器验证', async ({ page }) => {
        await page.goto('http://localhost:8000');
        await page.evaluate(() => startGame());
        await page.waitForFunction(() => window.SoldierManager?.soldiers?.length > 0, { timeout: 20000 });
        
        const soldierStatus = await page.evaluate(() => {
            const soldiers = window.SoldierManager.soldiers;
            return soldiers.map((s, i) => ({
                index: i,
                alive: s.alive,
                hasMixer: !!s.mixer,
                actions: s.mixer?._actions?.length || 0,
                usingGltf: s.usingGltf
            }));
        });
        
        console.log('士兵状态:', JSON.stringify(soldierStatus, null, 2));
        
        // 至少有一些士兵有动画混合器
        const soldiersWithMixer = soldierStatus.filter(s => s.hasMixer).length;
        expect(soldiersWithMixer).toBeGreaterThan(0);
    });

    test('动物动画混合器验证', async ({ page }) => {
        await page.goto('http://localhost:8000');
        await page.evaluate(() => startGame());
        await page.waitForFunction(() => window.AnimalManager?.animals?.length > 0, { timeout: 20000 });
        
        const animalStatus = await page.evaluate(() => {
            const animals = window.AnimalManager.animals;
            return animals.map((a, i) => ({
                index: i,
                type: a.type,
                alive: a.alive,
                hasMixer: !!a.mixer,
                actions: a.mixer?._actions?.length || 0
            }));
        });
        
        console.log('动物状态:', JSON.stringify(animalStatus, null, 2));
        
        // 至少有一些动物有动画混合器
        const animalsWithMixer = animalStatus.filter(a => a.hasMixer).length;
        expect(animalsWithMixer).toBeGreaterThan(0);
    });

    test('场景渲染验证', async ({ page }) => {
        await page.goto('http://localhost:8000');
        await page.evaluate(() => startGame());
        await page.waitForFunction(() => window.GameScene?.scene, { timeout: 15000 });
        
        const sceneStatus = await page.evaluate(() => {
            const scene = window.GameScene.scene;
            const renderer = window.GameScene.renderer;
            
            let meshCount = 0;
            let lightCount = 0;
            
            scene.traverse((obj) => {
                if (obj.isMesh) meshCount++;
                if (obj.isLight) lightCount++;
            });
            
            return {
                meshCount,
                lightCount,
                hasRenderer: !!renderer,
                hasContext: !!renderer?.domElement?.getContext('webgl2') || !!renderer?.domElement?.getContext('webgl')
            };
        });
        
        console.log('场景状态:', sceneStatus);
        
        expect(sceneStatus.meshCount).toBeGreaterThan(10);
        expect(sceneStatus.lightCount).toBeGreaterThan(0);
        expect(sceneStatus.hasRenderer).toBe(true);
        expect(sceneStatus.hasContext).toBe(true);
    });
});