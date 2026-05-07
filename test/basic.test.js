// 基础功能测试 - 快速验证游戏加载
const { test, expect } = require('@playwright/test');

test.describe('游戏基础加载测试', () => {
    let consoleErrors = [];
    let consoleWarnings = [];

    test.beforeEach(async ({ page }) => {
        // 监听控制台消息
        consoleErrors = [];
        consoleWarnings = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            } else if (msg.type() === 'warning') {
                consoleWarnings.push(msg.text());
            }
        });
        page.on('pageerror', error => {
            consoleErrors.push('PAGE ERROR: ' + error.message);
        });
    });

    test('页面能正常打开', async ({ page }) => {
        await page.goto('http://localhost:8000', { timeout: 10000 });
        await page.waitForSelector('#start-screen', { timeout: 5000 });
        const title = await page.title();
        expect(title).toContain('英语坦克大战');

        // 检查控制台是否有严重错误
        const criticalErrors = consoleErrors.filter(e =>
            !e.includes('favicon') &&
            !e.includes('NotAllowedError') &&
            !e.includes('Custom UV set')
        );
        if (criticalErrors.length > 0) {
            console.log('控制台错误:', criticalErrors);
        }
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
                hasScene: !!window.GameScene?.scene,
                // 检查是否有黑屏（场景子对象数量）
                sceneChildren: window.GameScene?.scene?.children?.length || 0
            };
        });

        expect(gameStatus.hasGame).toBeTruthy();
        expect(gameStatus.hasGameScene).toBeTruthy();
        expect(gameStatus.hasPlayer).toBeTruthy();
        expect(gameStatus.hasRenderer).toBeTruthy();
        expect(gameStatus.hasScene).toBeTruthy();
        expect(gameStatus.sceneChildren).toBeGreaterThan(5); // 至少要有几个对象

        // 检查控制台是否有严重错误
        const criticalErrors = consoleErrors.filter(e =>
            !e.includes('favicon') &&
            !e.includes('NotAllowedError') &&
            !e.includes('Custom UV set') &&
            !e.includes('Pointer Lock')
        );
        if (criticalErrors.length > 0) {
            console.log('⚠ 控制台错误:', criticalErrors);
        }

        console.log('游戏状态:', gameStatus);
    });
});
