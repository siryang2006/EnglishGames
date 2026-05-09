// 3D 显示自动化测试 - 使用 Playwright
// 运行: npx playwright test 3d-visual.test.js

const { test, expect } = require('@playwright/test');

test.describe('3D 模型加载和显示测试', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8000', { timeout: 15000 });
        await page.waitForSelector('#start-screen', { timeout: 10000 });
        await page.click('#btn-start');
        await page.waitForFunction(() => window.GameScene && window.GameScene.scene, { timeout: 20000 });
        await page.waitForTimeout(3000);
    });

    test('模型加载状态检查', async ({ page }) => {
        const modelStatus = await page.evaluate(() => {
            return {
                modelLoaderReady: window.ModelLoader && window.ModelLoader.loaded,
                tankModelExists: window.TankGLTFLoader && window.TankGLTFLoader.isReady(),
                sceneExists: !!window.GameScene && !!window.GameScene.scene,
                gameExists: !!window.Game
            };
        });
        expect(modelStatus.sceneExists).toBeTruthy();
        console.log('模型加载状态:', modelStatus);
    });

    test('场景对象数量检查', async ({ page }) => {
        const sceneInfo = await page.evaluate(() => {
            if (!window.GameScene || !window.GameScene.scene) return null;
            let meshCount = 0, lightCount = 0;
            window.GameScene.scene.traverse(obj => {
                if (obj.isMesh) meshCount++;
                if (obj.isLight) lightCount++;
            });
            return { meshCount, lightCount };
        });
        expect(sceneInfo).not.toBeNull();
        expect(sceneInfo.meshCount).toBeGreaterThan(5);
        expect(sceneInfo.lightCount).toBeGreaterThan(0);
    });

    test('坦克模型显示检查', async ({ page }) => {
        const tankInfo = await page.evaluate(() => {
            if (!window.Game || !window.Game.player) return null;
            const t = window.Game.player;
            return {
                hasModel: t.gltfModel !== null,
                position: { x: t.group.position.x, z: t.group.position.z },
                health: t.health,
                alive: t.alive
            };
        });
        expect(tankInfo).not.toBeNull();
        expect(tankInfo.health).toBe(100);
    });

    test('WebGL渲染状态检查', async ({ page }) => {
        const renderInfo = await page.evaluate(() => {
            if (!window.GameScene || !window.GameScene.renderer) return null;
            const r = window.GameScene.renderer;
            return {
                hasContext: !!r.getContext(),
                shadowMap: r.shadowMap.enabled,
            };
        });
        expect(renderInfo).not.toBeNull();
    });

    test('截图测试 - 游戏加载完成', async ({ page }) => {
        // 检查canvas是否存在
        const canvasExists = await page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            return canvas ? { width: canvas.width, height: canvas.height } : null;
        });
        console.log('Canvas:', canvasExists);
        
        // 等待更长时间让渲染完成
        await page.waitForTimeout(2000);
        
        // 尝试获取canvas数据确认非黑
        const pixelData = await page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            if (!canvas) return null;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;
            // 获取中心点像素
            const imageData = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1);
            return {
                r: imageData.data[0],
                g: imageData.data[1],
                b: imageData.data[2],
                a: imageData.data[3]
            };
        });
        console.log('中心像素:', pixelData);
        
        // 截图
        await page.screenshot({ path: 'test/screenshots/game-load.png', fullPage: false });
        console.log('截图已保存到 test/screenshots/game-load.png');
    });
});