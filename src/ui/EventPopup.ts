import { GameEvent } from '../game/EventSystem';

export class EventPopup {
    private overlay: HTMLElement;

    constructor(event: GameEvent, onClose: () => void) {
        this.overlay = document.createElement('div');
        this.overlay.className = 'game-over-overlay';
        this.overlay.style.zIndex = '10000';

        const window = document.createElement('div');
        window.className = 'game-over-window';
        window.style.minWidth = '350px';

        // Title bar
        const titleBar = document.createElement('div');
        titleBar.className = 'game-over-title-bar';
        titleBar.innerHTML = '⚠️ Evento';

        // Content
        const content = document.createElement('div');
        content.className = 'game-over-content';
        content.style.padding = '16px';

        const icon = document.createElement('div');
        icon.style.fontSize = '32px';
        icon.style.marginBottom = '12px';
        icon.textContent = '📢';

        const title = document.createElement('div');
        title.style.fontSize = '14px';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '8px';
        title.textContent = event.title;

        const message = document.createElement('div');
        message.style.fontSize = '11px';
        message.style.marginBottom = '16px';
        message.style.padding = '8px';
        message.style.background = '#FFC';
        message.style.border = '1px solid #CC0';
        message.textContent = event.message;

        const button = document.createElement('button');
        button.className = 'retro-button';
        button.textContent = 'OK';
        button.style.width = '100%';
        button.addEventListener('click', () => {
            this.hide();
            onClose();
        });

        content.appendChild(icon);
        content.appendChild(title);
        content.appendChild(message);
        content.appendChild(button);

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
