import { GameState } from '../game/GameState';

export class DayProgressBar {
    private container: HTMLElement;
    private progressBar: HTMLElement;
    private progressText: HTMLElement;

    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'day-progress-container';
        this.container.style.cssText = `
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      width: 200px;
      background: #C0C0C0;
      border: 2px solid #000;
      padding: 4px;
      box-shadow: 2px 2px 0 #000;
      z-index: 100;
    `;

        const label = document.createElement('div');
        label.style.cssText = `
      font-size: 9px;
      font-weight: bold;
      margin-bottom: 2px;
      text-align: center;
    `;
        label.textContent = 'PROGRESSO DO DIA';

        const barContainer = document.createElement('div');
        barContainer.style.cssText = `
      width: 100%;
      height: 16px;
      background: #fff;
      border: 1px solid #808080;
      position: relative;
      overflow: hidden;
    `;

        this.progressBar = document.createElement('div');
        this.progressBar.style.cssText = `
      height: 100%;
      width: 0%;
      background: linear-gradient(to bottom, #0A0, #080);
      transition: width 0.1s linear, background 0.3s;
    `;

        this.progressText = document.createElement('div');
        this.progressText.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
      color: #000;
      text-shadow: 1px 1px 0 #fff;
    `;
        this.progressText.textContent = '0%';

        barContainer.appendChild(this.progressBar);
        barContainer.appendChild(this.progressText);

        this.container.appendChild(label);
        this.container.appendChild(barContainer);
    }

    getElement(): HTMLElement {
        return this.container;
    }

    updateProgress(percentage: number): void {
        const clamped = Math.min(100, Math.max(0, percentage));
        this.progressBar.style.width = `${clamped}%`;
        this.progressText.textContent = `${Math.floor(clamped)}%`;

        // Change color when approaching day end
        if (clamped >= 90) {
            this.progressBar.style.background = 'linear-gradient(to bottom, #F00, #C00)';
        } else if (clamped >= 75) {
            this.progressBar.style.background = 'linear-gradient(to bottom, #FA0, #C80)';
        } else {
            this.progressBar.style.background = 'linear-gradient(to bottom, #0A0, #080)';
        }
    }

    flash(): void {
        // Flash effect on day end
        this.progressBar.style.background = '#FF0';
        setTimeout(() => {
            this.progressBar.style.background = 'linear-gradient(to bottom, #0A0, #080)';
        }, 200);
    }
}
