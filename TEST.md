# 3D 显示自动化测试文档

## 测试文件说明

```
test/
├── 3d-visual.test.js    # Playwright 自动化测试
├── basic.test.js        # 基础功能测试
├── model-loading.test.js # 模型加载验证
├── check-3d.js       # 浏览器控制台检查脚本
└── screenshots/      # 测试截图目录
playwright.config.js    # Playwright 配置（超时 90s）
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
| 3d-visual.test.js | 模型加载状态检查 | sceneExists/modelLoaderReady |
| 3d-visual.test.js | 场景对象数量检查 | Mesh > 5, Light > 0 |
| 3d-visual.test.js | 坦克模型显示检查 | player exists/health=100 |
| 3d-visual.test.js | WebGL 渲染状态检查 | hasContext/shadowMap |
| model-loading.test.js | 6个模型加载 | ground/ocean/rock/soldier/animal/tank |

## 模块化模型系统

### 模型配置（js/modelconfig.js）

```javascript
const ModelConfig = {
    paths: {
        ground: 'models/demo_map_tank_vs_tank.glb',
        ocean: 'models/low_poly_ocean.glb',
        rock: 'models/free_low_poly_style_rock_pack.glb',
        soldier: 'models/catfish_mech_low-poly_animated.glb',
        animal: 'models/toon_horse_with_saddle_rigged_animated.glb',
        tank: 'models/m1_abrams.glb'
    },
    scales: {
        ground: 2.0,
        ocean: 1.0,
        rock: 0.5,
        soldier: 0.8,
        animal: 0.15,
        tank: 1.0
    },
    collisionRadius: { rock: 1.5, building: 3, tree: 1.0 },
    animationKeywords: {
        soldier: ['walk', 'idle', 'run'],
        animal: ['walk', 'run', 'idle']
    }
};
```

### 模型文件

| 类型 | 模型文件 | 说明 |
|------|---------|------|
| 地面 | `demo_map_tank_vs_tank.glb` | 坦克对战地图 |
| 海洋 | `low_poly_ocean.glb` | 低多边形海洋 |
| 岩石 | `free_low_poly_style_rock_pack.glb` | 障碍物石头 |
| 士兵 | `catfish_mech_low-poly_animated.glb` | 机械人（有动画） |
| 动物 | `toon_horse_with_saddle_rigged_animated.glb` | 马（4种动画） |
| 坦克 | `m1_abrams.glb` | M1 Abrams 坦克 |

### 模型加载结果

```bash
ocean loaded (1/6)
rock loaded (2/6)
animal loaded (3/6)
ground loaded (4/6)
tank loaded (5/6)
soldier loaded (6/6)
All models loaded!

模型状态: {
  ground: true,
  ocean: true,
  rock: true,
  soldier: true,
  animal: true,
  tank: true,
  loaded: true
}
```

### 动画验证

```
animal animations: Walk, Trot, Gallop, Rest
士兵动画数: 1
```

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
- ✔ 6个模型加载状态
- ✔ 动画混合器状态
- ✔ 帧率正常（10-200 fps）

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

### 截图是黑的

原因：Playwright headless 模式 WebGL 限制

解决：用真实浏览器访问 http://localhost:8000 查看

### 动画不播放

原因：GLTF 模型没有动画数据

解决：使用带骨骼动画的模型

---

## 快速验证清单

- [x] `http://localhost:8000` 能正常打开游戏
- [x] F12 Console 看到模型加载日志
- [x] 执行 `check3DDisplay()` 无失败项
- [x] 6个模型全部加载成功
- [x] 动物有4种动画（Walk/Trot/Gallop/Rest）
- [x] 坦克/机械人/马模型显示正常

---

## 最新修复（2026-05）

1. **模块化重构**：
   - `modelconfig.js` - 集中管理模型配置
   - `modelloader.js` - 模块化加载器核心
   - `loader.js` - 兼容旧API

2. **地面位置修复**：
   - 根据模型包围盒自动调整y位置贴地

3. **模型文件更新**：
   - 坦克对战地图地形
   - 低多边形海洋
   - 障碍物石头
   - 机械人（有动画）
   - 马（4种动画）
   - M1 Abrams 坦克

4. **代码优化**：
   - 配置与加载分离
   - 保留旧API兼容
   - 统一错误处理