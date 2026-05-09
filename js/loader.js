// 模型加载器 - 调用modelloader
// ModelLoader已在modelloader.js中定义并暴露到window
// 此文件提供额外的便利方法

if (typeof ModelLoader !== 'undefined') {
    // 额外的方法可以在这里添加
    window.ModelLoader.getRock = function() {
        return ModelLoader.getModel('rock');
    };
}