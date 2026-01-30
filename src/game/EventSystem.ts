import { GameState } from './GameState';
import { EconomyEngine } from './EconomyEngine';

export interface GameEvent {
    id: string;
    title: string;
    message: string;
    effect: (gameState: GameState, economyEngine: EconomyEngine) => void;
}

export const GAME_EVENTS: GameEvent[] = [
    {
        id: 'supplier_delay',
        title: 'Atraso do Fornecedor',
        message: 'Seu fornecedor atrasou a entrega. Reputação afetada.',
        effect: (gameState, economyEngine) => {
            economyEngine.adjustReputation(-0.1);
        },
    },
    {
        id: 'defective_product',
        title: 'Produto com Defeito',
        message: 'Lote com defeito detectado. 20% do estoque perdido.',
        effect: (gameState, economyEngine) => {
            const loss = Math.floor(gameState.data.stock * 0.2);
            gameState.updateStock(-loss);
            economyEngine.adjustReputation(-0.15);
        },
    },
    {
        id: 'visit_spike',
        title: 'Pico de Visitas',
        message: 'Campanha viral! +50% de visitas hoje.',
        effect: (gameState, economyEngine) => {
            // This will be applied in the next day calculation
            // We'll add a temporary modifier
            const currentVisits = gameState.data.dailyVisits;
            gameState.setDailyMetrics(
                Math.floor(currentVisits * 1.5),
                gameState.data.dailyOrders,
                gameState.data.conversionRate
            );
        },
    },
    {
        id: 'public_complaint',
        title: 'Reclamação Pública',
        message: 'Cliente insatisfeito fez reclamação pública. Reputação severamente afetada.',
        effect: (gameState, economyEngine) => {
            economyEngine.adjustReputation(-0.2);
        },
    },
    {
        id: 'cost_increase',
        title: 'Aumento de Custos',
        message: 'Custos operacionais aumentaram. -$50 adicional.',
        effect: (gameState, economyEngine) => {
            gameState.updateCash(-50);
        },
    },
];

export class EventSystem {
    private gameState: GameState;
    private economyEngine: EconomyEngine;
    private eventProbability = 0.2; // 20% chance per day
    private lastEventDay = 0;

    constructor(gameState: GameState, economyEngine: EconomyEngine) {
        this.gameState = gameState;
        this.economyEngine = economyEngine;
    }

    checkForEvent(): GameEvent | null {
        const currentDay = this.gameState.data.currentDay;

        // Don't trigger events on consecutive days
        if (currentDay - this.lastEventDay < 2) {
            return null;
        }

        // Random chance
        if (Math.random() > this.eventProbability) {
            return null;
        }

        // Select random event
        const event = GAME_EVENTS[Math.floor(Math.random() * GAME_EVENTS.length)];
        this.lastEventDay = currentDay;

        return event;
    }

    triggerEvent(event: GameEvent): void {
        event.effect(this.gameState, this.economyEngine);
        this.gameState.emit('event-triggered');
    }
}
