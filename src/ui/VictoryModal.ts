import { GameState } from '../game/GameState';

export class VictoryModal {
    private overlay: HTMLElement;

    constructor(
        challengeName: string,
        stats: {
            days: number;
            revenue: number;
            cash: number;
            reputation: string;
        },
        onContinue: () => void,
        onRestart: () => void
    ) {
        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: 'Press Start 2P', monospace;
    `;

        const modal = document.createElement('div');
        modal.style.cssText = `
      background: #C0C0C0;
      border: 4px solid #808080;
      padding: 24px;
      max-width: 500px;
      box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.5);
    `;

        // Title
        const title = document.createElement('div');
        title.style.cssText = `
      font-size: 20px;
      color: #0A0;
      text-align: center;
      margin-bottom: 16px;
      text-shadow: 2px 2px 0 #000;
    `;
        title.textContent = '🎉 VITÓRIA!';

        // Challenge name
        const challengeTitle = document.createElement('div');
        challengeTitle.style.cssText = `
      font-size: 12px;
      text-align: center;
      margin-bottom: 20px;
      color: #000;
    `;
        challengeTitle.textContent = challengeName;

        // Stats section
        const statsSection = document.createElement('div');
        statsSection.style.cssText = `
      background: #E0E0E0;
      border: 2px solid #808080;
      padding: 16px;
      margin-bottom: 20px;
      font-size: 9px;
      line-height: 1.8;
    `;

        statsSection.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: bold; border-bottom: 1px solid #808080; padding-bottom: 4px;">ESTATÍSTICAS FINAIS</div>
      <div>📅 Dias Sobrevividos: <strong>${stats.days}</strong></div>
      <div>💰 Revenue Total: <strong>$${stats.revenue}</strong></div>
      <div>💵 Caixa Final: <strong style="color: ${stats.cash >= 0 ? '#0A0' : '#C00'};">$${stats.cash.toFixed(0)}</strong></div>
      <div>⭐ Reputação: <strong>${stats.reputation}</strong></div>
    `;

        // Buttons
        const buttonsRow = document.createElement('div');
        buttonsRow.style.cssText = `
      display: flex;
      gap: 12px;
      justify-content: center;
    `;

        const continueButton = this.createButton('Continuar Jogando', onContinue);
        const restartButton = this.createButton('Reiniciar', onRestart);

        buttonsRow.appendChild(continueButton);
        buttonsRow.appendChild(restartButton);

        modal.appendChild(title);
        modal.appendChild(challengeTitle);
        modal.appendChild(statsSection);
        modal.appendChild(buttonsRow);

        this.overlay.appendChild(modal);
    }

    private createButton(text: string, onClick: () => void): HTMLButtonElement {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
      font-family: 'Press Start 2P', monospace;
      font-size: 8px;
      padding: 8px 12px;
      background: #C0C0C0;
      border: 2px outset #FFFFFF;
      cursor: pointer;
      color: #000;
    `;

        button.addEventListener('mousedown', () => {
            button.style.border = '2px inset #808080';
        });

        button.addEventListener('mouseup', () => {
            button.style.border = '2px outset #FFFFFF';
        });

        button.addEventListener('click', () => {
            onClick();
            this.hide();
        });

        return button;
    }

    show(parent: HTMLElement): void {
        parent.appendChild(this.overlay);
    }

    hide(): void {
        if (this.overlay.parentElement) {
            this.overlay.parentElement.removeChild(this.overlay);
        }
    }
}
