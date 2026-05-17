# 英语坦克大战 - English Tank Battle

一款基于 Three.js 的 3D 海边坦克射击游戏，融合英语单词学习。玩家通过击中显示正确英文单词的目标来学习中英对照词汇。

## 运行方式

### 方法1：本地服务器（推荐）

双击 `启动游戏.bat`，然后在浏览器访问 `http://localhost:8000`

### 方法2：直接打开 HTML

由于浏览器安全限制，直接双击 `index.html` 无法加载 3D 模型。必须使用本地 HTTP 服务器。

## 3D 模型配置

游戏使用模块化模型系统，配置文件位于 `js/modelconfig.js`。

### 模型列表

| 类型 | 模型文件 | 说明 |
|------|---------|------|
| 地面 | `demo_map_tank_vs_tank.glb` | 坦克对战地图地形 |
| 海洋 | `low_poly_ocean.glb` | 低多边形海洋 |
| 岩石 | `free_low_poly_style_rock_pack.glb` | 障碍物石头 |
| 士兵 | `soldier.glb` | 士兵模型 |
| 动物 | `toon_horse_with_saddle_rigged_animated.glb` | 马（有4种动画） |
| 坦克 | `m1_abrams.glb` | M1 Abrams 坦克 |

### 模型下载

**士兵模型来源 (Sketchfab)**:
- https://sketchfab.com/3d-models/stylized-sci-fi-soldier-animated-9e19e517429c4077b800273890186456
- 作者: Jungle Jim (CC Attribution)
- 下载后重命名为 `soldier.glb` 放入 `models/` 目录

**掩体模型来源 (Sketchfab)**:
- Vietnam War Bunker Small: https://sketchfab.com/3d-models/vietnam-war-base-camp-bunker-small-fad2adfb9f874a2684bdf1de95b3dfe3
- 作者: Kevin S. Tran (CC Attribution)
- 下载后重命名为 `bunker.glb` 放入 `models/` 目录

**友军士兵模型来源 (Sketchfab)**:
- WW2 Allied Soldier: https://sketchfab.com/3d-models/ww2-allied-soldier-low-poly-character-army-70d84d8794074d09aeaebe7d053f2dfa
- 作者: Zack (CC Attribution)
- 下载后重命名为 `soldier_friendly.glb` 放入 `models/` 目录

**敌军士兵模型来源 (Sketchfab)**:
- Stylized Sci-Fi Soldier: https://sketchfab.com/3d-models/stylized-sci-fi-soldier-animated-9e19e517429c4077b800273890186456
- 作者: Jungle Jim (CC Attribution)
- 下载后重命名为 `soldier_enemy.glb` 放入 `models/` 目录

**备选士兵模型**（14个动画，Public domain，但实际无内置动画）：
- https://www.getglb.com/characters/character-soldier/
- 下载链接: https://www.get3dmodels.com/download/Character-Soldier.glb
- 1.27MB，21.4k顶点，Public domain

### 坦克模型方向绑定规则

**核心原则：所有方向必须统一绑定到炮管朝向。**

m1_abrams.glb 模型的炮管指向 **-X 方向**，因此：

| 方向 | 向量 | 说明 |
|------|------|------|
| 炮口方向 | `(-1, 0, 0)` | 子弹发射方向 |
| 炮口位置 | `(-1, 0, 0) * 炮管长度` | 子弹出生点 |
| 前进方向 | `(-1, 0, 0)` 经坦克旋转四元数变换 | WASD 移动 |
| 后退方向 | `(+1, 0, 0)` 经坦克旋转四元数变换 | S 键移动 |

**如果换模型，必须先确认新模型的炮管指向，再统一修改以下所有位置：**

#### `js/tank.js`
```javascript
getBarrelTip()    → barrelLocalDir = new THREE.Vector3(-1, 0, 0)
getBarrelDirection() → barrelLocalDir = new THREE.Vector3(-1, 0, 0)
```
- `getBarrelDirection()` 返回 `barrelLocalDir.clone().applyQuaternion(this.group.quaternion)`
- `getBarrelTip()` 返回 `barrelLocalDir.clone().multiplyScalar(length).add(炮管根部世界位置)`

#### `js/main.js`
```javascript
// WASD 移动（三处）
const forwardDir = new THREE.Vector3(-1, 0, 0).applyQuaternion(this.player.group.quaternion);
// S键后退
const backDir = new THREE.Vector3(1, 0, 0).applyQuaternion(this.player.group.quaternion);
// 子弹方向
const dir = this.player.getBarrelDirection();
```

#### `js/bullet.js`
```javascript
// 子弹飞行方向来自坦克的 getBarrelDirection()
this.velocity = dir.clone().multiplyScalar(speed);
```

**约定**:
- 模型本身的 rotation 不可修改（保持 GLTF 原始朝向）
- 所有方向偏差通过代码中的方向向量统一修正
- A 键左转（+Y 旋转），D 键右转（-Y 旋转）

### 修改模型

1. 下载模型到 `models/` 目录
2. 修改 `js/modelconfig.js` 中的路径和参数
3. 修改 `js/scene.js` 中的缩放比例

```javascript
// js/modelconfig.js
const ModelConfig = {
    paths: {
        ground: 'models/你的地面.glb',
        // ...
    },
    scales: {
        ground: 2.0,
        // ...
    }
};
```

## 游戏玩法

- 玩家坦克上方显示中文和音标，周围所有目标上显示英文单词
- 找到并击中与坦克上中文对应的英文单词目标即可得分
- 正确目标脚下有绿色光环和箭头指示，方便定位
- 击中正确目标：酷炫加分效果（+100分）+ 标准美式发音朗读
- 击中错误目标：红色错误提示
- 击中正确目标后自动从视野内最近目标选取下一个单词
- 弹药无限，10 分钟限时挑战

## 视觉升级 (2026) - 逼真效果

### 天空系统
- **HDR 环境贴图**：使用 `venice_1k.hdr` 创建逼真天空和环境光
- **动态光照**：HDR 环境自动计算太阳方向和强度
- **降级方案**：HDR 加载失败时自动使用程序化渐变天空

### 海洋系统
- **Three.js Water 着色器**：使用 `Water.js` 实现逼真水面
- **波浪效果**：双层法线贴图滚动，可调节波浪大小
- **海岸泡沫**：白色泡沫带模拟海浪拍岸效果
- **水纹法线贴图**：`waternormals.jpg` 提供细节波浪

### 陆地系统
- **GLTF 地面模型**：优先使用自定义地形模型
- **PBR 材质**：金属度/粗糙度/环境光反射
- **各向异性过滤**：`anisotropy = max` 确保纹理清晰
- **位置自动调整**：根据模型包围盒自动贴地

### 坦克系统
- **M1 Abrams 主战坦克**：PBR 材质
- **履带动画**：实时更新履带滚动效果
- **加载超时保护**：10秒超时防止无限等待

## 技术改进

### 模块化代码

```
js/
├── modelconfig.js    # 模型配置（路径、缩放、碰撞参数）
├── modelloader.js  # 模块化加载器核心
├── loader.js     # 兼容旧API
├── scene.js     # 3D场景
├── tank.js     # 坦克类
├── soldier.js  # 士兵机械人类
├── animal.js  # 动物类
└── main.js   # 游戏主循环
```

### 动画支持

- 士兵机械人：带骨骼绑定的行走动画
- 动物马：4种动画（Walk, Trot, Gallop, Rest）
- 坦克：履带滚动动画

### 代码修复（2026-05）

1. **黑屏修复**：所有 init 函数添加 try-catch
2. **模型位置调整**：根据包围盒自动调整y位置贴地
3. **模块化重构**：配置与加载分离
4. **兼容性**：保留旧API接口

### Soldier 模型加载机制

1. **加载方式**：每个 Soldier 实例直接使用 GLTFLoader 加载模型（不经过 ModelLoader 共享缓存）
2. **协议分支**：
   - `http://` → 异步加载 GLTF 模型到 group
   - `file://` → 直接使用 buildPrimitiveModel() 程序化生成
3. **必备方法**：SoldierManager 必须包含以下方法，否则 main.js 会报错：
   - `getPlayerSoldiers()` → 存活友军数组
   - `getEnemySoldiers()` → 存活敌军数组
   - `update(dt)` → 更新所有 soldier AI
   - `clear()` → 清理场景
4. **Soldier 类必备方法**：
   - `buildModel()` / `loadGLTFModel()` / `buildPrimitiveModel()`
   - `takeDamage(amount)` → 扣血、死亡标记
   - `updateAI(dt)` → AI 巡逻 + 自动索敌射击
   - `createLetterLabel()` / `drawLetterLabel()`（仅敌军显示单词）
5. **路径**：
   - 友军: `models/soldier_friendly.glb`
   - 敌军: `models/soldier_enemy.glb`
6. **动画支持**：
   - 当前 `soldier_friendly.glb` 和 `soldier_enemy.glb` 均无骨骼动画数据（`animations:[]`）
   - 已实现程序化行走动画作为降级方案（正弦波上下颠簸 + 左右摇摆，v11）
   - 如需真骨骼动画，可按以下步骤操作：
     1. 下载纯骨骼模型（如 Sketchfab 搜索 "German Bundeswehr soldier rigged"）
     2. 上传 https://www.mixamo.com 自动绑骨
     3. 选 Walk / Idle 动画 → 下载 FBX With Skin
     4. 用 https://anyconv.com/fbx-to-glb-converter/ 转 GLB
     5. 替换 `models/` 目录对应文件
7. **Soldier 战斗参数**：
   - 索敌范围：80m
   - 射击冷却：1.5 - 2.5 秒（随机）
   - 伤害：30
   - 生命值：30
   - 友军攻击敌军，敌军优先攻击玩家（50m内），其次攻击友军
8. **Soldier 子弹系统**（`js/bullet-soldier.js`）：
   - 与坦克子弹完全分离，避免干扰
   - 使用 Sprite 发光纹理实现可视弹丸（黄色，0.3单位大小）
   - 速度 100m/s，寿命 2.5 秒
   - 无特效（无辉光、灯光、拖尾）
   - 碰撞检测复用坦克碰撞逻辑，通过 `isPlayerTeam` 标记区分阵营
9. **调试**：
   - `test-model.html` 可独立测试 Soldier 类加载
   - `test-soldier-fire.html` 可独立测试 Soldier 射击和行走动画

## 操作说明

| 按键 | 功能 |
|------|------|
| W | 前进 |
| S | 后退 |
| A | 左转 |
| D | 右转 |
| 鼠标移动 | 旋转视角（自动锁定鼠标） |
| 左键 / 空格 | 发射炮弹 |
| 右键 / R | 瞄准镜模式（放大视野，可旋转） |

**移动说明**: A/D 控制坦克旋转，W/S 控制前进后退，车身与炮管始终朝向前进方向。

## 游戏特性

- 3D 场景：沙滩地面、动态海洋波浪、棕榈树、岩石、海滩小屋
- 海上船只：帆船随波浪摇晃，可被击中摧毁
- 多种敌人：坦克（AI 巡逻/追击）、士兵、飞机、野生动物（鹿/野猪）
- 全部可击毁：所有显示单词的目标均可被炮弹摧毁
- 英语学习：71 个小学英语单词（含国际音标）
- 标准发音：使用有道词典 TTS 接口，美式标准发音
- 智能目标分配：正确单词强制写入最近可见目标，标签实时更新
- 视觉引导：绿色光环 + 箭头标记正确目标位置
- 弹药无限，10 分钟倒计时（最后 60 秒红色闪烁警告）

## 技术栈

- Three.js r128（3D 渲染）
- Three.js Water 着色器（海洋效果）
- RGBELoader（HDR 环境贴图）
- GLTFLoader（3D 模型加载）
- AnimationMixer（骨骼动画）
- 纯 JavaScript（无框架依赖）
- Canvas 2D（纹理生成、动态标签）
- Web Audio API（音效）
- 有道词典 TTS（单词发音）

## 文件结构

```
├── index.html          # 入口页面
├── css/style.css     # UI 样式
├── js/
│   ├── three.min.js    # Three.js 核心
│   ├── RGBELoader.js   # HDR 贴图加载器
│   ├── Water.js        # 海洋着色器
│   ├── GLTFLoader.js   # GLTF 模型加载器
│   ├── modelconfig.js   # 模型配置
│   ├── modelloader.js  # 模块化加载器
│   ├── words.js        # 单词库（含音标）+ WordManager
│   ├── scene.js       # 3D 场景、海洋、建筑、HDR 天空
│   ├── tank.js        # 坦克类 + AI
│   ├── soldier.js     # 士兵类（机械人动画）
│   ├── animal.js     # 动物类（马动画）
│   ├── aircraft.js   # 飞机类
│   ├── bullet.js    # 子弹类
│   ├── explosion.js # 爆炸效果
│   ├── muzzleflash.js # 炮口火焰特效
│   ├── audio.js   # Web Audio 音效系统
│   ├── pickup.js  # 弹药补给
│   ├── spell.js  # 单词匹配系统（中英对照）
│   ├── input.js  # 输入管理（Pointer Lock）
│   ├── ui.js    # HUD 界面 + 得分/错误反馈
│   ├── loader.js # GLTF 模型加载器（兼容旧API）
│   ├── tankmodel.js # 坦克 GLTF 模型加载
│   └── main.js  # 游戏主循环
├── models/            # GLTF 3D 模型（.glb）
├── textures/          # 纹理贴图（HDR、法线贴图）
└── test/             # Playwright 自动化测试
```

## 自动化测试

项目包含 Playwright 自动化测试，验证 3D 场景和模型加载。

### 运行测试

```bash
# 安装依赖
npm install

# 启动本地服务（新终端）
python -m http.server 8000

# 运行测试
npm test
```

### 注意

Playwright headless 模式下 WebGL 可能有渲染限制。如果测试显示黑屏但控制台显示模型加载成功，请用真实浏览器打开 http://localhost:8000 验证。

### 测试结果

- ✅ 页面正常打开
- ✅ Three.js 已加载
- ✅ 游戏场景创建成功
- ✅ 玩家坦克生成
- ✅ 6个模型加载成功
- ✅ 场景对象数量检查
- ✅ 坦克模型显示检查
- ✅ WebGL 渲染状态检查
- ✅ 4种动物动画加载

## 部署

纯静态项目，可直接部署到 GitHub Pages：

1. 创建 GitHub 仓库并推送代码
2. 进入仓库 Settings → Pages
3. Source 选择 main 分支，保存即可

也可直接用浏览器打开 `index.html` 本地运行。