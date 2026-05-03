const WORD_BANK = [
    // Unit 1 - My classroom
    { en: "classroom", cn: "教室" },
    { en: "window", cn: "窗户" },
    { en: "door", cn: "门" },
    { en: "picture", cn: "图画" },
    { en: "blackboard", cn: "黑板" },
    { en: "light", cn: "灯" },
    { en: "schoolbag", cn: "书包" },
    { en: "teacher's desk", cn: "讲台" },
    { en: "computer", cn: "电脑" },
    { en: "fan", cn: "风扇" },
    { en: "wall", cn: "墙壁" },
    { en: "floor", cn: "地板" },
    { en: "really", cn: "真的" },
    { en: "near", cn: "在...旁边" },
    { en: "clean", cn: "打扫;干净的" },
    { en: "help", cn: "帮助" },
    { en: "where", cn: "在哪里" },
    { en: "in", cn: "在...里面" },
    { en: "on", cn: "在...上面" },
    { en: "under", cn: "在...下面" },
    { en: "open", cn: "打开" },
    { en: "close", cn: "关上" },
    { en: "turn on", cn: "打开(电器)" },
    { en: "put", cn: "放" },
    // Unit 2 - My schoolbag
    { en: "Chinese book", cn: "语文书" },
    { en: "English book", cn: "英语书" },
    { en: "maths book", cn: "数学书" },
    { en: "storybook", cn: "故事书" },
    { en: "notebook", cn: "笔记本" },
    { en: "candy", cn: "糖果" },
    { en: "key", cn: "钥匙" },
    { en: "toy", cn: "玩具" },
    { en: "lost", cn: "丢失" },
    { en: "so much", cn: "非常" },
    { en: "cute", cn: "可爱的" },
    { en: "pencil", cn: "铅笔" },
    { en: "pen", cn: "钢笔" },
    { en: "ruler", cn: "尺子" },
    { en: "eraser", cn: "橡皮" },
    { en: "crayon", cn: "蜡笔" },
    { en: "bag", cn: "包" },
    { en: "book", cn: "书" },
    { en: "new", cn: "新的" },
    { en: "what", cn: "什么" },
    { en: "colour", cn: "颜色" },
    // Unit 3 - My friends
    { en: "strong", cn: "强壮的" },
    { en: "friendly", cn: "友好的" },
    { en: "quiet", cn: "安静的" },
    { en: "hair", cn: "头发" },
    { en: "shoe", cn: "鞋" },
    { en: "glasses", cn: "眼镜" },
    { en: "his", cn: "他的" },
    { en: "her", cn: "她的" },
    { en: "right", cn: "正确的" },
    { en: "hat", cn: "帽子" },
    { en: "tall", cn: "高的" },
    { en: "short", cn: "矮的;短的" },
    { en: "thin", cn: "瘦的" },
    { en: "boy", cn: "男孩" },
    { en: "girl", cn: "女孩" },
    { en: "friend", cn: "朋友" },
    { en: "name", cn: "名字" },
    { en: "or", cn: "或者" },
    { en: "long", cn: "长的" },
    { en: "big", cn: "大的" },
    { en: "small", cn: "小的" },
    { en: "blue", cn: "蓝色的" },
    { en: "green", cn: "绿色的" },
    { en: "red", cn: "红色的" },
    { en: "yellow", cn: "黄色的" },
    { en: "white", cn: "白色的" },
    { en: "black", cn: "黑色的" },
    { en: "orange", cn: "橙色的" },
    { en: "brown", cn: "棕色的" },
    { en: "nose", cn: "鼻子" },
    { en: "mouth", cn: "嘴巴" },
    { en: "eye", cn: "眼睛" },
    { en: "ear", cn: "耳朵" },
    { en: "face", cn: "脸" },
    { en: "hand", cn: "手" },
    { en: "head", cn: "头" },
    { en: "body", cn: "身体" },
    { en: "arm", cn: "手臂" },
    { en: "leg", cn: "腿" },
    { en: "foot", cn: "脚" }
];

const WordManager = {
    usedIndices: new Set(),

    getRandomWord() {
        if (this.usedIndices.size >= WORD_BANK.length) {
            this.usedIndices.clear();
        }
        let idx;
        do {
            idx = Math.floor(Math.random() * WORD_BANK.length);
        } while (this.usedIndices.has(idx));
        this.usedIndices.add(idx);
        return WORD_BANK[idx];
    },

    reset() {
        this.usedIndices.clear();
    }
};
