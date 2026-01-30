import { GameState } from './GameState';

export interface ProcessResult {
    processed: number;
    overflow: number;
    lostToCapacity: number;
}

export class CapacitySystem {
    private gameState: GameState;
    private baseCapacity = 20; // Base: 20 orders/day
    private expansions = 0; // Number of warehouse expansions (max 2)
    private overflowYesterday = 0; // Overflow from previous day
    private overflowToday = 0; // Overflow created today

    // Employee system
    private employeeHired = false;
    private employeeWorkedToday = false;
    private readonly EMPLOYEE_SALARY = 30;
    private readonly EMPLOYEE_CAPACITY_BONUS = 15;

    private readonly EXPANSION_COSTS = [500, 900]; // Progressive costs
    private readonly CAPACITY_PER_EXPANSION = 20;
    private readonly MAX_EXPANSIONS = 2;

    constructor(gameState: GameState) {
        this.gameState = gameState;
    }

    getCapacity(): number {
        let capacity = this.baseCapacity + (this.expansions * this.CAPACITY_PER_EXPANSION);

        // Add employee bonus if employee worked today
        if (this.employeeHired && this.employeeWorkedToday) {
            capacity += this.EMPLOYEE_CAPACITY_BONUS;
        }

        return capacity;
    }

    getExpansions(): number {
        return this.expansions;
    }

    getNextExpansionCost(): number | null {
        if (this.expansions >= this.MAX_EXPANSIONS) {
            return null;
        }
        return this.EXPANSION_COSTS[this.expansions];
    }

    canExpand(): boolean {
        return this.expansions < this.MAX_EXPANSIONS;
    }

    purchaseExpansion(): { success: boolean; message: string } {
        if (!this.canExpand()) {
            return { success: false, message: 'Capacidade máxima atingida' };
        }

        const cost = this.getNextExpansionCost()!;
        if (this.gameState.data.cash < cost) {
            return { success: false, message: `Caixa insuficiente ($${cost})` };
        }

        this.gameState.updateCash(-cost);
        this.expansions++;

        const newCapacity = this.getCapacity();
        return {
            success: true,
            message: `🏭 Warehouse Expansion ${this.expansions}/2 comprado! Capacidade: ${newCapacity} pedidos/dia`
        };
    }

    // Employee management
    isEmployeeHired(): boolean {
        return this.employeeHired;
    }

    didEmployeeWork(): boolean {
        return this.employeeWorkedToday;
    }

    getEmployeeSalary(): number {
        return this.EMPLOYEE_SALARY;
    }

    hireEmployee(): { success: boolean; message: string } {
        if (this.employeeHired) {
            return { success: false, message: 'Operador já contratado' };
        }

        this.employeeHired = true;
        return {
            success: true,
            message: `👷 Operador contratado! +${this.EMPLOYEE_CAPACITY_BONUS} capacidade/dia. Salário: $${this.EMPLOYEE_SALARY}/dia`
        };
    }

    fireEmployee(): { success: boolean; message: string } {
        if (!this.employeeHired) {
            return { success: false, message: 'Nenhum operador contratado' };
        }

        this.employeeHired = false;
        this.employeeWorkedToday = false;
        return {
            success: true,
            message: '👷 Operador demitido. Capacidade reduzida.'
        };
    }

    // Called by EconomyEngine to check if employee can work today
    processEmployeeDay(availableCash: number): { worked: boolean; salaryCost: number } {
        if (!this.employeeHired) {
            this.employeeWorkedToday = false;
            return { worked: false, salaryCost: 0 };
        }

        // Check if can afford salary
        if (availableCash >= this.EMPLOYEE_SALARY) {
            this.employeeWorkedToday = true;
            return { worked: true, salaryCost: this.EMPLOYEE_SALARY };
        } else {
            // Employee doesn't work today (no cash)
            this.employeeWorkedToday = false;
            return { worked: false, salaryCost: 0 };
        }
    }

    processOrders(potentialOrders: number): ProcessResult {
        const capacity = this.getCapacity();
        let remainingCapacity = capacity;
        let processed = 0;
        let lostToCapacity = 0;

        // Priority 1: Process overflow from yesterday
        if (this.overflowYesterday > 0) {
            const processedFromYesterday = Math.min(this.overflowYesterday, remainingCapacity);
            processed += processedFromYesterday;
            remainingCapacity -= processedFromYesterday;

            // Anything not processed from yesterday is lost
            lostToCapacity = this.overflowYesterday - processedFromYesterday;
            this.overflowYesterday = 0; // Clear yesterday's overflow
        }

        // Priority 2: Process today's orders
        const processedFromToday = Math.min(potentialOrders, remainingCapacity);
        processed += processedFromToday;

        // Anything not processed today becomes overflow for tomorrow
        this.overflowToday = potentialOrders - processedFromToday;

        return {
            processed,
            overflow: this.overflowToday,
            lostToCapacity,
        };
    }

    // Called at start of new day to shift overflow
    advanceDay(): void {
        this.overflowYesterday = this.overflowToday;
        this.overflowToday = 0;
    }

    getOverflowYesterday(): number {
        return this.overflowYesterday;
    }

    getOverflowToday(): number {
        return this.overflowToday;
    }

    getTotalOverflow(): number {
        return this.overflowYesterday + this.overflowToday;
    }
}
