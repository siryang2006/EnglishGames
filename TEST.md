# 3D 显示自动化测试文档

## 测试文件说明

```
test/
├── 3d-visual.test.js    # Playwright 自动化测试（无头浏览器）
└── check-3d.js          # 浏览器控制台检查脚本（手动/自动）
playwright.config.js      # Playwright 配置
```

## 方法一：Playwright 自动化测试（推荐）

### 安装依赖

```bash
cd D:\project\demos\EnglishGames
npm init -y
npm install -D @playwright/test
npx playwright install chromium
```

### 启动本地服务（新终端）

```bash
cd D:\project\demos\EnglishGames
python -m http.server 8000
```

### 运行测试

```bash
npx playwright test 3d-visual.test.js
```

### 查看报告

```bash
npx playwright show-report
```

### 测试内容

| 测试项 | 检查内容 |
|--------|---------|
| 模型加载日志 | Tank model loaded, All models loaded 等 |
| 场景对象数量 | Mesh > 10, Light > 0 |
| 坦克模型显示 | 存活、位置有效、GLTF/程序模型 |
| WebGL 渲染状态 | 上下文、阴影、色调映射 |
| 截图对比 | 生成 test/screenshots/game-load.png |

---

## 方法二：浏览器控制台检查

### 自动运行（已注入）

打开 `http://localhost:8000`，等待 1 秒后自动在 Console 输出检查结果。

### 手动运行

按 F12 打开控制台，输入：

```js
check3DDisplay()
```

### 检查内容

- ✔ Three.js 已加载
- ✔ WebGL 支持
- ✔ 场景包含 Mesh 和光源
- ✔ 玩家坦克存在且存活
- ✔ 敌人坦克已生成
- ✔ 士兵/动物模型加载状态
- ✔ ModelLoader 加载状态
- ✔ 帧率正常（10-200 fps）

---

## 预期输出示例

```
=== 3D 显示检查开始 ===
✔ Three.js 已加载
✔ WebGL 支持
✔ 场景已创建
✔ 场景包含 Mesh
✔ 场景包含光源
   场景对象: 45 meshes, 3 lights
✔ 渲染器已创建
✔ WebGL 上下文正常
✔ 阴影开启
✔ 玩家坦克存在
✔ 玩家坦克存活
✔ 坦克位置有效
✔ 坦克有 GLTF 模型或程序模型
   坦克位置: (0.0, 0.0)
✔ 敌人坦克已生成
✔ 有存活的敌人
   敌人: 5/5 存活
✔ 士兵模型已加载
✔ 士兵使用 GLTF
✔ 士兵有动画 Mixer
   士兵数量: 3
✔ 动物模型已加载
✔ 动物有动画 Mixer
   动物数量: 4
✔ ModelLoader 已加载
✔ 地面模型
✔ 士兵模型
✔ 动物模型
   士兵动画数: 3

=== 检查结果 ===
通过: 15, 失败: 0
✔ 所有检查通过！
```

---

## 故障排查

### 模型未加载（看到 "using procedural model"）

原因：使用了 `file://` 协议打开 HTML

解决：用 HTTP 服务打开
```bash
python -m http.server 8000
# 访问 http://localhost:8000
```

### Playwright 测试失败（连接拒绝）

原因：本地服务未启动

解决：确保 `python -m http.server 8000` 正在运行

### 动画不播放

原因：GLTF 模型没有动画数据

解决：使用 Mixamo 下载带骨骼动画的模型（idle/walk/run）

---

## 快速验证清单

- [ ] `http://localhost:8000` 能正常打开游戏
- [ ] F12 Console 看到模型加载日志
- [ ] 执行 `check3DDisplay()` 无失败项
- [ ] Playwright 测试全部通过
- [ ] 坦克/士兵/动物模型正确显示
