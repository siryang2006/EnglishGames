const SpellTracker = {
    currentWord: null,
    currentIndex: 0,
    completed: 0,
    playerTank: null,
    englishVoice: null,

    init(playerTank) {
        this.playerTank = playerTank;
        this.completed = 0;
        this.currentIndex = 0;
        this.loadVoice();
        this.nextWord();
    },

    loadVoice() {
        if (!('speechSynthesis' in window)) return;
        const pickVoice = () => {
            const voices = speechSynthesis.getVoices();
            this.englishVoice = voices.find(v => v.lang === 'en-US' && v.localService) ||
                voices.find(v => v.lang === 'en-GB') ||
                voices.find(v => v.lang.startsWith('en-')) ||
                null;
        };
        pickVoice();
        speechSynthesis.onvoiceschanged = pickVoice;
    },

    nextWord() {
        this.currentWord = WordManager.getRandomWord();
        this.currentIndex = 0;
        if (this.playerTank) {
            this.playerTank.updateSpellLabel(this.currentWord, this.currentIndex);
        }
        this.reassignEnemyLetters();
    },

    reassignEnemyLetters() {
        if (typeof Game === 'undefined') return;
        const needed = this.getNeededLetter();
        let assigned = false;

        const allEntities = [];
        if (Game.enemies) Game.enemies.forEach(e => { if (e.alive) allEntities.push(e); });
        if (SoldierManager.soldiers) SoldierManager.soldiers.forEach(s => { if (s.alive && !s.isPlayerTeam) allEntities.push(s); });
        if (AnimalManager.animals) AnimalManager.animals.forEach(a => { if (a.alive) allEntities.push(a); });
        if (typeof AircraftManager !== 'undefined' && AircraftManager.aircraft) {
            AircraftManager.getAlive().forEach(ac => allEntities.push(ac));
        }

        const shuffled = allEntities.sort(() => Math.random() - 0.5);

        for (const entity of shuffled) {
            if (!assigned) {
                entity.letter = needed;
                assigned = true;
            } else {
                entity.letter = this.getRandomLetter();
            }
            if (entity.updateLetterLabel) entity.updateLetterLabel();
        }
    },

    getNeededLetter() {
        if (!this.currentWord) return 'a';
        while (this.currentIndex < this.currentWord.en.length && this.currentWord.en.charAt(this.currentIndex) === ' ') {
            this.currentIndex++;
        }
        if (this.currentIndex >= this.currentWord.en.length) return '';
        return this.currentWord.en.charAt(this.currentIndex).toLowerCase();
    },

    getRandomLetter() {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        return letters.charAt(Math.floor(Math.random() * 26));
    },

    checkLetter(letter) {
        if (!this.currentWord) return false;
        while (this.currentIndex < this.currentWord.en.length && this.currentWord.en.charAt(this.currentIndex) === ' ') {
            this.currentIndex++;
        }
        if (this.currentIndex >= this.currentWord.en.length) return false;
        const needed = this.currentWord.en.charAt(this.currentIndex).toLowerCase();
        if (letter.toLowerCase() === needed) {
            this.currentIndex++;
            while (this.currentIndex < this.currentWord.en.length && this.currentWord.en.charAt(this.currentIndex) === ' ') {
                this.currentIndex++;
            }
            if (this.playerTank) {
                this.playerTank.updateSpellLabel(this.currentWord, this.currentIndex);
            }
            if (this.currentIndex >= this.currentWord.en.length) {
                return 'complete';
            }
            this.reassignEnemyLetters();
            return 'correct';
        }
        return false;
    },

    speakWord(word) {
        if (!('speechSynthesis' in window)) return;
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(word.en);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        if (this.englishVoice) utterance.voice = this.englishVoice;
        speechSynthesis.speak(utterance);
    },

    speakLetter(letter) {
        if (!('speechSynthesis' in window)) return;
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(letter.toUpperCase());
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.volume = 1.0;
        if (this.englishVoice) utterance.voice = this.englishVoice;
        speechSynthesis.speak(utterance);
    },

    reset() {
        this.currentWord = null;
        this.currentIndex = 0;
        this.completed = 0;
        this.playerTank = null;
    }
};
