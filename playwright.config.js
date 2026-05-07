// Playwright 配置文件
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './test',
    timeout: 90000,
    retries: 1,
    use: {
        headless: true,
        viewport: { width: 1280, height: 720 },
        screenshot: 'only-on-failure',
        video: 'retain-on-failure'
    },
    webServer: {
        command: 'python -m http.server 8000',
        url: 'http://localhost:8000',
        reuseExistingServer: true,
        timeout: 20000
    }
});
