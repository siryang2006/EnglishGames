const WORD_BANK = [
    // Unit 1 - My classroom
    { en: "classroom", cn: "教室", ph: "/ˈklɑːsruːm/" },
    { en: "window", cn: "窗户", ph: "/ˈwɪndoʊ/" },
    { en: "door", cn: "门", ph: "/dɔːr/" },
    { en: "picture", cn: "图画", ph: "/ˈpɪktʃər/" },
    { en: "blackboard", cn: "黑板", ph: "/ˈblækbɔːrd/" },
    { en: "light", cn: "灯", ph: "/laɪt/" },
    { en: "schoolbag", cn: "书包", ph: "/ˈskuːlbæɡ/" },
    { en: "computer", cn: "电脑", ph: "/kəmˈpjuːtər/" },
    { en: "fan", cn: "风扇", ph: "/fæn/" },
    { en: "wall", cn: "墙壁", ph: "/wɔːl/" },
    { en: "floor", cn: "地板", ph: "/flɔːr/" },
    { en: "really", cn: "真的", ph: "/ˈriːəli/" },
    { en: "near", cn: "在...旁边", ph: "/nɪr/" },
    { en: "clean", cn: "打扫", ph: "/kliːn/" },
    { en: "help", cn: "帮助", ph: "/help/" },
    { en: "where", cn: "在哪里", ph: "/wer/" },
    { en: "open", cn: "打开", ph: "/ˈoʊpən/" },
    { en: "close", cn: "关上", ph: "/kloʊz/" },
    { en: "put", cn: "放", ph: "/pʊt/" },
    // Unit 2 - My schoolbag
    { en: "storybook", cn: "故事书", ph: "/ˈstɔːribʊk/" },
    { en: "notebook", cn: "笔记本", ph: "/ˈnoʊtbʊk/" },
    { en: "candy", cn: "糖果", ph: "/ˈkændi/" },
    { en: "key", cn: "钥匙", ph: "/kiː/" },
    { en: "toy", cn: "玩具", ph: "/tɔɪ/" },
    { en: "lost", cn: "丢失", ph: "/lɔːst/" },
    { en: "cute", cn: "可爱的", ph: "/kjuːt/" },
    { en: "pencil", cn: "铅笔", ph: "/ˈpensl/" },
    { en: "pen", cn: "钢笔", ph: "/pen/" },
    { en: "ruler", cn: "尺子", ph: "/ˈruːlər/" },
    { en: "eraser", cn: "橡皮", ph: "/ɪˈreɪsər/" },
    { en: "crayon", cn: "蜡笔", ph: "/ˈkreɪɑːn/" },
    { en: "bag", cn: "包", ph: "/bæɡ/" },
    { en: "book", cn: "书", ph: "/bʊk/" },
    { en: "colour", cn: "颜色", ph: "/ˈkʌlər/" },
    // Unit 3 - My friends
    { en: "strong", cn: "强壮的", ph: "/strɔːŋ/" },
    { en: "friendly", cn: "友好的", ph: "/ˈfrendli/" },
    { en: "quiet", cn: "安静的", ph: "/ˈkwaɪət/" },
    { en: "hair", cn: "头发", ph: "/her/" },
    { en: "shoe", cn: "鞋", ph: "/ʃuː/" },
    { en: "glasses", cn: "眼镜", ph: "/ˈɡlæsɪz/" },
    { en: "right", cn: "正确的", ph: "/raɪt/" },
    { en: "hat", cn: "帽子", ph: "/hæt/" },
    { en: "tall", cn: "高的", ph: "/tɔːl/" },
    { en: "short", cn: "矮的", ph: "/ʃɔːrt/" },
    { en: "thin", cn: "瘦的", ph: "/θɪn/" },
    { en: "boy", cn: "男孩", ph: "/bɔɪ/" },
    { en: "girl", cn: "女孩", ph: "/ɡɜːrl/" },
    { en: "friend", cn: "朋友", ph: "/frend/" },
    { en: "name", cn: "名字", ph: "/neɪm/" },
    { en: "long", cn: "长的", ph: "/lɔːŋ/" },
    { en: "big", cn: "大的", ph: "/bɪɡ/" },
    { en: "small", cn: "小的", ph: "/smɔːl/" },
    { en: "blue", cn: "蓝色的", ph: "/bluː/" },
    { en: "green", cn: "绿色的", ph: "/ɡriːn/" },
    { en: "red", cn: "红色的", ph: "/red/" },
    { en: "yellow", cn: "黄色的", ph: "/ˈjeloʊ/" },
    { en: "white", cn: "白色的", ph: "/waɪt/" },
    { en: "black", cn: "黑色的", ph: "/blæk/" },
    { en: "orange", cn: "橙色的", ph: "/ˈɔːrɪndʒ/" },
    { en: "brown", cn: "棕色的", ph: "/braʊn/" },
    { en: "nose", cn: "鼻子", ph: "/noʊz/" },
    { en: "mouth", cn: "嘴巴", ph: "/maʊθ/" },
    { en: "eye", cn: "眼睛", ph: "/aɪ/" },
    { en: "ear", cn: "耳朵", ph: "/ɪr/" },
    { en: "face", cn: "脸", ph: "/feɪs/" },
    { en: "hand", cn: "手", ph: "/hænd/" },
    { en: "head", cn: "头", ph: "/hed/" },
    { en: "body", cn: "身体", ph: "/ˈbɑːdi/" },
    { en: "arm", cn: "手臂", ph: "/ɑːrm/" },
    { en: "leg", cn: "腿", ph: "/leɡ/" },
    { en: "foot", cn: "脚", ph: "/fʊt/" }
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

    getRandomWordExcluding(excludeEn) {
        const available = WORD_BANK.filter(w => w.en !== excludeEn);
        return available[Math.floor(Math.random() * available.length)];
    },

    reset() {
        this.usedIndices.clear();
    }
};
