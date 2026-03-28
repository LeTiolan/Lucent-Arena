// js/entities.js
import { gameCtx, fxCtx, settings, Renderer } from './renderer.js';

export class Particle {
    constructor(x, y, color, speed, life) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * speed;
        this.vy = (Math.random() - 0.5) * speed;
        this.life = life;
        this.maxLife = life;
        this.size = Math.random() * 3 + 1;
        this.friction = 0.95;
    }
    update() {
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    draw(camera) {
        if (!settings.particles) return;
        fxCtx.globalAlpha = Math.max(0, this.life / this.maxLife);
        fxCtx.fillStyle = this.color;
        fxCtx.beginPath();
        fxCtx.arc(this.x - camera.x, this.y - camera.y, this.size, 0, Math.PI * 2);
        fxCtx.fill();
        fxCtx.globalAlpha = 1;
    }
}

export class DamageNumber {
    constructor(x, y, value, isCrit = false) {
        this.x = x;
        this.y = y;
        this.value = Math.floor(value);
        this.life = 60;
        this.maxLife = 60;
        this.vy = -1;
        this.isCrit = isCrit;
    }
    update() {
        this.y += this.vy;
        this.life--;
    }
    draw(camera) {
        fxCtx.globalAlpha = Math.max(0, this.life / this.maxLife);
        fxCtx.font = this.isCrit ? "bold 24px monospace" : "16px monospace";
        fxCtx.fillStyle = this.isCrit ? "#ffd700" : "#ffffff";
        fxCtx.textAlign = "center";
        
        if (settings.bloom) {
            fxCtx.shadowBlur = 10;
            fxCtx.shadowColor = fxCtx.fillStyle;
        }
        
        fxCtx.fillText(this.value, this.x - camera.x, this.y - camera.y);
        fxCtx.shadowBlur = 0;
        fxCtx.globalAlpha = 1;
    }
}

export class Projectile {
    constructor(x, y, vx, vy, damage, isPlayer = true) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.isPlayer = isPlayer;
        this.radius = 4;
        this.life = 120;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    draw(camera) {
        gameCtx.fillStyle = this.isPlayer ? '#00e5ff' : '#ff4a6e';
        if (settings.bloom) {
            gameCtx.shadowBlur = 15;
            gameCtx.shadowColor = gameCtx.fillStyle;
        }
        gameCtx.beginPath();
        gameCtx.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2);
        gameCtx.fill();
        gameCtx.shadowBlur = 0;
    }
}

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.color = '#e0e5ff';
        this.glowColor = '#00e5ff';
        
        // Stats
        this.maxHp = 100;
        this.hp = this.maxHp;
        this.maxEnergy = 100;
        this.energy = this.maxEnergy;
        this.energyRegen = 0.2;
        this.speed = 4;
        this.damage = 25;
        this.fireRate = 10; // Frames between shots
        this.fireCooldown = 0;
        
        // Progression
        this.level = 1;
        this.xp = 0;
        this.xpNeeded = 100;
        this.skillPoints = 0;
        
        // Movement state
        this.vx = 0;
        this.vy = 0;
    }

    update(keys) {
        // Movement
        this.vx = 0;
        this.vy = 0;
        if (keys['w']) this.vy -= this.speed;
        if (keys['s']) this.vy += this.speed;
        if (keys['a']) this.vx -= this.speed;
        if (keys['d']) this.vx += this.speed;

        // Normalize diagonal speed
        if (this.vx !== 0 && this.vy !== 0) {
            const length = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            this.vx = (this.vx / length) * this.speed;
            this.vy = (this.vy / length) * this.speed;
        }

        this.x += this.vx;
        this.y += this.vy;

        // Energy Regen
        if (this.energy < this.maxEnergy) {
            this.energy += this.energyRegen;
            if (this.energy > this.maxEnergy) this.energy = this.maxEnergy;
        }

        if (this.fireCooldown > 0) this.fireCooldown--;
    }

    draw(camera) {
        if (settings.bloom) {
            gameCtx.shadowBlur = 20;
            gameCtx.shadowColor = this.glowColor;
        }
        gameCtx.fillStyle = this.color;
        gameCtx.beginPath();
        gameCtx.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2);
        gameCtx.fill();
        gameCtx.shadowBlur = 0;

        // Draw core
        gameCtx.fillStyle = '#ffffff';
        gameCtx.beginPath();
        gameCtx.arc(this.x - camera.x, this.y - camera.y, this.radius * 0.5, 0, Math.PI * 2);
        gameCtx.fill();
    }

    gainXp(amount) {
        this.xp += amount;
        if (this.xp >= this.xpNeeded) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpNeeded;
        this.xpNeeded = Math.floor(this.xpNeeded * 1.5);
        this.skillPoints++;
        this.maxHp += 10;
        this.hp = this.maxHp;
        this.maxEnergy += 10;
        this.energy = this.maxEnergy;
        this.damage += 2;
        return true; // Indicates level up happened
    }
}

export class Enemy {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.vx = 0;
        this.vy = 0;
        
        switch(type) {
            case 'fast':
                this.hp = 30;
                this.maxHp = 30;
                this.speed = 3.5;
                this.radius = 10;
                this.color = '#ff9900';
                this.xpValue = 15;
                this.damage = 5;
                break;
            case 'tank':
                this.hp = 200;
                this.maxHp = 200;
                this.speed = 1.0;
                this.radius = 25;
                this.color = '#ff0044';
                this.xpValue = 50;
                this.damage = 25;
                break;
            case 'boss':
                this.hp = 1000;
                this.maxHp = 1000;
                this.speed = 1.5;
                this.radius = 40;
                this.color = '#cc00ff';
                this.xpValue = 500;
                this.damage = 40;
                break;
            case 'basic':
            default:
                this.hp = 50;
                this.maxHp = 50;
                this.speed = 2.0;
                this.radius = 15;
                this.color = '#ff4a6e';
                this.xpValue = 10;
                this.damage = 10;
                break;
        }
    }

    update(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            this.vx = (dx / dist) * this.speed;
            this.vy = (dy / dist) * this.speed;
        }
        
        this.x += this.vx;
        this.y += this.vy;
    }

    draw(camera) {
        if (settings.bloom) {
            gameCtx.shadowBlur = 15;
            gameCtx.shadowColor = this.color;
        }
        gameCtx.fillStyle = this.color;
        gameCtx.beginPath();
        
        if (this.type === 'tank') {
            gameCtx.rect(this.x - camera.x - this.radius, this.y - camera.y - this.radius, this.radius*2, this.radius*2);
        } else if (this.type === 'fast') {
            gameCtx.moveTo(this.x - camera.x, this.y - camera.y - this.radius);
            gameCtx.lineTo(this.x - camera.x + this.radius, this.y - camera.y + this.radius);
            gameCtx.lineTo(this.x - camera.x - this.radius, this.y - camera.y + this.radius);
        } else {
            gameCtx.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2);
        }
        gameCtx.fill();
        gameCtx.shadowBlur = 0;

        // Health bar
        if (this.hp < this.maxHp) {
            const barWidth = this.radius * 2;
            gameCtx.fillStyle = 'rgba(0,0,0,0.5)';
            gameCtx.fillRect(this.x - camera.x - this.radius, this.y - camera.y - this.radius - 10, barWidth, 4);
            gameCtx.fillStyle = '#ff4a6e';
            gameCtx.fillRect(this.x - camera.x - this.radius, this.y - camera.y - this.radius - 10, barWidth * (this.hp / this.maxHp), 4);
        }
    }
}
