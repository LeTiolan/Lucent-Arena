// js/main.js
import { Renderer, gameCtx } from './renderer.js';
import { AudioSystem } from './audio.js';
import { Systems, GameState } from './systems.js';
import { Player, Projectile } from './entities.js';
import { UI } from './ui.js';
import { Abilities } from './abilities.js'; // <-- ADDED THIS IMPORT

let lastTime = 0;
let mouse = { x: 0, y: 0, isDown: false };
let isInitialized = false;

function initGame() {
    Renderer.init();
    const player = new Player(0, 0);
    Systems.init(player);
    UI.init();
    
    // Keybinds
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        GameState.keys[key] = true;
        
        if (key === 'escape') {
            UI.togglePause();
        }
        
        // Start Audio context on first interaction
        if (!isInitialized) {
            AudioSystem.init();
            isInitialized = true;
        }
    });

    window.addEventListener('keyup', (e) => {
        GameState.keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
        mouse.isDown = true;
        if (!isInitialized) {
            AudioSystem.init();
            isInitialized = true;
        }
    });

    window.addEventListener('mouseup', () => {
        mouse.isDown = false;
    });

    // Handle Shooting
    setInterval(() => {
        if (GameState.isPaused || GameState.isGameOver || !mouse.isDown) return;
        
        const p = GameState.player;
        if (p.fireCooldown <= 0 && p.energy >= 5) {
            p.energy -= 5;
            p.fireCooldown = p.fireRate;
            
            const camera = Renderer.getCamera();
            const targetX = mouse.x + camera.x;
            const targetY = mouse.y + camera.y;
            
            const dx = targetX - p.x;
            const dy = targetY - p.y;
            const angle = Math.atan2(dy, dx);
            
            const projSpeed = 12;
            const vx = Math.cos(angle) * projSpeed;
            const vy = Math.sin(angle) * projSpeed;
            
            GameState.projectiles.push(new Projectile(p.x, p.y, vx, vy, p.damage, true));
            AudioSystem.playShoot();
            
            // Recoil mechanics
            p.x -= Math.cos(angle) * 1;
            p.y -= Math.sin(angle) * 1;
        }
    }, 1000 / 60);

    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    if (!GameState.isPaused && !GameState.isGameOver) {
        Systems.update();
        Abilities.update(); // <-- ADDED THIS TO ACTIVATE ABILITIES
        Renderer.updateCamera(GameState.player);
        UI.updateHUD();
        
        if (GameState.isGameOver) {
            UI.showGameOver();
        }
    }

    Renderer.clear();
    const camera = Renderer.getCamera();

    // Render logic
    Renderer.drawBackground();

    // Draw Entities
    GameState.particles.forEach(p => p.draw(camera));
    GameState.projectiles.forEach(p => p.draw(camera));
    GameState.enemies.forEach(e => e.draw(camera));
    
    if (!GameState.isGameOver) {
        GameState.player.draw(camera);
        
        // Draw aim reticle/laser sight
        gameCtx.strokeStyle = 'rgba(0, 229, 255, 0.1)';
        gameCtx.lineWidth = 1;
        gameCtx.beginPath();
        gameCtx.moveTo(GameState.player.x - camera.x, GameState.player.y - camera.y);
        gameCtx.lineTo(mouse.x, mouse.y);
        gameCtx.stroke();
    }

    GameState.damageNumbers.forEach(dn => dn.draw(camera));
    
  // UI Rendering layered above game
    if (GameState.player) {
        Renderer.renderMinimap(GameState.player, GameState.enemies);
    }

    // This closing bracket finishes the gameLoop function!
    requestAnimationFrame(gameLoop);
} 

// Boot up the game when the window loads
window.onload = () => {
    initGame();
};
