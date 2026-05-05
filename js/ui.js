const UI = {
    wordPopupTimer: 0,
    wrongPopupTimer: 0,
    scorePopupTimer: 0,
    crackOverlay: null,

    updateHealth(health, maxHealth) {
        const ratio = health / maxHealth;
        document.getElementById('health-fill').style.width = (ratio * 100) + '%';
        document.getElementById('health-text').textContent = Math.ceil(health) + '/' + maxHealth;

        if (ratio < 0.3) {
            document.getElementById('health-fill').style.background = 'linear-gradient(90deg, #c22, #f44)';
        } else if (ratio < 0.6) {
            document.getElementById('health-fill').style.background = 'linear-gradient(90deg, #c82, #fa4)';
        } else {
            document.getElementById('health-fill').style.background = 'linear-gradient(90deg, #4a4, #6c6)';
        }
    },

    updateScore(score) {
        document.getElementById('score').textContent = score;
    },

    updateKills(kills) {
        document.getElementById('kills').textContent = kills;
    },

    updateAmmo(ammo) {
        document.getElementById('ammo').textContent = ammo;
    },

    showWordPopup(word) {
        const popup = document.getElementById('word-popup');
        document.getElementById('popup-word').textContent = word.en;
        document.getElementById('popup-meaning').textContent = word.cn;
        const card = popup.querySelector('.word-card');
        card.className = 'word-card correct';
        popup.style.display = 'block';
        this.wordPopupTimer = 2.0;
    },

    showScorePopup(points) {
        const popup = document.getElementById('score-popup');
        const text = document.getElementById('score-fly-text');
        text.textContent = '+' + points;
        popup.style.display = 'block';
        text.style.animation = 'none';
        void text.offsetWidth;
        text.style.animation = '';
        this.scorePopupTimer = 1.3;
    },

    showWrongPopup(hitWord, correctWord) {
        const popup = document.getElementById('wrong-popup');
        document.getElementById('wrong-text').textContent =
            hitWord + ' ≠ ' + correctWord;
        popup.style.display = 'block';
        const card = popup.querySelector('.wrong-card');
        card.style.animation = 'none';
        void card.offsetWidth;
        card.style.animation = '';
        this.wrongPopupTimer = 1.0;
    },

    showDamageFlash() {
        const flash = document.createElement('div');
        flash.className = 'damage-flash';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 500);
    },

    showCrackScreen() {
        if (this.crackOverlay) return;

        const canvas = document.createElement('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.className = 'crack-overlay';
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const cx = canvas.width / 2 + (Math.random() - 0.5) * 200;
        const cy = canvas.height / 2 + (Math.random() - 0.5) * 150;

        ctx.strokeStyle = 'rgba(255, 200, 200, 0.8)';
        ctx.lineWidth = 2.5;
        
        ctx.shadowColor = 'rgba(255, 100, 100, 0.5)';
        ctx.shadowBlur = 8;

        for (let i = 0; i < 12; i++) {
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            let x = cx, y = cy;
            const baseAngle = (i / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
            const len = 150 + Math.random() * 350;
            const segments = 5 + Math.floor(Math.random() * 8);

            for (let s = 0; s < segments; s++) {
                const segLen = len / segments;
                const angle = baseAngle + (Math.random() - 0.5) * 0.6;
                x += Math.cos(angle) * segLen;
                y += Math.sin(angle) * segLen;
                ctx.lineTo(x, y);

                if (Math.random() < 0.4) {
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    const branchAngle = angle + (Math.random() - 0.5) * 1.5;
                    const bLen = 30 + Math.random() * 80;
                    ctx.lineTo(
                        x + Math.cos(branchAngle) * bLen,
                        y + Math.sin(branchAngle) * bLen
                    );
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                }
            }
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 20; i++) {
            const sx = cx + (Math.random() - 0.5) * 400;
            const sy = cy + (Math.random() - 0.5) * 300;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + (Math.random() - 0.5) * 60, sy + (Math.random() - 0.5) * 60);
            ctx.stroke();
        }

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 400);
        gradient.addColorStop(0, 'rgba(255, 50, 50, 0.15)');
        gradient.addColorStop(0.5, 'rgba(200, 30, 30, 0.1)');
        gradient.addColorStop(1, 'rgba(100, 20, 20, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        document.body.appendChild(canvas);
        this.crackOverlay = canvas;
    },

    hideCrackScreen() {
        if (this.crackOverlay) {
            this.crackOverlay.remove();
            this.crackOverlay = null;
        }
    },

    showGameOver(score, kills) {
        document.getElementById('game-ui').style.display = 'none';
        document.getElementById('game-over').style.display = 'flex';
        const wordsLearned = typeof SpellTracker !== 'undefined' ? SpellTracker.completed : 0;
        document.getElementById('final-stats').innerHTML =
            `最终得分: ${score}<br>` +
            `击毁敌方: ${kills} 辆<br>` +
            `学习单词: ${wordsLearned} 个`;
    },

    update(dt) {
        if (this.wordPopupTimer > 0) {
            this.wordPopupTimer -= dt;
            if (this.wordPopupTimer <= 0) {
                document.getElementById('word-popup').style.display = 'none';
            }
        }
        if (this.wrongPopupTimer > 0) {
            this.wrongPopupTimer -= dt;
            if (this.wrongPopupTimer <= 0) {
                document.getElementById('wrong-popup').style.display = 'none';
            }
        }
        if (this.scorePopupTimer > 0) {
            this.scorePopupTimer -= dt;
            if (this.scorePopupTimer <= 0) {
                document.getElementById('score-popup').style.display = 'none';
            }
        }
    },

    reset() {
        this.updateHealth(100, 100);
        this.updateScore(0);
        this.updateKills(0);
        this.updateAmmo('∞');
        this.hideCrackScreen();
        document.getElementById('word-popup').style.display = 'none';
        document.getElementById('wrong-popup').style.display = 'none';
        document.getElementById('score-popup').style.display = 'none';
        document.getElementById('game-over').style.display = 'none';
        document.getElementById('game-ui').style.display = 'block';
        document.getElementById('timer').textContent = '10:00';
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) timerDisplay.classList.remove('warning');
    }
};
