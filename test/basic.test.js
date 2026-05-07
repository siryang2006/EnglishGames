// 基础功能测试 - 快速验证游戏加载
const { test, expect } = require('@playwright/test');

test.describe('游戏基础加载测试', () => {
    test('页面能正常打开', async ({ page }) => {
        await page.goto('http://localhost:8000', { timeout: 10000 });
        await page.waitForSelector('#start-screen', { timeout: 5000 });
        const title = await page.title();
        expect(title).toContain('英语坦克大战');
    });

    test('Three.js 已加载', async ({ page }) => {
        await page.goto('http://localhost:8000', { timeout: 10000 });
        const threeLoaded = await page.evaluate(() => typeof THREE !== 'undefined');
        expect(threeLoaded).toBeTruthy();
    });

    test('点击开始游戏后场景加载', async ({ page }) => {
        await page.goto('http://localhost:8000', { timeout: 15000 });
        await page.waitForSelector('#btn-start', { timeout: 10000 });

        // 直接调用启动函数，避免点击后等待页面稳定
        await page.evaluate(() => startGame());

        // 等待游戏对象被创建
        await page.waitForFunction(() => {
            return window.Game && window.Game.player;
        }, { timeout: 15000 });

        // 验证游戏对象存在
        const gameStatus = await page.evaluate(() => {
            return {
                hasGame: !!window.Game,
                hasGameScene: !!window.GameScene,
                hasPlayer: !!window.Game?.player,
                hasRenderer: !!window.GameScene?.renderer,
                hasScene: !!window.GameScene?.scene
            };
        });

        expect(gameStatus.hasGame).toBeTruthy();
        expect(gameStatus.hasGameScene).toBeTruthy();
        expect(gameStatus.hasPlayer).toBeTruthy();
        expect(gameStatus.hasRenderer).toBeTruthy();
        expect(gameStatus.hasScene).toBeTruthy();

        console.log('游戏状态:', gameStatus);
    });
});
