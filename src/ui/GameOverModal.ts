import { GameState } from '../game/GameState';
import { createButton } from '../utils/helpers';

export class GameOverModal {
    private overlay: HTMLElement;

    constructor(gameState: GameState, onRestart: () => void) {
        this.overlay = document.createElement('div');
        this.overlay.className = 'game-over-overlay';

        const window = document.createElement('div');
        window.className = 'game-over-window';

        // Title bar
        const titleBar = document.createElement('div');
        titleBar.className = 'game-over-title-bar';
        titleBar.innerHTML = '⚠️ Sistema';

        // Content
        const content = document.createElement('div');
        content.className = 'game-over-content';

        const icon = document.createElement('div');
        icon.className = 'game-over-icon';
        icon.textContent = '💀';

        const title = document.createElement('div');
        title.className = 'game-over-title';
        title.textContent = 'FALÊNCIA';

        const message = document.createElement('div');
        message.style.marginBottom = '12px';
        message.textContent = 'Seu negócio faliu.';

        // Stats
        const stats = document.createElement('div');
        stats.className = 'game-over-stats';

        const daysStat = document.createElement('div');
        daysStat.className = 'game-over-stat';
        daysStat.innerHTML = `<span>Dias sobrevividos:</span><strong>${gameState.data.currentDay}</strong>`;

        const cashStat = document.createElement('div');
        cashStat.className = 'game-over-stat';
        cashStat.innerHTML = `<span>Caixa final:</span><strong style="color: #C00;">$${gameState.data.cash.toFixed(2)}</strong>`;

        const revenueStat = document.createElement('div');
        revenueStat.className = 'game-over-stat';
        revenueStat.innerHTML = `<span>Receita total:</span><strong>$${gameState.data.totalRevenue.toFixed(2)}</strong>`;

        stats.appendChild(daysStat);
        stats.appendChild(cashStat);
        stats.appendChild(revenueStat);

        // Buttons
        const buttons = document.createElement('div');
        buttons.className = 'game-over-buttons';

        const restartBtn = createButton('Tentar Novamente', () => {
            onRestart();
        });

        buttons.appendChild(restartBtn);

        content.appendChild(icon);
        content.appendChild(title);
        content.appendChild(message);
        content.appendChild(stats);
        content.appendChild(buttons);

        window.appendChild(titleBar);
        window.appendChild(content);
        this.overlay.appendChild(window);
    }

    show(container: HTMLElement): void {
        container.appendChild(this.overlay);
    }

    hide(): void {
        this.overlay.remove();
    }
}
