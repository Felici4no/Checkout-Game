export class SystemClock {
    private element: HTMLElement;
    private intervalId: number | null = null;

    constructor(container: HTMLElement) {
        this.element = document.createElement('div');
        this.element.className = 'system-clock';
        container.appendChild(this.element);
        this.updateTime();
    }

    start(): void {
        if (this.intervalId !== null) return;
        this.intervalId = window.setInterval(() => this.updateTime(), 1000);
    }

    stop(): void {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    private updateTime(): void {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        this.element.textContent = `${hours}:${minutes}:${seconds}`;
    }
}
