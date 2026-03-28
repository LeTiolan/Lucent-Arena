// js/ui.js
import { GameState } from './systems.js';
import { Renderer, settings } from './renderer.js';
import { AudioSystem } from './audio.js';

export const UI = {
    elements: {
        hpBar: document.getElementById('hp-bar'),
        hpText: document.getElementById('hp-text'),
        energyBar: document.getElementById('energy-bar'),
        energyText: document.getElementById('energy-text'),
        xpBar: document.getElementById('xp-bar'),
        xpText: document.getElementById('xp-text'),
        levelText: document.getElementById('level-text'),
        scoreText: document.getElementById('score-text'),
        timeText: document.getElementById('time-text'),
        menusLayer: document.getElementById('menus-layer'),
        pauseMenu: document.getElementById('pause-menu'),
        inventoryPanel: document.getElementById('inventory-panel'),
        skillsPanel: document.getElementById('skills-panel'),
        shopPanel: document.getElementById('shop-panel'),
        settingsPanel: document.getElementById('settings-panel'),
        gameOverScreen: document.getElementById('game-over-screen'),
        inventoryGrid: document.getElementById('inventory-grid'),
        skillsContainer: document.getElementById('skills-container'),
        spText: document.getElementById('sp-text'),
        shopItems: document.getElementById('shop-items'),
        questList: document.getElementById('quest-list'),
        tooltip: document.getElementById('tooltip')
    },

    inventory: new Array(30).fill(null),
    
    skills: [
        { id: 'spd', name: 'Agility', desc: '+10% Movement Speed', cost: 1, level: 0, max: 5 },
        { id: 'dmg', name: 'Firepower', desc: '+5 Base Damage', cost: 1, level: 0, max: 10 },
        { id: 'hp', name: 'Hull Integrity', desc: '+20 Max HP', cost: 1, level: 0, max: 10 },
        { id: 'nrg', name: 'Capacitor', desc: '+10 Max Energy', cost: 1, level: 0, max: 5 },
        { id: 'rgn', name: 'Dynamo', desc: '+10% Energy Regen', cost: 2, level: 0, max: 3 }
    ],

    shopData: [
        { id: 'heal', name: 'Repair Kit', desc: 'Restores 50 HP', price: 500 },
        { id: 'nrg_pack', name: 'Energy Cell', desc: 'Restores 50 Energy', price: 300 },
        { id: 'shield', name: 'Overshield', desc: 'Temporary Invulnerability', price: 1500 }
    ],

    init: () => {
        // Build Inventory UI
        UI.elements.inventoryGrid.innerHTML = '';
        for (let i = 0; i < 30; i++) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot';
            slot.dataset.index = i;
            slot.addEventListener('mouseenter', (e) => UI.showTooltip(e, `Empty Slot ${i+1}`));
            slot.addEventListener('mouseleave', UI.hideTooltip);
            UI.elements.inventoryGrid.appendChild(slot);
        }

        // Setup Buttons
        document.getElementById('btn-resume').addEventListener('click', () => UI.togglePause());
        document.getElementById('btn-skills').addEventListener('click', () => UI.openPanel('skills'));
        document.getElementById('btn-inventory').addEventListener('click', () => UI.openPanel('inventory'));
        document.getElementById('btn-shop').addEventListener('click', () => UI.openPanel('shop'));
        document.getElementById('btn-settings').addEventListener('click', () => UI.openPanel('settings'));
        document.getElementById('btn-restart').addEventListener('click', () => location.reload());

        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.getAttribute('data-target');
                document.getElementById(target).classList.add('hidden');
                if (target !== 'pause-menu') {
                    UI.elements.pauseMenu.classList.remove('hidden');
                }
            });
        });

        // Setup Settings
        document.getElementById('vol-master').addEventListener('input', (e) => AudioSystem.setMasterVolume(e.target.value));
        document.getElementById('vol-music').addEventListener('input', (e) => AudioSystem.setMusicVolume(e.target.value));
        document.getElementById('vol-sfx').addEventListener('input', (e) => AudioSystem.setSFXVolume(e.target.value));
        
        document.getElementById('toggle-bloom').addEventListener('change', (e) => settings.bloom = e.target.checked);
        document.getElementById('toggle-particles').addEventListener('change', (e) => settings.particles = e.target.checked);
        document.getElementById('toggle-screenshake').addEventListener('change', (e) => settings.screenshake = e.target.checked);

        UI.updateSkillsUI();
        UI.updateShopUI();
        UI.updateQuests();
    },

    updateHUD: () => {
        const p = GameState.player;
        if (!p) return;

        // HP
        const hpPct = Math.max(0, (p.hp / p.maxHp) * 100);
        UI.elements.hpBar.style.width = `${hpPct}%`;
        UI.elements.hpText.innerText = `${Math.ceil(Math.max(0, p.hp))} / ${p.maxHp}`;

        // Energy
        const nrgPct = Math.max(0, (p.energy / p.maxEnergy) * 100);
        UI.elements.energyBar.style.width = `${nrgPct}%`;
        UI.elements.energyText.innerText = `${Math.floor(p.energy)} / ${p.maxEnergy}`;

        // XP
        const xpPct = Math.min(100, (p.xp / p.xpNeeded) * 100);
        UI.elements.xpBar.style.width = `${xpPct}%`;
        UI.elements.xpText.innerText = `${Math.floor(p.xp)} / ${p.xpNeeded}`;
        
        // General Stats
        UI.elements.levelText.innerText = p.level;
        UI.elements.scoreText.innerText = GameState.score;
        
        const minutes = Math.floor(GameState.timeAlive / 60).toString().padStart(2, '0');
        const seconds = (GameState.timeAlive % 60).toString().padStart(2, '0');
        UI.elements.timeText.innerText = `${minutes}:${seconds}`;

        // Update Skill Points in UI if panel is open
        UI.elements.spText.innerText = p.skillPoints;
    },

    togglePause: () => {
        if (GameState.isGameOver) return;
        GameState.isPaused = !GameState.isPaused;
        
        if (GameState.isPaused) {
            UI.elements.menusLayer.classList.remove('hidden');
            UI.elements.pauseMenu.classList.remove('hidden');
            // Hide all other panels
            ['inventory-panel', 'skills-panel', 'shop-panel', 'settings-panel'].forEach(id => {
                document.getElementById(id).classList.add('hidden');
            });
        } else {
            UI.elements.menusLayer.classList.add('hidden');
        }
    },

    openPanel: (type) => {
        UI.elements.pauseMenu.classList.add('hidden');
        document.getElementById(`${type}-panel`).classList.remove('hidden');
        if (type === 'skills') UI.updateSkillsUI();
    },

    showGameOver: () => {
        UI.elements.menusLayer.classList.remove('hidden');
        UI.elements.pauseMenu.classList.add('hidden');
        UI.elements.gameOverScreen.classList.remove('hidden');
        
        document.getElementById('final-score').innerText = GameState.score;
        const minutes = Math.floor(GameState.timeAlive / 60).toString().padStart(2, '0');
        const seconds = (GameState.timeAlive % 60).toString().padStart(2, '0');
        document.getElementById('final-time').innerText = `${minutes}:${seconds}`;
        // Count enemies killed can be tracked in GameState, for now derived from score/xp loosely
        document.getElementById('final-kills').innerText = Math.floor(GameState.score / 150); 
        document.getElementById('final-level').innerText = GameState.player.level;
    },

    updateSkillsUI: () => {
        UI.elements.skillsContainer.innerHTML = '';
        UI.skills.forEach(skill => {
            const div = document.createElement('div');
            div.className = 'skill-item menu-btn';
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.style.marginBottom = '10px';
            
            div.innerHTML = `
                <div style="text-align: left;">
                    <div style="color: var(--energy-color); font-weight: bold;">${skill.name} (Lv ${skill.level}/${skill.max})</div>
                    <div style="font-size: 12px; color: var(--text-muted);">${skill.desc}</div>
                </div>
                <div style="font-size: 12px; color: ${GameState.player && GameState.player.skillPoints >= skill.cost ? 'var(--xp-color)' : 'var(--text-muted)'};">Cost: ${skill.cost} SP</div>
            `;
            
            div.addEventListener('click', () => {
                if (GameState.player && GameState.player.skillPoints >= skill.cost && skill.level < skill.max) {
                    GameState.player.skillPoints -= skill.cost;
                    skill.level++;
                    UI.applySkill(skill.id);
                    UI.updateSkillsUI();
                }
            });
            UI.elements.skillsContainer.appendChild(div);
        });
    },

    applySkill: (id) => {
        const p = GameState.player;
        switch(id) {
            case 'spd': p.speed *= 1.1; break;
            case 'dmg': p.damage += 5; break;
            case 'hp': p.maxHp += 20; p.hp += 20; break;
            case 'nrg': p.maxEnergy += 10; p.energy += 10; break;
            case 'rgn': p.energyRegen *= 1.1; break;
        }
    },

    updateShopUI: () => {
        UI.elements.shopItems.innerHTML = '';
        UI.shopData.forEach(item => {
            const div = document.createElement('div');
            div.className = 'shop-item menu-btn';
            div.style.padding = '15px';
            div.style.marginBottom = '10px';
            div.innerHTML = `
                <div style="color: var(--energy-color); font-weight: bold;">${item.name}</div>
                <div style="font-size: 12px; color: var(--text-muted); margin: 5px 0;">${item.desc}</div>
                <div style="color: var(--xp-color);">Cost: ${item.price} Score</div>
            `;
            div.addEventListener('click', () => {
                if (GameState.score >= item.price) {
                    GameState.score -= item.price;
                    // Apply item effect immediately for prototype
                    if (item.id === 'heal' && GameState.player) GameState.player.hp = Math.min(GameState.player.maxHp, GameState.player.hp + 50);
                    if (item.id === 'nrg_pack' && GameState.player) GameState.player.energy = Math.min(GameState.player.maxEnergy, GameState.player.energy + 50);
                    UI.updateHUD();
                }
            });
            UI.elements.shopItems.appendChild(div);
        });
    },

    updateQuests: () => {
        UI.elements.questList.innerHTML = `
            <li>Survive for 5 minutes</li>
            <li>Reach Level 10</li>
            <li>Eliminate Boss Entity</li>
        `;
    },

    showTooltip: (e, text) => {
        UI.elements.tooltip.innerText = text;
        UI.elements.tooltip.classList.remove('hidden');
        UI.elements.tooltip.style.left = `${e.pageX + 15}px`;
        UI.elements.tooltip.style.top = `${e.pageY + 15}px`;
    },

    hideTooltip: () => {
        UI.elements.tooltip.classList.add('hidden');
    }
};
