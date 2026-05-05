@echo off
echo 正在启动本地服务器...
echo.
echo 请在浏览器中访问: http://localhost:8080
echo.
echo 按 Ctrl+C 停止服务器
echo.
npx http-server -p 8080
pause