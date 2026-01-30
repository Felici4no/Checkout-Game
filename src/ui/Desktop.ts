import { SystemClock } from './SystemClock';

export class Desktop {
    private element: HTMLElement;
    private systemTray: HTMLElement;
    private iconsContainer: HTMLElement;
    private clock: SystemClock;

    constructor() {
        // Main desktop
        this.element = document.createElement('div');
        this.element.className = 'desktop';

        // Desktop icons area
        this.iconsContainer = document.createElement('div');
        this.iconsContainer.className = 'desktop-icons';
        this.element.appendChild(this.iconsContainer);

        // System tray (bottom bar with clock)
        this.systemTray = document.createElement('div');
        this.systemTray.className = 'system-tray';
        this.element.appendChild(this.systemTray);

        // System clock
        this.clock = new SystemClock(this.systemTray);
        this.clock.start();
    }

    addIcon(label: string, icon: string, onClick: () => void): void {
        const iconElement = document.createElement('div');
        iconElement.className = 'desktop-icon';

        const iconImage = document.createElement('div');
        iconImage.className = 'desktop-icon-image';
        iconImage.textContent = icon;

        const iconLabel = document.createElement('div');
        iconLabel.className = 'desktop-icon-label';
        iconLabel.textContent = label;

        iconElement.appendChild(iconImage);
        iconElement.appendChild(iconLabel);
        iconElement.addEventListener('click', onClick);

        this.iconsContainer.appendChild(iconElement);
    }

    getElement(): HTMLElement {
        return this.element;
    }

    appendChild(child: HTMLElement): void {
        this.element.appendChild(child);
    }
}
