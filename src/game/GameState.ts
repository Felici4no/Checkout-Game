// Simple event emitter for reactive updates
type Listener = () => void;

export class EventEmitter {
    private listeners: Map<string, Set<Listener>> = new Map();

    on(event: string, listener: Listener): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(listener);

        // Return unsubscribe function
        return () => {
            this.listeners.get(event)?.delete(listener);
        };
    }

    emit(event: string): void {
        this.listeners.get(event)?.forEach(listener => listener());
    }
}

// Central game state
export interface GameStateData {
    // Store info
    storeName: string;
    niche: string;

    // Financial
    cash: number;
    debt: number;

    // Inventory
    stock: number;
    price: number;

    // Metrics
    dailyVisits: number;
    dailyOrders: number;
    conversionRate: number;
    reputation: 'Good' | 'Average' | 'Poor';

    // Time
    currentDay: number;
    isPaused: boolean;

    // Tracking
    consecutiveNegativeDays: number;
    totalRevenue: number;

    // Installed software
    installedSoftware: string[];
}

export class GameState extends EventEmitter {
    public state: GameStateData; // Made public for EconomyEngine access

    constructor() {
        super();
        this.state = {
            storeName: 'My Store',
            niche: 'Electronics',
            cash: 500,
            debt: 0,
            stock: 50,
            price: 15,
            dailyVisits: 0,
            dailyOrders: 0,
            conversionRate: 0,
            reputation: 'Good',
            currentDay: 1,
            isPaused: false,
            consecutiveNegativeDays: 0,
            totalRevenue: 0,
            installedSoftware: [],
        };
    }

    get data(): Readonly<GameStateData> {
        return { ...this.state };
    }

    updateCash(amount: number): void {
        this.state.cash += amount;
        this.emit('cash-changed');
    }

    setCash(amount: number): void {
        this.state.cash = amount;
        this.emit('cash-changed');
    }

    updateStock(amount: number): void {
        this.state.stock = Math.max(0, this.state.stock + amount);
        this.emit('stock-changed');
    }

    setPrice(price: number): void {
        this.state.price = Math.max(1, price);
        this.emit('price-changed');
    }

    updateDebt(amount: number): void {
        this.state.debt = Math.max(0, this.state.debt + amount);
        this.emit('debt-changed');
    }

    setPaused(paused: boolean): void {
        this.state.isPaused = paused;
        this.emit('pause-changed');
    }

    advanceDay(): void {
        this.state.currentDay++;
        this.emit('day-changed');
    }

    setDailyMetrics(visits: number, orders: number, conversion: number): void {
        this.state.dailyVisits = visits;
        this.state.dailyOrders = orders;
        this.state.conversionRate = conversion;
        this.emit('metrics-changed');
    }

    trackNegativeDay(): void {
        if (this.state.cash < 0) {
            this.state.consecutiveNegativeDays++;
        } else {
            this.state.consecutiveNegativeDays = 0;
        }
    }

    isBankrupt(): boolean {
        return this.state.consecutiveNegativeDays >= 3;
    }
}
