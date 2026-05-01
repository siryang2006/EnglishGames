const InputManager = {
    keys: {},
    mouse: { x: 0, y: 0, dx: 0, dy: 0 },
    mouseDown: false,
    rightMouseDown: false,
    locked: false,

    init() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') e.preventDefault();
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.mouseDown = true;
            if (e.button === 2) this.rightMouseDown = true;
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouseDown = false;
            if (e.button === 2) this.rightMouseDown = false;
        });

        document.addEventListener('contextmenu', (e) => e.preventDefault());

        document.addEventListener('mousemove', (e) => {
            if (this.locked) {
                this.mouse.dx += e.movementX || 0;
                this.mouse.dy += e.movementY || 0;
            }
        });

        const canvas = document.getElementById('gameCanvas');
        canvas.addEventListener('click', () => {
            if (!this.locked) {
                canvas.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.locked = document.pointerLockElement === canvas;
        });
    },

    consumeMouseDelta() {
        const dx = this.mouse.dx;
        const dy = this.mouse.dy;
        this.mouse.dx = 0;
        this.mouse.dy = 0;
        return { dx, dy };
    },

    isKeyDown(code) {
        return !!this.keys[code];
    },

    reset() {
        this.keys = {};
        this.mouseDown = false;
        this.rightMouseDown = false;
        this.mouse.dx = 0;
        this.mouse.dy = 0;
    }
};
