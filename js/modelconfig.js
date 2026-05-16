// 模型配置 - 集中管理所有3D模型路径和参数
const ModelConfig = {
    // 模型文件路径
    paths: {
        // All models disabled
        // ground: 'models/demo_map_tank_vs_tank.glb',
        // ocean: 'models/low_poly_ocean.glb',
        // rock: 'models/free_low_poly_style_rock_pack.glb',
        // soldier: 'models/catfish_mech_low-poly_animated.glb',
        // animal: 'models/toon_horse_with_saddle_rigged_animated.glb',
        // tank: 'models/m1_abrams.glb'
    },
    
    // 模型缩放比例
    scales: {
        ground: 2.0,
        ocean: 1.0,
        rock: 0.5,
        soldier: 0.8,
        animal: 0.15,
        tank: 1.0
    },
    
    // 碰撞半径
    collisionRadius: {
        rock: 1.5,
        building: 3,
        tree: 1.0
    },
    
    // 动画名称关键字（用于查找动画）
    animationKeywords: {
        soldier: ['walk', 'idle', 'run'],
        animal: ['walk', 'run', 'idle']
    }
};

window.ModelConfig = ModelConfig;