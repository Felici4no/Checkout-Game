export class ViralPopup {
    private overlay: HTMLElement;

    constructor(message: string, onClose: () => void) {
        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s;
    `;

        const content = document.createElement('div');
        content.style.cssText = `
      background: #C0C0C0;
      border: 4px solid #000;
      padding: 20px;
      box-shadow: 4px 4px 0 #000;
      text-align: center;
      min-width: 350px;
      max-width: 500px;
    `;

        const icon = document.createElement('div');
        icon.style.cssText = `
      font-size: 48px;
      margin-bottom: 12px;
    `;
        icon.textContent = '🔥';

        const messageText = document.createElement('div');
        messageText.style.cssText = `
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 16px;
      line-height: 1.4;
    `;
        messageText.textContent = message;

        const okButton = document.createElement('button');
        okButton.textContent = 'OK';
        okButton.style.cssText = `
      padding: 6px 24px;
      font-size: 12px;
      font-weight: bold;
      background: #C0C0C0;
      border: 2px outset #DFDFDF;
      cursor: pointer;
    `;
        okButton.onclick = () => {
            this.hide();
            onClose();
        };

        content.appendChild(icon);
        content.appendChild(messageText);
        content.appendChild(okButton);
        this.overlay.appendChild(content);
    }

    show(container: HTMLElement): void {
        container.appendChild(this.overlay);
    }

    hide(): void {
        if (this.overlay.parentElement) {
            this.overlay.parentElement.removeChild(this.overlay);
        }
    }
}
