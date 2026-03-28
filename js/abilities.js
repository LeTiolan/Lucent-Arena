// js/abilities.js
import { GameState, Systems } from './systems.js';
import { Renderer, settings, gameCtx } from './renderer.js';
import { AudioSystem } from './audio.js';
import { DamageNumber, Particle } from './entities.js';

export const Abilities = {
    cooldowns: {
        dash: 0,
        pulse: 0,
        shield: 0,
        nova: 0,
        heal: 0,
        overdrive: 0
    },
    
    maxCooldowns: {
        dash: 60,      // 1 second (Q)
        pulse: 300,    // 5 seconds (E)
        shield: 900,   // 15 seconds (R)
        nova: 600,     // 10 seconds (F)
        heal: 1200,    // 20 seconds (C)
        overdrive: 1800 // 30 seconds (V)
    },

    activeEffects: {
        shielded: 0,
        overdrive: 0
    },

    update: () => {
        const p = GameState.player;
        if (!p) return;

        // Reduce cooldowns
        for (const key in Abilities.cooldowns) {
            if (Abilities.cooldowns[key] > 0) Abilities.cooldowns[key]--;
        }

        // Reduce active effect durations
        if (Abilities.activeEffects.shielded > 0) Abilities.activeEffects.shielded--;
        if (Abilities.activeEffects.overdrive > 0) Abilities.activeEffects.overdrive--;

        // Draw active effects
        const camera = Renderer.getCamera();
        if (Abilities.activeEffects.shielded > 0) {
            gameCtx.beginPath();
            gameCtx.arc(p.x - camera.x, p.y - camera.y, p.radius + 10, 0, Math.PI * 2);
            gameCtx.strokeStyle = 'rgba(0, 229, 255, 0.8)';
            gameCtx.lineWidth = 3;
            if (settings.bloom) {
                gameCtx.shadowBlur = 10;
                gameCtx.shadowColor = '#00e5ff';
            }
            gameCtx.stroke();
            gameCtx.shadowBlur = 0;
        }

        if (Abilities.activeEffects.overdrive > 0) {
            Systems.createExplosion(p.x, p.y, '#ffd700', 1); // Trail effect
        }

        // Handle Inputs
        const keys = GameState.keys;
        if (keys['q'] && Abilities.cooldowns.dash <= 0 && p.energy >= 10) Abilities.triggerDash(p);
        if (keys['e'] && Abilities.cooldowns.pulse <= 0 && p.energy >= 20) Abilities.triggerPulse(p);
        if (keys['r'] && Abilities.cooldowns.shield <= 0 && p.energy >= 30) Abilities.triggerShield(p);
        if (keys['f'] && Abilities.cooldowns.nova <= 0 && p.energy >= 40) Abilities.triggerNova(p);
        if (keys['c'] && Abilities.cooldowns.heal <= 0 && p.energy >= 50) Abilities.triggerHeal(p);
        if (keys['v'] && Abilities.cooldowns.overdrive <= 0 && p.energy >= 60) Abilities.triggerOverdrive(p);
    },

    triggerDash: (p) => {
        p.energy -= 10;
        Abilities.cooldowns.dash = Abilities.maxCooldowns.dash;
        
        const dashMultiplier = 5;
        p.x += p.vx * dashMultiplier;
        p.y += p.vy * dashMultiplier;
        
        Systems.createExplosion(p.x, p.y, '#00e5ff', 15);
        AudioSystem.playShoot(); // Placeholder sound
        Renderer.shake(5);
    },

    triggerPulse: (p) => {
        p.energy -= 20;
        Abilities.cooldowns.pulse = Abilities.maxCooldowns.pulse;
        
        const pulseRadius = 150;
        Systems.createExplosion(p.x, p.y, '#ff0044', 30);
        Renderer.shake(10);
        AudioSystem.playHit();

        GameState.enemies.forEach(e => {
            const dx = e.x - p.x;
            const dy = e.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist <= pulseRadius) {
                const damage = p.damage * 2;
                e.hp -= damage;
                GameState.damageNumbers.push(new DamageNumber(e.x, e.y, damage, true));
                
                // Knockback
                e.x += (dx / dist) * 50;
                e.y += (dy / dist) * 50;

                if (e.hp <= 0) {
                    GameState.score += e.xpValue * 10;
                    p.gainXp(e.xpValue);
                    e.markedForDeletion = true;
                    AudioSystem.playKill();
                }
            }
        });
        
        // Cleanup marked enemies
        GameState.enemies = GameState.enemies.filter(e => !e.markedForDeletion);
    },

    triggerShield: (p) => {
        p.energy -= 30;
        Abilities.cooldowns.shield = Abilities.maxCooldowns.shield;
        Abilities.activeEffects.shielded = 300; // 5 seconds
        AudioSystem.playLevelUp();
    },

    triggerNova: (p) => {
        p.energy -= 40;
        Abilities.cooldowns.nova = Abilities.maxCooldowns.nova;
        
        const numProjectiles = 16;
        const angleStep = (Math.PI * 2) / numProjectiles;
        const speed = 8;

        for (let i = 0; i < numProjectiles; i++) {
            const angle = i * angleStep;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            // Assuming Projectile class is imported or handled globally. 
            // In a real refactor, we'd import Projectile, but we use GameState.projectiles.
            // Using a dynamic import or adding it via Systems to avoid circular dependency
            Systems.spawnPlayerProjectile(p.x, p.y, vx, vy, p.damage * 1.5);
        }
        Renderer.shake(15);
        AudioSystem.playShoot();
    },

    triggerHeal: (p) => {
        p.energy -= 50;
        Abilities.cooldowns.heal = Abilities.maxCooldowns.heal;
        const healAmount = p.maxHp * 0.3;
        p.hp = Math.min(p.maxHp, p.hp + healAmount);
        
        GameState.damageNumbers.push(new DamageNumber(p.x, p.y - 20, `+${Math.floor(healAmount)}`, true));
        Systems.createExplosion(p.x, p.y, '#00ffaa', 20);
        AudioSystem.playLevelUp();
    },

    triggerOverdrive: (p) => {
        p.energy -= 60;
        Abilities.cooldowns.overdrive = Abilities.maxCooldowns.overdrive;
        Abilities.activeEffects.overdrive = 420; // 7 seconds
        
        // Temporarily boost stats
        const originalFireRate = p.fireRate;
        const originalSpeed = p.speed;
        
        p.fireRate = Math.max(2, p.fireRate / 2);
        p.speed *= 1.5;
        
        AudioSystem.playLevelUp();
        
        setTimeout(() => {
            p.fireRate = originalFireRate;
            p.speed = originalSpeed;
        }, 7000);
    }
};
