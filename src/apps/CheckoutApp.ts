import { GameState } from '../game/GameState';
import { EconomyEngine, SupplierType } from '../game/EconomyEngine';
import { Window } from '../ui/Window';
import { ActivityTicker } from '../ui/ActivityTicker';
import { animateNumber, formatCurrency, formatPercentage, createButton } from '../utils/helpers';

export class CheckoutApp {
    private window: Window;
    private gameState: GameState;
    private economyEngine: EconomyEngine;
    private activityTicker: ActivityTicker;
    private activityIntervalId: number | null = null;

    // Metric elements
    private cashElement: HTMLElement | null = null;
    private stockElement: HTMLElement | null = null;
    private visitsElement: HTMLElement | null = null;
    private ordersElement: HTMLElement | null = null;
    private conversionElement: HTMLElement | null = null;
    private reputationElement: HTMLElement | null = null;
    private dayElement: HTMLElement | null = null;
    private pauseButton: HTMLButtonElement | null = null;
    private priceDisplay: HTMLElement | null = null;
    private supplierDisplay: HTMLElement | null = null;

    // Previous values for animations
    private previousCash = 500;
    private previousStock = 50;
    private previousVisits = 0;
    private previousOrders = 0;
    private previousConversion = 0;

    constructor(gameState: GameState, economyEngine: EconomyEngine) {
        this.gameState = gameState;
        this.economyEngine = economyEngine;
        this.activityTicker = new ActivityTicker();
        this.window = new Window({
            title: `${gameState.data.storeName} — Checkout`,
            width: 600,
            height: 550,
            x: 80,
            y: 60,
        });

        this.buildUI();
        this.attachListeners();
        this.startActivitySimulation();
    }

    private buildUI(): void {
        const content = this.window.getContentArea();

        // Header with day and controls
        const header = document.createElement('div');
        header.className = 'checkout-header';

        this.dayElement = document.createElement('div');
        this.dayElement.className = 'checkout-day';
        this.dayElement.textContent = `Dia ${this.gameState.data.currentDay}`;

        const controls = document.createElement('div');
        controls.className = 'checkout-controls';

        this.pauseButton = createButton('Pausar', () => this.togglePause());
        controls.appendChild(this.pauseButton);

        header.appendChild(this.dayElement);
        header.appendChild(controls);

        // Metrics grid (2 columns)
        const metricsGrid = document.createElement('div');
        metricsGrid.style.display = 'grid';
        metricsGrid.style.gridTemplateColumns = '1fr 1fr';
        metricsGrid.style.gap = '8px';
        metricsGrid.style.marginBottom = '12px';

        // Cash
        const cashMetric = this.createMetric('💰 CAIXA', formatCurrency(this.gameState.data.cash));
        this.cashElement = cashMetric.querySelector('.metric-value')!;
        metricsGrid.appendChild(cashMetric);

        // Stock
        const stockMetric = this.createMetric('📦 ESTOQUE', this.gameState.data.stock.toString());
        this.stockElement = stockMetric.querySelector('.metric-value')!;
        metricsGrid.appendChild(stockMetric);

        // Visits
        const visitsMetric = this.createMetric('👥 VISITAS', this.gameState.data.dailyVisits.toString());
        this.visitsElement = visitsMetric.querySelector('.metric-value')!;
        metricsGrid.appendChild(visitsMetric);

        // Orders
        const ordersMetric = this.createMetric('📋 PEDIDOS', this.gameState.data.dailyOrders.toString());
        this.ordersElement = ordersMetric.querySelector('.metric-value')!;
        metricsGrid.appendChild(ordersMetric);

        // Conversion
        const conversionMetric = this.createMetric('📊 CONVERSÃO', formatPercentage(this.gameState.data.conversionRate));
        this.conversionElement = conversionMetric.querySelector('.metric-value')!;
        metricsGrid.appendChild(conversionMetric);

        // Reputation
        const reputationMetric = this.createMetric('⭐ REPUTAÇÃO', this.gameState.data.reputation);
        this.reputationElement = reputationMetric.querySelector('.metric-value')!;
        this.reputationElement.style.fontSize = '16px';
        metricsGrid.appendChild(reputationMetric);

        // Actions panel
        const actionsPanel = document.createElement('div');
        actionsPanel.className = 'retro-panel';
        actionsPanel.style.marginBottom = '12px';

        const actionsTitle = document.createElement('div');
        actionsTitle.style.fontWeight = 'bold';
        actionsTitle.style.marginBottom = '8px';
        actionsTitle.textContent = 'AÇÕES';

        // Buy stock action
        const buyStockRow = document.createElement('div');
        buyStockRow.style.display = 'flex';
        buyStockRow.style.justifyContent = 'space-between';
        buyStockRow.style.alignItems = 'center';
        buyStockRow.style.marginBottom = '8px';

        const buyStockLabel = document.createElement('span');
        buyStockLabel.textContent = 'Comprar Estoque (50 un):';

        const buyStockBtn = createButton('$100', () => this.buyStock());
        buyStockRow.appendChild(buyStockLabel);
        buyStockRow.appendChild(buyStockBtn);

        // Price adjustment
        const priceRow = document.createElement('div');
        priceRow.style.display = 'flex';
        priceRow.style.justifyContent = 'space-between';
        priceRow.style.alignItems = 'center';
        priceRow.style.marginBottom = '8px';

        const priceLabel = document.createElement('span');
        priceLabel.textContent = 'Preço:';

        const priceControls = document.createElement('div');
        priceControls.style.display = 'flex';
        priceControls.style.gap = '4px';
        priceControls.style.alignItems = 'center';

        const decreaseBtn = createButton('-', () => this.adjustPrice(-1));
        decreaseBtn.style.minWidth = '30px';

        this.priceDisplay = document.createElement('span');
        this.priceDisplay.style.minWidth = '50px';
        this.priceDisplay.style.textAlign = 'center';
        this.priceDisplay.style.fontWeight = 'bold';
        this.priceDisplay.textContent = formatCurrency(this.gameState.data.price);

        const increaseBtn = createButton('+', () => this.adjustPrice(1));
        increaseBtn.style.minWidth = '30px';

        priceControls.appendChild(decreaseBtn);
        priceControls.appendChild(this.priceDisplay);
        priceControls.appendChild(increaseBtn);

        priceRow.appendChild(priceLabel);
        priceRow.appendChild(priceControls);

        // Supplier selection
        const supplierRow = document.createElement('div');
        supplierRow.style.display = 'flex';
        supplierRow.style.justifyContent = 'space-between';
        supplierRow.style.alignItems = 'center';

        const supplierLabel = document.createElement('span');
        supplierLabel.textContent = 'Fornecedor:';

        const supplierControls = document.createElement('div');
        supplierControls.style.display = 'flex';
        supplierControls.style.gap = '4px';

        const fastBtn = createButton('Rápido', () => this.setSupplier('fast'));
        const cheapBtn = createButton('Barato', () => this.setSupplier('cheap'));

        supplierControls.appendChild(fastBtn);
        supplierControls.appendChild(cheapBtn);

        this.supplierDisplay = document.createElement('div');
        this.supplierDisplay.style.fontSize = '10px';
        this.supplierDisplay.style.marginTop = '4px';
        this.supplierDisplay.textContent = 'Atual: Rápido (sem atraso, +reputação)';

        supplierRow.appendChild(supplierLabel);
        supplierRow.appendChild(supplierControls);

        actionsPanel.appendChild(actionsTitle);
        actionsPanel.appendChild(buyStockRow);
        actionsPanel.appendChild(priceRow);
        actionsPanel.appendChild(supplierRow);
        actionsPanel.appendChild(this.supplierDisplay);

        // Activity ticker
        const activityLabel = document.createElement('div');
        activityLabel.style.fontSize = '10px';
        activityLabel.style.fontWeight = 'bold';
        activityLabel.style.marginBottom = '4px';
        activityLabel.textContent = 'ATIVIDADE';

        content.appendChild(header);
        content.appendChild(metricsGrid);
        content.appendChild(actionsPanel);
        content.appendChild(activityLabel);
        content.appendChild(this.activityTicker.getElement());
    }

    private createMetric(label: string, value: string): HTMLElement {
        const metric = document.createElement('div');
        metric.className = 'metric-display';
        metric.style.padding = '8px';
        metric.style.marginBottom = '0';

        const labelEl = document.createElement('div');
        labelEl.className = 'metric-label';
        labelEl.style.fontSize = '9px';
        labelEl.textContent = label;

        const valueEl = document.createElement('div');
        valueEl.className = 'metric-value';
        valueEl.style.fontSize = '18px';
        valueEl.textContent = value;

        metric.appendChild(labelEl);
        metric.appendChild(valueEl);

        return metric;
    }

    private attachListeners(): void {
        this.gameState.on('cash-changed', () => this.updateCash());
        this.gameState.on('stock-changed', () => this.updateStock());
        this.gameState.on('day-changed', () => this.updateDay());
        this.gameState.on('metrics-changed', () => this.updateMetrics());
        this.gameState.on('reputation-changed', () => this.updateReputation());
        this.gameState.on('pause-changed', () => this.updatePauseButton());
        this.gameState.on('price-changed', () => this.updatePriceDisplay());
    }

    private startActivitySimulation(): void {
        const simulate = () => {
            if (!this.gameState.data.isPaused) {
                this.activityTicker.simulateActivity();
            }
            const nextDelay = 2000 + Math.random() * 3000;
            this.activityIntervalId = window.setTimeout(simulate, nextDelay);
        };
        simulate();
    }

    private buyStock(): void {
        if (this.gameState.data.cash >= 100) {
            this.gameState.updateCash(-100);
            this.gameState.updateStock(50);
            this.activityTicker.addMessage('Estoque comprado: 50 unidades', 'success');
        } else {
            this.activityTicker.addMessage('Caixa insuficiente para comprar estoque', 'error');
        }
    }

    private adjustPrice(delta: number): void {
        const newPrice = this.gameState.data.price + delta;
        if (newPrice >= 1) {
            this.gameState.setPrice(newPrice);
            this.activityTicker.addMessage(`Preço ajustado para ${formatCurrency(newPrice)}`, 'info');
        }
    }

    private setSupplier(supplier: SupplierType): void {
        this.economyEngine.setSupplier(supplier);
        const info = supplier === 'fast'
            ? 'Rápido (sem atraso, +reputação)'
            : 'Barato (1 dia atraso, -reputação)';
        if (this.supplierDisplay) {
            this.supplierDisplay.textContent = `Atual: ${info}`;
        }
        this.activityTicker.addMessage(`Fornecedor alterado: ${supplier === 'fast' ? 'Rápido' : 'Barato'}`, 'info');
    }

    private updateCash(): void {
        if (!this.cashElement) return;
        const newCash = this.gameState.data.cash;
        animateNumber(this.cashElement, this.previousCash, newCash, 500, formatCurrency);
        this.previousCash = newCash;
    }

    private updateStock(): void {
        if (!this.stockElement) return;
        const newStock = this.gameState.data.stock;
        animateNumber(this.stockElement, this.previousStock, newStock, 500, (n) => n.toString());
        this.previousStock = newStock;
    }

    private updateDay(): void {
        if (!this.dayElement) return;
        this.dayElement.textContent = `Dia ${this.gameState.data.currentDay}`;
    }

    private updateMetrics(): void {
        const data = this.gameState.data;

        if (this.visitsElement) {
            animateNumber(this.visitsElement, this.previousVisits, data.dailyVisits, 500, (n) => n.toString());
            this.previousVisits = data.dailyVisits;
        }

        if (this.ordersElement) {
            animateNumber(this.ordersElement, this.previousOrders, data.dailyOrders, 500, (n) => n.toString());
            this.previousOrders = data.dailyOrders;
        }

        if (this.conversionElement) {
            animateNumber(this.conversionElement, this.previousConversion, data.conversionRate, 500, formatPercentage);
            this.previousConversion = data.conversionRate;
        }
    }

    private updateReputation(): void {
        if (!this.reputationElement) return;
        this.reputationElement.textContent = this.gameState.data.reputation;
    }

    private updatePriceDisplay(): void {
        if (!this.priceDisplay) return;
        this.priceDisplay.textContent = formatCurrency(this.gameState.data.price);
    }

    private togglePause(): void {
        const isPaused = this.gameState.data.isPaused;
        this.gameState.setPaused(!isPaused);
    }

    private updatePauseButton(): void {
        if (!this.pauseButton) return;
        const isPaused = this.gameState.data.isPaused;
        this.pauseButton.textContent = isPaused ? 'Retomar' : 'Pausar';
    }

    getWindow(): Window {
        return this.window;
    }

    show(): void {
        this.window.show();
    }

    destroy(): void {
        if (this.activityIntervalId !== null) {
            clearTimeout(this.activityIntervalId);
            this.activityIntervalId = null;
        }
    }
}
