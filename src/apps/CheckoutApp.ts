import { GameState } from '../game/GameState';
import { Window } from '../ui/Window';
import { ActivityTicker } from '../ui/ActivityTicker';
import { animateNumber, formatCurrency, createButton } from '../utils/helpers';

export class CheckoutApp {
    private window: Window;
    private gameState: GameState;
    private cashElement: HTMLElement | null = null;
    private dayElement: HTMLElement | null = null;
    private pauseButton: HTMLButtonElement | null = null;
    private activityTicker: ActivityTicker;
    private activityIntervalId: number | null = null;
    private previousCash = 500;

    constructor(gameState: GameState) {
        this.gameState = gameState;
        this.activityTicker = new ActivityTicker();
        this.window = new Window({
            title: `${gameState.data.storeName} — Checkout`,
            width: 500,
            height: 450,
            x: 100,
            y: 80,
        });

        this.buildUI();
        this.attachListeners();
        this.startActivitySimulation();
    }

    private buildUI(): void {
        const content = this.window.getContentArea();

        // Header with day and controls
        const header = document.createElement('div');
        header.className = 'checkout-header';

        this.dayElement = document.createElement('div');
        this.dayElement.className = 'checkout-day';
        this.dayElement.textContent = `Day ${this.gameState.data.currentDay}`;

        const controls = document.createElement('div');
        controls.className = 'checkout-controls';

        this.pauseButton = createButton('Pause', () => this.togglePause());
        controls.appendChild(this.pauseButton);

        header.appendChild(this.dayElement);
        header.appendChild(controls);

        // Cash metric (M1 - only one animated metric)
        const cashMetric = document.createElement('div');
        cashMetric.className = 'metric-display';

        const cashLabel = document.createElement('div');
        cashLabel.className = 'metric-label';
        cashLabel.textContent = '💰 CASH';

        this.cashElement = document.createElement('div');
        this.cashElement.className = 'metric-value';
        this.cashElement.textContent = formatCurrency(this.gameState.data.cash);

        cashMetric.appendChild(cashLabel);
        cashMetric.appendChild(this.cashElement);

        // Activity ticker
        const activityLabel = document.createElement('div');
        activityLabel.style.fontSize = '10px';
        activityLabel.style.fontWeight = 'bold';
        activityLabel.style.marginTop = '8px';
        activityLabel.textContent = 'ATIVIDADE DO E-COMMERCE';

        // Info text
        const info = document.createElement('div');
        info.style.fontSize = '11px';
        info.style.marginTop = '16px';
        info.style.padding = '8px';
        info.style.background = '#fff';
        info.style.border = '1px solid #808080';
        info.innerHTML = `
      <strong>M1 — Vertical Slice Demo</strong><br>
      Tempo rodando (20s = 1 dia).<br>
      Atividade simulada continuamente.
    `;

        content.appendChild(header);
        content.appendChild(cashMetric);
        content.appendChild(activityLabel);
        content.appendChild(this.activityTicker.getElement());
        content.appendChild(info);
    }

    private attachListeners(): void {
        // Listen for cash changes
        this.gameState.on('cash-changed', () => this.updateCash());

        // Listen for day changes
        this.gameState.on('day-changed', () => this.updateDay());

        // Listen for pause changes
        this.gameState.on('pause-changed', () => this.updatePauseButton());
    }

    private startActivitySimulation(): void {
        // Simulate activity every 2-5 seconds
        const simulate = () => {
            if (!this.gameState.data.isPaused) {
                this.activityTicker.simulateActivity();
            }
            const nextDelay = 2000 + Math.random() * 3000;
            this.activityIntervalId = window.setTimeout(simulate, nextDelay);
        };
        simulate();
    }

    private stopActivitySimulation(): void {
        if (this.activityIntervalId !== null) {
            clearTimeout(this.activityIntervalId);
            this.activityIntervalId = null;
        }
    }

    private updateCash(): void {
        if (!this.cashElement) return;

        const newCash = this.gameState.data.cash;
        animateNumber(this.cashElement, this.previousCash, newCash, 500, formatCurrency);
        this.previousCash = newCash;
    }

    private updateDay(): void {
        if (!this.dayElement) return;
        this.dayElement.textContent = `Day ${this.gameState.data.currentDay}`;
    }

    private togglePause(): void {
        const isPaused = this.gameState.data.isPaused;
        this.gameState.setPaused(!isPaused);
    }

    private updatePauseButton(): void {
        if (!this.pauseButton) return;
        const isPaused = this.gameState.data.isPaused;
        this.pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
    }

    getWindow(): Window {
        return this.window;
    }

    show(): void {
        this.window.show();
    }

    destroy(): void {
        this.stopActivitySimulation();
    }
}
