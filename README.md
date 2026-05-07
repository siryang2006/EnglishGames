# 英语坦克大战 - English Tank Battle

一款基于 Three.js 的 3D 海边坦克射击游戏，融合英语单词学习。玩家通过击中显示正确英文单词的目标来学习中英对照词汇。

## 运行方式

### 方法1：本地服务器（推荐）

双击 `启动游戏.bat`，然后在浏览器访问 `http://localhost:8000`

### 方法2：直接打开 HTML

由于浏览器安全限制，直接双击 `index.html` 无法加载 3D 模型。必须使用本地 HTTP 服务器。

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
- **GLTF 地面模型**：优先使用 `models/ground.glb`（159MB 高精度地形）
- **PBR 材质**：金属度/粗糙度/环境光反射
- **降级方案**：GLTF 未加载时使用程序化纹理地面

### 建筑系统
- **GLTF 房屋模型**：使用 `models/building.glb`（4.5MB）
- **多实例支持**：在 3 个不同位置实例化 3 个房屋
- **HDR 环境反射**：建筑表面反射周围环境光

### 士兵系统
- **GLTF 骨骼动画**：使用 `models/soldier.glb`（18MB）
- **动画混合器**：支持 idle/walk/run 动画切换
- **动画更新**：`SoldierManager.updateMixers()` 实时更新动画
- **阵营区分**：友军（绿色头盔）和敌军（红色头盔）

### 动物系统
- **GLTF 模型**：使用 `models/animals_real.glb`（72MB）
- **多类型支持**：鹿（deer）和野猪（boar）
- **动画混合器**：支持 walk/run/idle 动画
- **动画更新**：`AnimalManager.updateMixers()` 实时更新

### 坦克系统
- **M1A2 Abrams 主战坦克**：`models/abrams_player.glb`（33MB，315k 三角形）
- **PBR 材质**：金属度/粗糙度/环境光反射
- **履带动画**：实时更新履带滚动效果

## 技术改进

- **HDR 环境光照**：使用 `RGBELoader` 加载 `.hdr` 贴图
- **Water 着色器**：逼真海洋波浪和反射效果
- **GLTF 动画系统**：`AnimationMixer` 播放骨骼动画
- **环境光反射**：所有 PBR 材质使用 HDR 环境贴图
- **异步模型加载**：所有 GLTF 模型异步加载，不阻塞游戏启动

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
├── css/style.css       # UI 样式
├── js/
│   ├── three.min.js    # Three.js 核心
│   ├── RGBELoader.js   # HDR 贴图加载器
│   ├── Water.js        # 海洋着色器
│   ├── GLTFLoader.js   # GLTF 模型加载器
│   ├── words.js        # 单词库（含音标）+ WordManager
│   ├── scene.js       # 3D 场景、海洋、建筑、HDR 天空
│   ├── tank.js        # 坦克类 + AI
│   ├── soldier.js     # 士兵类（GLTF 动画）
│   ├── animal.js      # 动物类（GLTF 动画）
│   ├── aircraft.js    # 飞机类
│   ├── bullet.js      # 子弹类
│   ├── explosion.js  # 爆炸效果
│   ├── muzzleflash.js # 炮口火焰特效
│   ├── audio.js      # Web Audio 音效系统
│   ├── pickup.js     # 弹药补给
│   ├── spell.js      # 单词匹配系统（中英对照）
│   ├── input.js      # 输入管理（Pointer Lock）
│   ├── ui.js         # HUD 界面 + 得分/错误反馈
│   ├── loader.js      # GLTF 模型加载器（地面/建筑/士兵/动物）
│   ├── tankmodel.js   # 坦克 GLTF 模型加载
│   └── main.js       # 游戏主循环
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

# 查看报告
npm run test:report
```

### 测试结果

- ✅ 页面正常打开
- ✅ Three.js 已加载
- ✅ 游戏场景创建成功
- ✅ 玩家坦克生成
- ✅ 模型加载状态检查
- ✅ 场景对象数量检查（Mesh > 5, Light > 0）
- ✅ 坦克模型显示检查
- ✅ WebGL 渲染状态检查
- ✅ 截图测试

## 部署

纯静态项目，可直接部署到 GitHub Pages：

1. 创建 GitHub 仓库并推送代码
2. 进入仓库 Settings → Pages
3. Source 选择 main 分支，保存即可

也可直接用浏览器打开 `index.html` 本地运行。
