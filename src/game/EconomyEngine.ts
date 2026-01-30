import { GameState } from './GameState';
import { StockBot } from './StockBot';
import { MarketingSystem } from './MarketingSystem';
import { CapacitySystem } from './CapacitySystem';

export type SupplierType = 'fast' | 'cheap';

export interface EconomyConfig {
    // Base rates
    baseVisitsMin: number;
    baseVisitsMax: number;
    baseConversionRate: number;

    // Costs
    stockPurchaseCost: number;
    stockPurchaseAmount: number;
    dailyFixedCost: number;

    // Price impact
    priceElasticity: number; // How much price affects conversion

    // Supplier impact
    fastSupplierDelay: number;
    cheapSupplierDelay: number;
    fastSupplierReputationBonus: number;
    cheapSupplierReputationPenalty: number;
}

export const DEFAULT_ECONOMY_CONFIG: EconomyConfig = {
    baseVisitsMin: 120,
    baseVisitsMax: 220,
    baseConversionRate: 0.06, // 6% - permite break-even com decisões razoáveis

    stockPurchaseCost: 100,
    stockPurchaseAmount: 50,
    dailyFixedCost: 30, // Reduzido de 50 para 30

    priceElasticity: 0.0015, // Reduzido de 0.003 para 0.0015 (±$1 = ±0.15%)

    fastSupplierDelay: 0,
    cheapSupplierDelay: 1,
    fastSupplierReputationBonus: 0.02, // Aumentado de 0.01 para 0.02
    cheapSupplierReputationPenalty: -0.01,
};

export class EconomyEngine {
    private gameState: GameState;
    private config: EconomyConfig;
    private supplier: SupplierType = 'fast';
    private reputationScore = 1.0; // 1.0 = Good, 0.5 = Average, 0.0 = Poor
    private stockBot: StockBot | null = null;
    private marketingSystem: MarketingSystem | null = null;
    private capacitySystem: CapacitySystem | null = null;


    // Daily financial summary for player feedback
    public lastDailySummary: {
        revenue: number;
        costs: number;
        interest: number;
        net: number;
        lostOrders: number; // Lost to stock shortage
        reputationImpact: number; // Reputation change from lost orders
        processedOrders: number; // Actually processed
        overflowCreated: number; // Overflow created today
        lostToCapacity: number; // Lost due to capacity limit
        employeeSalary: number; // Employee salary paid
        employeeWorked: boolean; // Did employee work today
    } = {
            revenue: 0,
            costs: 0,
            interest: 0,
            net: 0,
            lostOrders: 0,
            reputationImpact: 0,
            processedOrders: 0,
            overflowCreated: 0,
            lostToCapacity: 0,
            employeeSalary: 0,
            employeeWorked: false,
        };


    constructor(gameState: GameState, config: EconomyConfig = DEFAULT_ECONOMY_CONFIG) {
        this.gameState = gameState;
        this.config = config;
    }

    setSupplier(supplier: SupplierType): void {
        this.supplier = supplier;
    }

    getSupplier(): SupplierType {
        return this.supplier;
    }

    setStockBot(stockBot: StockBot): void {
        this.stockBot = stockBot;
    }

    setMarketingSystem(marketingSystem: MarketingSystem): void {
        this.marketingSystem = marketingSystem;
    }

    setCapacitySystem(capacitySystem: CapacitySystem): void {
        this.capacitySystem = capacitySystem;
    }

    processDailyEconomy(): void {
        const state = this.gameState.data;

        // Advance capacity system day (shift overflow)
        if (this.capacitySystem) {
            this.capacitySystem.advanceDay();
        }

        // Reset daily summary
        this.lastDailySummary = {
            revenue: 0,
            costs: 0,
            interest: 0,
            net: 0,
            lostOrders: 0,
            reputationImpact: 0,
            processedOrders: 0,
            overflowCreated: 0,
            lostToCapacity: 0,
            employeeSalary: 0,
            employeeWorked: false,
        };

        // 1. Generate visits (controlled RNG - less dispersion)
        const range = this.config.baseVisitsMax - this.config.baseVisitsMin;
        let visits = Math.floor(
            this.config.baseVisitsMin + (Math.random() * 0.6 + 0.2) * range // 20-80% of range
        );

        // Apply marketing multiplier (campaign + viral, capped at 6x)
        if (this.marketingSystem) {
            const multiplier = this.marketingSystem.getVisitMultiplier();
            visits = Math.floor(visits * multiplier);
        }

        // 2. Calculate conversion rate
        let conversionRate = this.config.baseConversionRate;

        // Price impact: higher price = lower conversion
        const priceDeviation = state.price - 15; // $15 is baseline
        conversionRate -= priceDeviation * this.config.priceElasticity;

        // Reputation impact
        conversionRate *= this.reputationScore;

        // Clamp conversion rate
        conversionRate = Math.max(0.001, Math.min(0.15, conversionRate));

        // 3. Calculate potential orders
        const potentialOrders = Math.floor(visits * conversionRate);

        // 4. Apply stock limit
        const stockLimitedOrders = Math.min(potentialOrders, state.stock);
        const lostToStock = potentialOrders - stockLimitedOrders;

        // 4.5. Process employee (check if they work today based on available cash)
        let employeeSalary = 0;
        let employeeWorked = false;
        if (this.capacitySystem) {
            const employeeResult = this.capacitySystem.processEmployeeDay(state.cash);
            employeeSalary = employeeResult.salaryCost;
            employeeWorked = employeeResult.worked;

            // Deduct salary if employee worked
            if (employeeSalary > 0) {
                this.gameState.updateCash(-employeeSalary);
            }
        }
        this.lastDailySummary.employeeSalary = employeeSalary;
        this.lastDailySummary.employeeWorked = employeeWorked;

        // 5. Apply capacity limit (after employee status is determined)
        let actualOrders = stockLimitedOrders;
        let lostToCapacity = 0;
        let overflowCreated = 0;

        if (this.capacitySystem) {
            const processResult = this.capacitySystem.processOrders(stockLimitedOrders);
            actualOrders = processResult.processed;
            overflowCreated = processResult.overflow;
            lostToCapacity = processResult.lostToCapacity;
        }

        // Track in summary
        this.lastDailySummary.processedOrders = actualOrders;
        this.lastDailySummary.overflowCreated = overflowCreated;
        this.lastDailySummary.lostToCapacity = lostToCapacity;
        this.lastDailySummary.lostOrders = lostToStock; // Stock-based losses

        // 6. Apply reputation penalty for lost orders (stock shortage)
        if (lostToStock > 0) {
            const isMarketingActive = this.marketingSystem?.isMarketingActive() || false;
            const basePenalty = -0.01;
            const marketingMultiplier = isMarketingActive ? 2.0 : 1.0;
            const lostOrdersFactor = Math.min(lostToStock / 10, 3.0);
            const reputationPenalty = basePenalty * marketingMultiplier * lostOrdersFactor;

            this.adjustReputation(reputationPenalty);
            this.lastDailySummary.reputationImpact = reputationPenalty;
        }

        // 7. Apply reputation penalty for capacity losses (harsher)
        if (lostToCapacity > 0) {
            const isMarketingActive = this.marketingSystem?.isMarketingActive() || false;
            const basePenalty = -0.015; // Slightly harsher than stock shortage
            const marketingMultiplier = isMarketingActive ? 2.0 : 1.0;
            const lostOrdersFactor = Math.min(lostToCapacity / 10, 3.0);
            const capacityPenalty = basePenalty * marketingMultiplier * lostOrdersFactor;

            this.adjustReputation(capacityPenalty);
            this.lastDailySummary.reputationImpact += capacityPenalty;
        }

        // 8. Process sales
        const revenue = actualOrders * state.price;
        this.gameState.updateCash(revenue);
        this.gameState.updateStock(-actualOrders);
        this.gameState.state.totalRevenue += revenue;
        this.lastDailySummary.revenue = revenue;

        // 9. Apply daily costs
        this.gameState.updateCash(-this.config.dailyFixedCost);
        this.lastDailySummary.costs = this.config.dailyFixedCost;

        // 10. Apply interest on debt (1% daily)
        let interest = 0;
        if (state.debt > 0) {
            interest = state.debt * 0.01;
            this.gameState.state.debt += interest;
            this.gameState.updateCash(-interest);
        }
        this.lastDailySummary.interest = interest;

        // Calculate net (including employee salary)
        this.lastDailySummary.net = revenue - this.config.dailyFixedCost - interest - this.lastDailySummary.employeeSalary;

        // 11. Update metrics
        this.gameState.setDailyMetrics(visits, actualOrders, conversionRate * 100);

        // 12. Natural reputation recovery (+0.005/day if > 0.5)
        if (this.reputationScore > 0.5 && this.reputationScore < 1.0) {
            this.reputationScore = Math.min(1.0, this.reputationScore + 0.005);
        }

        // 13. Supplier reputation impact
        if (this.supplier === 'fast') {
            this.adjustReputation(this.config.fastSupplierReputationBonus);
        } else {
            this.adjustReputation(this.config.cheapSupplierReputationPenalty);
        }

        // 14. Update reputation display
        this.updateReputationDisplay();

        // 15. Emit summary event
        this.gameState.emit('daily-summary');

        // 16. Process marketing system (campaign countdown, viral check)
        if (this.marketingSystem) {
            this.marketingSystem.processDailyEffects();

            // Check for viral event
            const viral = this.marketingSystem.checkForViral();
            if (viral.occurred) {
                this.gameState.emit('viral-occurred');
                (this.gameState as any).lastViralMessage = viral.message;
            }
        }

        // 17. Run StockBot automation (if installed)
        if (this.stockBot && this.stockBot.isInstalled()) {
            const result = this.stockBot.checkAndBuyStock();
            if (result.reason) {
                this.gameState.emit('stockbot-action');
                (this.gameState as any).lastStockBotAction = result.reason;
            }
        }
    }

    adjustReputation(delta: number): void {
        this.reputationScore = Math.max(0, Math.min(1, this.reputationScore + delta));
        this.updateReputationDisplay();
    }

    private updateReputationDisplay(): void {
        let reputation: 'Good' | 'Average' | 'Poor';
        if (this.reputationScore >= 0.7) {
            reputation = 'Good';
        } else if (this.reputationScore >= 0.4) {
            reputation = 'Average';
        } else {
            reputation = 'Poor';
        }
        this.gameState.state.reputation = reputation;
        this.gameState.emit('reputation-changed');
    }

    getReputationScore(): number {
        return this.reputationScore;
    }
}
