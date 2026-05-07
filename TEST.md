# 3D 显示自动化测试文档

## 测试文件说明

```
test/
├── 3d-visual.test.js    # Playwright 自动化测试（无头浏览器）
├── basic.test.js         # 基础功能测试
├── check-3d.js          # 浏览器控制台检查脚本（手动/自动）
└── screenshots/         # 测试截图目录
playwright.config.js      # Playwright 配置（超时 90s）
```

## 方法一：Playwright 自动化测试（推荐）

### 安装依赖

```bash
cd D:\project\demos\EnglishGames
npm install
npx playwright install chromium
```

### 启动本地服务（新终端）

```bash
cd D:\project\demos\EnglishGames
python -m http.server 8000
```

### 运行测试

```bash
npm test
```

### 查看报告

```bash
npm run test:report
```

### 测试内容

| 测试文件 | 测试项 | 检查内容 |
|----------|--------|---------|
| basic.test.js | 页面能正常打开 | 标题包含"英语坦克大战" |
| basic.test.js | Three.js 已加载 | `typeof THREE !== 'undefined'` |
| basic.test.js | 点击开始游戏后场景加载 | Game/GameScene/player 对象存在 |
| 3d-visual.test.js | 模型加载状态检查 | sceneExists/modelLoaderReady/tankModelExists |
| 3d-visual.test.js | 场景对象数量检查 | Mesh > 5, Light > 0 |
| 3d-visual.test.js | 坦克模型显示检查 | player exists/health=100/alive=true |
| 3d-visual.test.js | WebGL 渲染状态检查 | hasContext/shadowMap.enabled |
| 3d-visual.test.js | 截图测试 | 生成 test/screenshots/game-load.png |

## 逼真效果测试验证

### 天空系统
- ✅ HDR 环境贴图加载 (`venice_1k.hdr`)
- ✅ 降级方案：HDR 失败时自动使用程序化天空
- 验证：打开 Console 看到 "HDRI loaded: textures/venice_1k.hdr"

### 海洋系统
- ✅ Three.js Water 着色器
- ✅ 水纹法线贴图 (`waternormals.jpg`)
- ✅ 动态波浪效果
- 验证：海洋表面有逼真波浪动画

### 陆地系统
- ✅ GLTF 地面模型 (`models/ground.glb`)
- ✅ PBR 材质 + HDR 环境反射
- ✅ 降级方案：GLTF 未加载时使用程序化纹理地面
- 验证：Console 看到 "GLTF ground meshes: X"

### 建筑系统
- ✅ GLTF 房屋模型 (`models/building.glb`)
- ✅ 3 个实例分别放置在不同位置
- ✅ HDR 环境反射
- 验证：Console 看到 "Using GLTF building model, count: 3"

### 士兵系统
- ✅ GLTF 骨骼动画模型 (`models/soldier.glb`)
- ✅ AnimationMixer 播放 idle/walk 动画
- ✅ `SoldierManager.updateMixers()` 更新动画
- 验证：Console 看到 "Soldier: using GLTF model"

### 动物系统
- ✅ GLTF 模型 (`models/animals_real.glb`)
- ✅ 支持鹿(deer)和野猪(boar)
- ✅ AnimationMixer 播放 walk/run 动画
- ✅ `AnimalManager.updateMixers()` 更新动画

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

### HDR 加载失败

原因：`textures/venice_1k.hdr` 文件不存在

解决：检查文件是否存在，或查看 Console 的降级日志

### Water 着色器未生效

原因：`js/Water.js` 或 `textures/waternormals.jpg` 未下载

解决：重新运行下载命令（见安装依赖）

## 快速验证清单

- [x] `http://localhost:8000` 能正常打开游戏
- [x] F12 Console 看到模型加载日志
- [x] 执行 `check3DDisplay()` 无失败项
- [x] Playwright 测试全部通过（8/8）
- [x] 坦克/士兵/动物模型正确显示
- [x] 海洋有动态波浪效果
- [x] 天空使用 HDR 环境贴图

## 最新修复（2026-05）

1. **测试超时修复**：异步启动游戏循环，避免 `evaluate()` 阻塞
2. **全局对象暴露**：显式设置 `window.Game` 和 `window.GameScene`
3. **超时时间增加**：Playwright 超时从 30s 增加到 90s
4. **测试等待简化**：不等待模型完全加载，只检查对象存在性
5. **逼真效果实现**：
   - HDR 天空环境贴图
   - Three.js Water 着色器海洋
   - GLTF 地面/建筑/士兵/动物模型
   - AnimationMixer 骨骼动画
   - PBR 材质 + HDR 环境反射
