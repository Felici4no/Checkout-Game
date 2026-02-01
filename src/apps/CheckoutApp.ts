import { GameState } from '../game/GameState';
import { EconomyEngine, SupplierType } from '../game/EconomyEngine';
import { Window } from '../ui/Window';
import { ActivityTicker } from '../ui/ActivityTicker';
import { animateNumber, formatCurrency, formatPercentage, createButton } from '../utils/helpers';

export class CheckoutApp {
    private window: Window;
    private gameState: GameState;
    private economyEngine: EconomyEngine;
    private marketingSystem: any;
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
    private dailySummaryElement: HTMLElement | null = null;
    private bankruptcyWarningElement: HTMLElement | null = null;
    private incomingStockElement: HTMLElement | null = null;

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
            title: `${gameState.data.storeProfile.name} — Checkout`,
            width: 580,
            height: 560,
            x: 80,
            y: 40,
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

        // Challenge indicator removed for infinite mode

        // Bankruptcy warning (hidden by default)
        this.bankruptcyWarningElement = document.createElement('div');
        this.bankruptcyWarningElement.style.display = 'none';
        this.bankruptcyWarningElement.style.padding = '8px';
        this.bankruptcyWarningElement.style.marginBottom = '8px';
        this.bankruptcyWarningElement.style.background = '#FF0';
        this.bankruptcyWarningElement.style.border = '2px solid #C00';
        this.bankruptcyWarningElement.style.fontSize = '11px';
        this.bankruptcyWarningElement.style.fontWeight = 'bold';
        this.bankruptcyWarningElement.style.color = '#C00';
        this.bankruptcyWarningElement.style.textAlign = 'center';

        // Metrics grid (2 columns)
        const metricsGrid = document.createElement('div');
        metricsGrid.style.display = 'grid';
        metricsGrid.style.gridTemplateColumns = '1fr 1fr';
        metricsGrid.style.gap = '6px';
        metricsGrid.style.marginBottom = '6px';

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

        // Daily summary panel
        this.dailySummaryElement = document.createElement('div');
        this.dailySummaryElement.style.fontSize = '9px';
        this.dailySummaryElement.style.padding = '4px 6px';
        this.dailySummaryElement.style.marginBottom = '6px';
        this.dailySummaryElement.style.background = '#E0E0E0';
        this.dailySummaryElement.style.border = '1px solid #808080';
        this.dailySummaryElement.style.fontFamily = "'Courier New', monospace";
        this.dailySummaryElement.innerHTML = `
      <strong>EXTRATO:</strong> R: $0 | C: $0 | J: $0 | <strong>L: $0</strong>
    `;

        // Actions panel
        const actionsPanel = document.createElement('div');
        actionsPanel.className = 'retro-panel';
        actionsPanel.style.marginBottom = '6px';

        const actionsTitle = document.createElement('div');
        actionsTitle.style.fontWeight = 'bold';
        actionsTitle.style.marginBottom = '4px';
        actionsTitle.style.fontSize = '10px';
        actionsTitle.textContent = 'AÇÕES';

        // Buy stock action
        const buyStockRow = document.createElement('div');
        buyStockRow.style.display = 'flex';
        buyStockRow.style.justifyContent = 'space-between';
        buyStockRow.style.alignItems = 'center';
        buyStockRow.style.marginBottom = '4px';
        buyStockRow.style.fontSize = '11px';

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
        priceRow.style.marginBottom = '4px';
        priceRow.style.fontSize = '11px';

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
        supplierRow.style.marginBottom = '4px';
        supplierRow.style.fontSize = '11px';

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
        this.supplierDisplay.style.fontSize = '8px';
        this.supplierDisplay.style.marginTop = '2px';
        this.supplierDisplay.textContent = 'Atual: Rápido';

        supplierRow.appendChild(supplierLabel);
        supplierRow.appendChild(supplierControls);

        // StockBot purchase
        const stockBotRow = document.createElement('div');
        stockBotRow.style.display = 'flex';
        stockBotRow.style.justifyContent = 'space-between';
        stockBotRow.style.alignItems = 'center';
        stockBotRow.style.marginTop = '6px';
        stockBotRow.style.paddingTop = '4px';
        stockBotRow.style.borderTop = '1px solid #808080';
        stockBotRow.style.fontSize = '11px';

        const stockBotLabel = document.createElement('span');
        stockBotLabel.innerHTML = '🤖 <strong>StockBot</strong><br><span style="font-size: 8px;">Auto < 20</span>';

        this.stockBotButton = createButton('Comprar $250', () => this.buyStockBot());
        stockBotRow.appendChild(stockBotLabel);
        stockBotRow.appendChild(this.stockBotButton);

        actionsPanel.appendChild(actionsTitle);
        actionsPanel.appendChild(buyStockRow);
        actionsPanel.appendChild(priceRow);
        actionsPanel.appendChild(supplierRow);
        actionsPanel.appendChild(this.supplierDisplay);
        actionsPanel.appendChild(stockBotRow);

        // Activity ticker
        const activityLabel = document.createElement('div');
        activityLabel.style.fontSize = '10px';
        activityLabel.style.fontWeight = 'bold';
        activityLabel.style.marginBottom = '4px';
        activityLabel.textContent = 'ATIVIDADE';

        // Capacity indicator (read-only, small)
        const capacityIndicator = document.createElement('div');
        capacityIndicator.style.cssText = `
      font-size: 8px;
      padding: 3px 6px;
      margin-bottom: 6px;
      background: #F0F0F0;
      border: 1px solid #A0A0A0;
      font-family: 'Courier New', monospace;
      color: #606060;
    `;
        capacityIndicator.id = 'capacity-indicator';
        capacityIndicator.innerHTML = 'Cap: 20/d | Fila: 0';

        content.appendChild(header);
        // content.appendChild(challengeIndicator); // Removed for infinite mode
        content.appendChild(this.bankruptcyWarningElement);
        content.appendChild(metricsGrid);
        content.appendChild(this.dailySummaryElement);
        content.appendChild(capacityIndicator);
        content.appendChild(actionsPanel);
        content.appendChild(activityLabel);
        content.appendChild(this.activityTicker.getElement());

        // Update StockBot button state
        this.updateStockBotButton();

        // Update challenge indicator
        this.updateChallengeIndicator(false);
    }

    private updateChallengeIndicator(expanded: boolean): void {
        const challengeIndicator = document.getElementById('challenge-indicator');
        if (!challengeIndicator) return;

        const challengeSystem = (this.gameState as any).challengeSystem;
        if (!challengeSystem || !challengeSystem.hasActiveChallenge()) {
            challengeIndicator.style.display = 'none';
            return;
        }

        challengeIndicator.style.display = 'block';
        const challenge = challengeSystem.getActiveChallenge();
        const progress = challengeSystem.getProgress();
        const progressText = challengeSystem.getProgressText();

        if (expanded) {
            challengeIndicator.innerHTML = `
        🎯 <strong>${challenge.name}</strong><br>
        <span style="font-size: 6px;">${challenge.description}</span><br>
        <span style="font-size: 6px; color: #0A0;">${progressText} (${progress.toFixed(0)}%)</span>
      `;
        } else {
            challengeIndicator.innerHTML = `🎯 ${challenge.shortDesc} - ${progress.toFixed(0)}%`;
        }
    }

    private createMetric(label: string, value: string): HTMLElement {
        const metric = document.createElement('div');
        metric.className = 'metric-display';
        metric.style.padding = '4px';
        metric.style.marginBottom = '0';

        const labelEl = document.createElement('div');
        labelEl.className = 'metric-label';
        labelEl.style.fontSize = '8px';
        labelEl.textContent = label;

        const valueEl = document.createElement('div');
        valueEl.className = 'metric-value';
        valueEl.style.fontSize = '15px';
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
        this.gameState.on('daily-summary', () => this.updateDailySummary());
        this.gameState.on('incoming-stock-changed', () => this.updateIncomingStock());
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
        const STOCK_AMOUNT = 50;
        const STOCK_COST = 100;

        // Get current supplier
        const supplier = this.economyEngine.getSupplier();

        // Order stock via GameState (returns leadTimeDays: 1, 2, or 0 for failure)
        const leadTimeDays = this.gameState.orderStock(STOCK_AMOUNT, supplier);

        if (leadTimeDays > 0) {
            // Success - build arrival message
            const arrivalMsg = leadTimeDays === 1 ? 'chega amanhã' : 'chega em 2 dias';
            this.activityTicker.addMessage(
                `📦 Pedido de estoque: +${STOCK_AMOUNT} (${arrivalMsg})`,
                'success'
            );
        } else {
            // Failed - insufficient funds
            this.activityTicker.addMessage(
                'Caixa insuficiente para comprar estoque',
                'error'
            );
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
        const info = supplier === 'fast' ? 'Rápido' : 'Barato';
        if (this.supplierDisplay) {
            this.supplierDisplay.textContent = `Atual: ${info}`;
        }
        this.activityTicker.addMessage(`Fornecedor alterado: ${info}`, 'info');
    }

    private updateCash(): void {
        if (!this.cashElement) return;
        const newCash = this.gameState.data.cash;
        animateNumber(this.cashElement, this.previousCash, newCash, 500, formatCurrency);
        this.previousCash = newCash;

        // Update bankruptcy warning
        this.updateBankruptcyWarning();
    }

    private updateBankruptcyWarning(): void {
        if (!this.bankruptcyWarningElement) return;

        const consecutiveNegativeDays = this.gameState.data.consecutiveNegativeDays;

        if (consecutiveNegativeDays === 1) {
            this.bankruptcyWarningElement.style.display = 'block';
            this.bankruptcyWarningElement.textContent = '⚠️ ATENÇÃO: Caixa negativo! (1/3 dias para falência)';
        } else if (consecutiveNegativeDays === 2) {
            this.bankruptcyWarningElement.style.display = 'block';
            this.bankruptcyWarningElement.textContent = '🚨 CRÍTICO: Caixa negativo! (2/3 dias para falência)';
        } else {
            this.bankruptcyWarningElement.style.display = 'none';
        }
    }

    private updateDailySummary(): void {
        if (!this.dailySummaryElement) return;

        const summary = this.economyEngine.lastDailySummary;
        const netColor = summary.net >= 0 ? '#0A0' : '#C00';

        let summaryText = `
      <strong>EXTRATO:</strong> 
      R: ${formatCurrency(summary.revenue)} | 
      C: ${formatCurrency(summary.costs)} | 
      J: ${formatCurrency(summary.interest)} | 
      <strong style="color: ${netColor}">L: ${formatCurrency(summary.net)}</strong>
    `;

        // Add employee salary info if applicable
        if (summary.employeeSalary > 0) {
            summaryText += `<br><span style="font-size: 8px;">👷 Salário: ${formatCurrency(summary.employeeSalary)}`;
            if (summary.employeeWorked) {
                summaryText += ` <span style="color: #0A0;">(✓ Trabalhou)</span>`;
            }
            summaryText += `</span>`;
        } else if ((this.gameState as any).capacitySystem?.isEmployeeHired() && !summary.employeeWorked) {
            summaryText += `<br><span style="font-size: 8px; color: #F90;">👷 Operador faltou (sem caixa para salário)</span>`;
        }

        // Add capacity breakdown
        if (summary.processedOrders > 0 || summary.overflowCreated > 0 || summary.lostToCapacity > 0) {
            summaryText += `<br><span style="font-size: 8px;">`;
            summaryText += `Proc: ${summary.processedOrders}`;
            if (summary.overflowCreated > 0) {
                summaryText += ` | <span style="color: #F90;">Fila: ${summary.overflowCreated}</span>`;
            }
            if (summary.lostToCapacity > 0) {
                summaryText += ` | <span style="color: #C00;">Perdidos(cap): ${summary.lostToCapacity}</span>`;
            }
            summaryText += `</span>`;
        }

        // Add lost orders warning if any (stock shortage)
        if (summary.lostOrders > 0) {
            const repImpact = summary.reputationImpact;
            const repText = repImpact < 0 ? `${(repImpact * 100).toFixed(1)}%` : '';
            summaryText += `<br><span style="color: #C00; font-weight: bold;">⚠️ ${summary.lostOrders} pedidos perdidos(estoque) (Rep: ${repText})</span>`;
        }

        this.dailySummaryElement.innerHTML = summaryText;

        // Update capacity indicator if exists
        const capacityIndicator = document.getElementById('capacity-indicator');
        if (capacityIndicator && (this.gameState as any).capacitySystem) {
            const capacitySystem = (this.gameState as any).capacitySystem;
            const capacity = capacitySystem.getCapacity();
            const queue = capacitySystem.getTotalOverflow();
            const queueColor = queue > 0 ? '#F90' : '#606060';
            capacityIndicator.innerHTML = `Cap: ${capacity}/d | <span style="color: ${queueColor};">Fila: ${queue}</span>`;
        }

        // Update challenge indicator (collapsed)
        this.updateChallengeIndicator(false);
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
