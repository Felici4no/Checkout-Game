export type ActivityType = 'success' | 'warning' | 'error' | 'info';

export interface ActivityMessage {
    text: string;
    type: ActivityType;
    timestamp: Date;
}

export class ActivityTicker {
    private container: HTMLElement;
    private messages: ActivityMessage[] = [];
    private maxMessages = 20;

    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'activity-ticker';
    }

    getElement(): HTMLElement {
        return this.container;
    }

    addMessage(text: string, type: ActivityType = 'info'): void {
        const message: ActivityMessage = {
            text,
            type,
            timestamp: new Date(),
        };

        this.messages.push(message);

        // Keep only last N messages
        if (this.messages.length > this.maxMessages) {
            this.messages.shift();
        }

        this.render();
    }

    private render(): void {
        // Clear container
        this.container.innerHTML = '';

        // Show last 5 messages
        const recentMessages = this.messages.slice(-5);

        recentMessages.forEach((msg) => {
            const item = document.createElement('div');
            item.className = `activity-item ${msg.type}`;

            const time = msg.timestamp.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });

            item.textContent = `[${time}] ${msg.text}`;
            this.container.appendChild(item);
        });

        // Auto-scroll to bottom
        this.container.scrollTop = this.container.scrollHeight;
    }

    simulateActivity(): void {
        const activities = [
            { text: 'Visitante acessou página inicial', type: 'info' as ActivityType },
            { text: 'Produto adicionado ao carrinho', type: 'success' as ActivityType },
            { text: 'Pedido #1234 processado', type: 'success' as ActivityType },
            { text: 'Estoque baixo: 5 unidades restantes', type: 'warning' as ActivityType },
            { text: 'Visitante abandonou carrinho', type: 'info' as ActivityType },
            { text: 'Pagamento aprovado', type: 'success' as ActivityType },
        ];

        const randomActivity = activities[Math.floor(Math.random() * activities.length)];
        this.addMessage(randomActivity.text, randomActivity.type);
    }
}
