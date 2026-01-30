import { ChallengeType, CHALLENGES } from '../game/ChallengeSystem';

export class ChallengeSelector {
    private overlay: HTMLElement;
    private onSelect: (challenge: ChallengeType) => void;

    constructor(onSelect: (challenge: ChallengeType) => void) {
        this.onSelect = onSelect;

        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
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
      max-width: 600px;
      box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.5);
    `;

        // Title
        const title = document.createElement('div');
        title.style.cssText = `
      font-size: 16px;
      text-align: center;
      margin-bottom: 20px;
      color: #000;
    `;
        title.textContent = 'SELECIONE UM DESAFIO';

        // Description
        const desc = document.createElement('div');
        desc.style.cssText = `
      font-size: 8px;
      text-align: center;
      margin-bottom: 20px;
      color: #404040;
      line-height: 1.6;
    `;
        desc.textContent = 'Escolha um objetivo para sua run ou jogue livremente sem metas.';

        // Challenges list
        const challengesList = document.createElement('div');
        challengesList.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    `;

        // Add "Jogar Livre" first
        challengesList.appendChild(this.createChallengeButton('none'));

        // Add other challenges
        challengesList.appendChild(this.createChallengeButton('first_profit'));
        challengesList.appendChild(this.createChallengeButton('survivor'));
        challengesList.appendChild(this.createChallengeButton('reputation_master'));
        challengesList.appendChild(this.createChallengeButton('growth_hacker'));

        modal.appendChild(title);
        modal.appendChild(desc);
        modal.appendChild(challengesList);

        this.overlay.appendChild(modal);
    }

    private createChallengeButton(challengeId: ChallengeType): HTMLElement {
        const challenge = CHALLENGES[challengeId];

        const button = document.createElement('button');
        button.style.cssText = `
      font-family: 'Press Start 2P', monospace;
      font-size: 9px;
      padding: 12px;
      background: ${challengeId === 'none' ? '#E0E0E0' : '#C0C0C0'};
      border: 2px outset #FFFFFF;
      cursor: pointer;
      text-align: left;
      color: #000;
      line-height: 1.6;
    `;

        const nameDiv = document.createElement('div');
        nameDiv.style.cssText = `
      font-weight: bold;
      margin-bottom: 6px;
      color: ${challengeId === 'none' ? '#606060' : '#000'};
    `;
        nameDiv.textContent = challenge.name;

        const descDiv = document.createElement('div');
        descDiv.style.cssText = `
      font-size: 7px;
      color: #404040;
    `;
        descDiv.textContent = challenge.description;

        button.appendChild(nameDiv);
        button.appendChild(descDiv);

        button.addEventListener('mousedown', () => {
            button.style.border = '2px inset #808080';
        });

        button.addEventListener('mouseup', () => {
            button.style.border = '2px outset #FFFFFF';
        });

        button.addEventListener('click', () => {
            this.onSelect(challengeId);
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
