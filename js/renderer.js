// js/renderer.js

export const bgCanvas = document.getElementById('bgCanvas');
export const gameCanvas = document.getElementById('gameCanvas');
export const fxCanvas = document.getElementById('fxCanvas');
export const minimapCanvas = document.getElementById('minimapCanvas');

export const bgCtx = bgCanvas.getContext('2d', { alpha: false });
export const gameCtx = gameCanvas.getContext('2d');
export const fxCtx = fxCanvas.getContext('2d');
export const minimapCtx = minimapCanvas.getContext('2d');

let width, height;
let stars = [];
let camera = { x: 0, y: 0 };
export let settings = { bloom: true, particles: true, screenshake: true };
let shakeMagnitude = 0;

export const Renderer = {
    init: () => {
        Renderer.resize();
        window.addEventListener('resize', Renderer.resize);
        Renderer.initStars();
    },

    resize: () => {
        width = window.innerWidth;
        height = window.innerHeight;
        
        [bgCanvas, gameCanvas, fxCanvas].forEach(canvas => {
            canvas.width = width;
            canvas.height = height;
        });

        const mmSize = 150;
        minimapCanvas.width = mmSize;
        minimapCanvas.height = mmSize;
    },

    initStars: () => {
        stars = [];
        for (let i = 0; i < 200; i++) {
            stars.push({
                x: Math.random() * 5000 - 2500,
                y: Math.random() * 5000 - 2500,
                size: Math.random() * 2 + 0.5,
                alpha: Math.random(),
                blinkSpeed: Math.random() * 0.02 + 0.005
            });
        }
    },
    // Add these getter functions
    getCamera: () => camera,
    getWidth: () => width,
    getHeight: () => height,

    // Add the camera update logic
    updateCamera: (player) => {
        if (!player) return;
        
        // Center camera on player
        let targetX = player.x - width / 2;
        let targetY = player.y - height / 2;

        // Smooth camera movement
        camera.x += (targetX - camera.x) * 0.1;
        camera.y += (targetY - camera.y) * 0.1;

        // Add screen shake effect
        if (shakeMagnitude > 0) {
            camera.x += (Math.random() - 0.5) * shakeMagnitude;
            camera.y += (Math.random() - 0.5) * shakeMagnitude;
            shakeMagnitude *= 0.9;
            if (shakeMagnitude < 0.1) shakeMagnitude = 0;
        }
    },

    shake: (amount) => {
        if (settings.screenshake) shakeMagnitude = amount;
    },

    updateCamera: (player) => {
        camera.x = player.x - width / 2;
        camera.y = player.y - height / 2;

        if (settings.screenshake && shakeMagnitude > 0) {
            camera.x += (Math.random() - 0.5) * shakeMagnitude;
            camera.y += (Math.random() - 0.5) * shakeMagnitude;
            shakeMagnitude *= 0.9;
            if (shakeMagnitude < 0.5) shakeMagnitude = 0;
        }
    },

    shake: (amount) => {
        shakeMagnitude = amount;
    },

    clear: () => {
        bgCtx.fillStyle = '#05050a';
        bgCtx.fillRect(0, 0, width, height);
        gameCtx.clearRect(0, 0, width, height);
        fxCtx.clearRect(0, 0, width, height);
    },

    drawBackground: () => {
        stars.forEach(star => {
            star.alpha += star.blinkSpeed;
            if (star.alpha >= 1 || star.alpha <= 0.1) star.blinkSpeed *= -1;

            const screenX = star.x - camera.x * 0.2; // Parallax effect
            const screenY = star.y - camera.y * 0.2;

            if (screenX > 0 && screenX < width && screenY > 0 && screenY < height) {
                bgCtx.globalAlpha = star.alpha;
                bgCtx.fillStyle = '#ffffff';
                bgCtx.beginPath();
                bgCtx.arc(screenX, screenY, star.size, 0, Math.PI * 2);
                bgCtx.fill();
            }
        });
        bgCtx.globalAlpha = 1.0;
        
        // Draw grid lines for spatial reference
        bgCtx.strokeStyle = 'rgba(100, 120, 255, 0.05)';
        bgCtx.lineWidth = 2;
        const gridSize = 100;
        const offsetX = -(camera.x % gridSize);
        const offsetY = -(camera.y % gridSize);
        
        bgCtx.beginPath();
        for(let x = offsetX; x < width; x += gridSize) {
            bgCtx.moveTo(x, 0);
            bgCtx.lineTo(x, height);
        }
        for(let y = offsetY; y < height; y += gridSize) {
            bgCtx.moveTo(0, y);
            bgCtx.lineTo(width, y);
        }
        bgCtx.stroke();
    },

    renderMinimap: (player, enemies) => {
        minimapCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
        
        const mapScale = 0.03;
        const cx = minimapCanvas.width / 2;
        const cy = minimapCanvas.height / 2;

        // Draw Player
        minimapCtx.fillStyle = '#00e5ff';
        minimapCtx.beginPath();
        minimapCtx.arc(cx, cy, 3, 0, Math.PI * 2);
        minimapCtx.fill();

        // Draw Enemies
        minimapCtx.fillStyle = '#ff4a6e';
        enemies.forEach(enemy => {
            const dx = (enemy.x - player.x) * mapScale;
            const dy = (enemy.y - player.y) * mapScale;
            
            if (Math.abs(dx) < cx && Math.abs(dy) < cy) {
                minimapCtx.beginPath();
                minimapCtx.arc(cx + dx, cy + dy, 2, 0, Math.PI * 2);
                minimapCtx.fill();
            }
        });
    },

    getCamera: () => camera,
    getWidth: () => width,
    getHeight: () => height
};
