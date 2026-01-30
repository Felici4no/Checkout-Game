export class DayTransitionOverlay {
    private overlay: HTMLElement;

    constructor() {
        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.2s;
    `;

        const content = document.createElement('div');
        content.style.cssText = `
      background: #C0C0C0;
      border: 4px solid #000;
      padding: 24px;
      box-shadow: 4px 4px 0 #000;
      text-align: center;
      min-width: 300px;
    `;

        const dayText = document.createElement('div');
        dayText.className = 'day-transition-text';
        dayText.style.cssText = `
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 16px;
    `;

        const summaryText = document.createElement('div');
        summaryText.className = 'day-transition-summary';
        summaryText.style.cssText = `
      font-size: 12px;
      font-family: 'Courier New', monospace;
      line-height: 1.6;
    `;

        content.appendChild(dayText);
        content.appendChild(summaryText);
        this.overlay.appendChild(content);
    }

    getElement(): HTMLElement {
        return this.overlay;
    }

    show(day: number, summary: { revenue: number; costs: number; interest: number; net: number }): void {
        const dayText = this.overlay.querySelector('.day-transition-text') as HTMLElement;
        const summaryText = this.overlay.querySelector('.day-transition-summary') as HTMLElement;

        dayText.textContent = `DIA ${day}`;

        const netColor = summary.net >= 0 ? '#0A0' : '#C00';
        summaryText.innerHTML = `
      Receita: <strong>$${summary.revenue.toFixed(2)}</strong><br>
      Custos: <strong>$${summary.costs.toFixed(2)}</strong><br>
      Juros: <strong>$${summary.interest.toFixed(2)}</strong><br>
      <span style="color: ${netColor}; font-size: 14px;">
        Líquido: <strong>$${summary.net.toFixed(2)}</strong>
      </span>
    `;

        this.overlay.style.display = 'flex';

        // Auto-hide after 1.5 seconds
        setTimeout(() => {
            this.hide();
        }, 1500);
    }

    hide(): void {
        this.overlay.style.display = 'none';
    }
}
