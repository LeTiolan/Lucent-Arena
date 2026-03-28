// js/systems.js
import { Enemy, Particle, DamageNumber } from './entities.js';
import { Enemy, Particle, DamageNumber, Projectile } from './entities.js';
import { AudioSystem } from './audio.js';
import { Renderer, settings } from './renderer.js';

export const GameState = {
    player: null,
    enemies: [],
    projectiles: [],
    particles: [],
    damageNumbers: [],
    score: 0,
    timeAlive: 0,
    wave: 1,
    isGameOver: false,
    isPaused: false,
    frameCount: 0,
    keys: {}
};

export const Systems = {
    init: (player) => {
        GameState.player = player;
        GameState.enemies = [];
        GameState.projectiles = [];
        GameState.particles = [];
        GameState.damageNumbers = [];
        GameState.score = 0;
        GameState.timeAlive = 0;
        GameState.wave = 1;
        GameState.isGameOver = false;
        GameState.isPaused = false;
        GameState.frameCount = 0;
    },

    spawnEnemy: () => {
        const { getCamera, getWidth, getHeight } = Renderer;
        const camera = getCamera();
        const width = getWidth();
        const height = getHeight();

        // Spawn outside the viewport
        let x, y;
        if (Math.random() < 0.5) {
            x = camera.x + (Math.random() < 0.5 ? -100 : width + 100);
            y = camera.y + Math.random() * height;
        } else {
            x = camera.x + Math.random() * width;
            y = camera.y + (Math.random() < 0.5 ? -100 : height + 100);
        }

        // Determine type based on wave/score
        let type = 'basic';
        const rand = Math.random();
        if (GameState.wave > 2 && rand < 0.2) type = 'fast';
        else if (GameState.wave > 4 && rand < 0.3) type = 'tank';
        else if (GameState.wave % 10 === 0 && GameState.enemies.length === 0) type = 'boss';

        GameState.enemies.push(new Enemy(x, y, type));
    },

    createExplosion: (x, y, color, count) => {
        if (!settings.particles) return;
        for (let i = 0; i < count; i++) {
            GameState.particles.push(new Particle(x, y, color, 8, 30 + Math.random() * 20));
        }
    },
    
    spawnPlayerProjectile: (x, y, vx, vy, damage) => {
        GameState.projectiles.push(new Projectile(x, y, vx, vy, damage, true));
    },

    checkCollisions: () => {
        const p = GameState.player;

        // Projectiles vs Enemies
        for (let i = GameState.projectiles.length - 1; i >= 0; i--) {
            const proj = GameState.projectiles[i];
            let hit = false;

            for (let j = GameState.enemies.length - 1; j >= 0; j--) {
                const e = GameState.enemies[j];
                const dx = proj.x - e.x;
                const dy = proj.y - e.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < proj.radius + e.radius) {
                    // Hit!
                    e.hp -= proj.damage;
                    hit = true;
                    
                    const isCrit = Math.random() < 0.1; // 10% base crit chance
                    const dmgTaken = isCrit ? proj.damage * 2 : proj.damage;
                    if (isCrit) e.hp -= proj.damage; // Apply extra crit damage

                    GameState.damageNumbers.push(new DamageNumber(e.x, e.y - e.radius, dmgTaken, isCrit));
                    Systems.createExplosion(proj.x, proj.y, '#ffffff', 5);
                    AudioSystem.playHit();

                    if (e.hp <= 0) {
                        Systems.createExplosion(e.x, e.y, e.color, 20);
                        GameState.score += e.xpValue * 10;
                        p.gainXp(e.xpValue);
                        GameState.enemies.splice(j, 1);
                        AudioSystem.playKill();
                        Renderer.shake(3);
                    }
                    break;
                }
            }
            if (hit) {
                GameState.projectiles.splice(i, 1);
            }
        }

        // Enemies vs Player
        for (let j = GameState.enemies.length - 1; j >= 0; j--) {
            const e = GameState.enemies[j];
            const dx = p.x - e.x;
            const dy = p.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < p.radius + e.radius) {
                p.hp -= e.damage;
                GameState.damageNumbers.push(new DamageNumber(p.x, p.y - p.radius, e.damage, false));
                Renderer.shake(5);
                AudioSystem.playHit();
                
                // Knockback enemy slightly
                e.x -= (dx / dist) * 20;
                e.y -= (dy / dist) * 20;

                if (p.hp <= 0) {
                    GameState.isGameOver = true;
                    Systems.createExplosion(p.x, p.y, p.color, 50);
                }
            }
        }
    },

    update: () => {
        if (GameState.isPaused || GameState.isGameOver) return;

        GameState.frameCount++;
        if (GameState.frameCount % 60 === 0) GameState.timeAlive++;

        // Wave management
        if (GameState.frameCount % 600 === 0) GameState.wave++; // Every 10 seconds wave increases
        
        // Dynamic spawn rate based on wave
        const spawnRate = Math.max(10, 60 - GameState.wave * 2); 
        if (GameState.frameCount % spawnRate === 0 && GameState.enemies.length < 50 + GameState.wave * 5) {
            Systems.spawnEnemy();
        }

        GameState.player.update(GameState.keys);

        for (let i = GameState.enemies.length - 1; i >= 0; i--) {
            GameState.enemies[i].update(GameState.player);
        }

        for (let i = GameState.projectiles.length - 1; i >= 0; i--) {
            const p = GameState.projectiles[i];
            p.update();
            if (p.life <= 0) GameState.projectiles.splice(i, 1);
        }

        for (let i = GameState.particles.length - 1; i >= 0; i--) {
            const p = GameState.particles[i];
            p.update();
            if (p.life <= 0) GameState.particles.splice(i, 1);
        }

        for (let i = GameState.damageNumbers.length - 1; i >= 0; i--) {
            const dn = GameState.damageNumbers[i];
            dn.update();
            if (dn.life <= 0) GameState.damageNumbers.splice(i, 1);
        }

        Systems.checkCollisions();
    }
};
