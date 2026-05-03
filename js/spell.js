const SpellTracker = {
    currentWord: null,
    completed: 0,
    playerTank: null,
    audioCache: {},
    currentAudio: null,
    correctTarget: null,

    init(playerTank) {
        this.playerTank = playerTank;
        this.completed = 0;
        this.audioCache = {};
        this.correctTarget = null;
        this.assignInitialWords();
        this.pickFirstWord();
    },

    assignInitialWords() {
        const all = this.getAllTargets();
        for (const entity of all) {
            const w = WordManager.getRandomWord();
            entity.word = w;
            entity.letter = w.en;
            entity.isCorrectWord = false;
            if (entity.updateLetterLabel) entity.updateLetterLabel();
        }
    },

    pickFirstWord() {
        const word = WordManager.getRandomWord();
        this.setCurrentWord(word);
    },

    nextWord() {
        const word = WordManager.getRandomWord();
        this.setCurrentWord(word);
    },

    setCurrentWord(word) {
        this.currentWord = word;

        if (this.correctTarget) {
            this.correctTarget.isCorrectWord = false;
        }

        const all = this.getAllTargets();
        if (all.length === 0) return;

        const playerPos = (Game.player && Game.player.group)
            ? Game.player.group.position : new THREE.Vector3();
        const playerYaw = (typeof Game !== 'undefined') ? Game.playerYaw : 0;
        const forward = new THREE.Vector3(-Math.sin(playerYaw), 0, -Math.cos(playerYaw));

        const visible = all.filter(e => {
            const pos = e.group ? e.group.position : e.position;
            const toEntity = new THREE.Vector3().subVectors(pos, playerPos);
            toEntity.y = 0;
            const dist = toEntity.length();
            if (dist < 1) return true;
            toEntity.normalize();
            return forward.dot(toEntity) > -0.3 && dist < 60;
        });

        const pool = visible.length > 0 ? visible : all;
        pool.sort((a, b) => {
            const posA = a.group ? a.group.position : a.position;
            const posB = b.group ? b.group.position : b.position;
            return posA.distanceTo(playerPos) - posB.distanceTo(playerPos);
        });

        const target = pool[0];
        target.word = word;
        target.letter = word.en;
        target.isCorrectWord = true;
        if (target.updateLetterLabel) target.updateLetterLabel();
        this.correctTarget = target;

        if (this.playerTank) {
            this.playerTank.updateSpellLabel(this.currentWord, 0);
        }
    },

    refreshCorrectTarget() {
        if (this.correctTarget && this.correctTarget.alive) return;
        this.setCurrentWord(this.currentWord || WordManager.getRandomWord());
    },

    getAllTargets() {
        const all = [];
        if (typeof Game !== 'undefined') {
            if (Game.enemies) Game.enemies.forEach(e => { if (e.alive) all.push(e); });
            if (SoldierManager.soldiers) SoldierManager.soldiers.forEach(s => { if (s.alive && !s.isPlayerTeam) all.push(s); });
            if (AnimalManager.animals) AnimalManager.animals.forEach(a => { if (a.alive) all.push(a); });
            if (typeof AircraftManager !== 'undefined' && AircraftManager.aircraft) {
                AircraftManager.getAlive().forEach(ac => all.push(ac));
            }
        }
        if (typeof GameScene !== 'undefined') {
            GameScene.buildings.forEach(b => { if (b.alive && b.word) all.push(b); });
            GameScene.bunkers.forEach(b => { if (b.alive && b.word) all.push(b); });
            GameScene.barrels.forEach(b => { if (b.alive && b.word) all.push(b); });
            GameScene.trees.forEach(t => { if (t.alive && t.word) all.push(t); });
            GameScene.rocks.forEach(r => { if (r.alive && r.word) all.push(r); });
            if (GameScene.ships) GameScene.ships.forEach(s => { if (s.alive && s.word) all.push(s); });
        }
        return all;
    },

    reassignEntityWords() {
        this.refreshCorrectTarget();
    },

    checkWord(entityWord) {
        if (!this.currentWord || !entityWord) return false;
        if (entityWord.en === this.currentWord.en) return 'correct';
        return 'wrong';
    },

    speakWord(word) {
        if (!word || !word.en) return;
        const url = 'https://dict.youdao.com/dictvoice?audio=' +
            encodeURIComponent(word.en) + '&type=1';
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }
        if (this.audioCache[word.en]) {
            this.currentAudio = this.audioCache[word.en];
            this.currentAudio.currentTime = 0;
            this.currentAudio.play().catch(() => {});
            return;
        }
        const audio = new Audio(url);
        audio.volume = 1.0;
        this.audioCache[word.en] = audio;
        this.currentAudio = audio;
        audio.play().catch(() => {});
    },

    reset() {
        this.currentWord = null;
        this.completed = 0;
        this.playerTank = null;
        this.correctTarget = null;
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        this.audioCache = {};
    }
};
