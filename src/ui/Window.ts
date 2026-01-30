export interface WindowConfig {
    title: string;
    width?: number;
    height?: number;
    x?: number;
    y?: number;
}

export class Window {
    private element: HTMLElement;
    private titleBar: HTMLElement;
    private contentArea: HTMLElement;
    private isMinimized = false;
    private onCloseCallback?: () => void;

    constructor(config: WindowConfig) {
        this.element = document.createElement('div');
        this.element.className = 'window';
        this.element.style.width = `${config.width || 500}px`;
        this.element.style.height = `${config.height || 400}px`;
        this.element.style.left = `${config.x || 50}px`;
        this.element.style.top = `${config.y || 50}px`;

        // Title bar
        this.titleBar = document.createElement('div');
        this.titleBar.className = 'window-title-bar';

        const titleText = document.createElement('div');
        titleText.className = 'window-title';
        titleText.textContent = config.title;

        const controls = document.createElement('div');
        controls.className = 'window-controls';

        // Minimize button
        const minimizeBtn = document.createElement('button');
        minimizeBtn.className = 'window-button';
        minimizeBtn.textContent = '_';
        minimizeBtn.addEventListener('click', () => this.minimize());

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'window-button';
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', () => this.close());

        controls.appendChild(minimizeBtn);
        controls.appendChild(closeBtn);

        this.titleBar.appendChild(titleText);
        this.titleBar.appendChild(controls);

        // Content area
        this.contentArea = document.createElement('div');
        this.contentArea.className = 'window-content';

        this.element.appendChild(this.titleBar);
        this.element.appendChild(this.contentArea);
    }

    getElement(): HTMLElement {
        return this.element;
    }

    getContentArea(): HTMLElement {
        return this.contentArea;
    }

    show(): void {
        this.element.style.display = 'block';
        this.isMinimized = false;
    }

    hide(): void {
        this.element.style.display = 'none';
    }

    minimize(): void {
        this.isMinimized = !this.isMinimized;
        this.contentArea.style.display = this.isMinimized ? 'none' : 'block';
        this.element.style.height = this.isMinimized ? '28px' : '';
    }

    close(): void {
        this.hide();
        if (this.onCloseCallback) {
            this.onCloseCallback();
        }
    }

    onClose(callback: () => void): void {
        this.onCloseCallback = callback;
    }

    setTitle(title: string): void {
        const titleElement = this.titleBar.querySelector('.window-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }
}
