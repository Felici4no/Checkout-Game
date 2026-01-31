import { GameState } from './GameState';

export interface IncomingStockEntry {
    amount: number;
    arrivalDay: number;
}

export class IncomingStockSystem {
    private gameState: GameState;

    constructor(gameState: GameState) {
        this.gameState = gameState;
    }

    /**
     * Create a stock order with lead time based on supplier
     * @param amount Quantity to order
     * @param supplier 'fast' (1 day) or 'cheap' (2 days)
     */
    orderStock(amount: number, supplier: 'fast' | 'cheap'): void {
        const leadTime = this.getLeadTime(supplier);
        const arrivalDay = this.gameState.data.currentDay + leadTime;

        // Add to incoming stock queue
        this.gameState.data.incomingStock.push({
            amount,
            arrivalDay,
        });

        // Emit event for UI updates
        this.gameState.emit('incoming-stock-changed');

        console.log(`[IncomingStock] Ordered ${amount} units, arriving on day ${arrivalDay} (${leadTime} day lead time)`);
    }

    /**
     * Process all arrivals for the current day
     * Called at the START of the day, BEFORE processing orders
     * @returns Total amount received today
     */
    processArrivals(): number {
        const currentDay = this.gameState.data.currentDay;
        let totalReceived = 0;

        // Find all arrivals for today
        const arrivals = this.gameState.data.incomingStock.filter(
            entry => entry.arrivalDay === currentDay
        );

        // Sum up received stock
        totalReceived = arrivals.reduce((sum, entry) => sum + entry.amount, 0);

        // Remove processed arrivals
        this.gameState.data.incomingStock = this.gameState.data.incomingStock.filter(
            entry => entry.arrivalDay !== currentDay
        );

        if (totalReceived > 0) {
            console.log(`[IncomingStock] Received ${totalReceived} units on day ${currentDay}`);
            this.gameState.emit('incoming-stock-changed');
        }

        return totalReceived;
    }

    /**
     * Calculate total pending stock (all future arrivals)
     * @returns Total amount in transit
     */
    getPendingTotal(): number {
        return this.gameState.data.incomingStock.reduce(
            (sum, entry) => sum + entry.amount,
            0
        );
    }

    /**
     * Get lead time in days based on supplier
     * @param supplier 'fast' or 'cheap'
     * @returns Lead time in days
     */
    private getLeadTime(supplier: 'fast' | 'cheap'): number {
        return supplier === 'fast' ? 1 : 2;
    }

    /**
     * Get human-readable arrival message
     * @param supplier 'fast' or 'cheap'
     * @returns Message like "chega amanhã" or "chega em 2 dias"
     */
    getArrivalMessage(supplier: 'fast' | 'cheap'): string {
        const leadTime = this.getLeadTime(supplier);
        return leadTime === 1 ? 'chega amanhã' : 'chega em 2 dias';
    }
}
