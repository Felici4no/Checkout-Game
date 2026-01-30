import { GameState } from './GameState';

export type ChallengeType = 'first_profit' | 'survivor' | 'reputation_master' | 'growth_hacker' | 'none';

export interface Challenge {
    id: ChallengeType;
    name: string;
    description: string;
    shortDesc: string; // For collapsed display
}

export const CHALLENGES: Record<ChallengeType, Challenge> = {
    none: {
        id: 'none',
        name: 'Jogar Livre',
        description: 'Modo sandbox sem objetivos',
        shortDesc: 'Livre',
    },
    first_profit: {
        id: 'first_profit',
        name: 'First Profit',
        description: 'Alcance $1000 de revenue total com caixa positivo',
        shortDesc: 'First Profit: $1000 revenue + caixa positivo',
    },
    survivor: {
        id: 'survivor',
        name: 'Survivor',
        description: 'Sobreviva 30 dias sem falir',
        shortDesc: 'Survivor: 30 dias sem falir',
    },
    reputation_master: {
        id: 'reputation_master',
        name: 'Reputation Master',
        description: 'Mantenha reputação "Good" por 20 dias consecutivos',
        shortDesc: 'Reputation Master: 20 dias Good',
    },
    growth_hacker: {
        id: 'growth_hacker',
        name: 'Growth Hacker',
        description: 'Alcance $5000 de revenue total',
        shortDesc: 'Growth Hacker: $5000 revenue',
    },
};

export class ChallengeSystem {
    private gameState: GameState;
    private activeChallenge: ChallengeType = 'none';
    private reputationStreak = 0; // For reputation_master challenge

    constructor(gameState: GameState, challenge: ChallengeType = 'none') {
        this.gameState = gameState;
        this.activeChallenge = challenge;

        // Listen for reputation changes to track streak
        this.gameState.on('reputation-changed', () => this.updateReputationStreak());
    }

    setChallenge(challenge: ChallengeType): void {
        this.activeChallenge = challenge;
        this.reputationStreak = 0;
    }

    getActiveChallenge(): Challenge {
        return CHALLENGES[this.activeChallenge];
    }

    hasActiveChallenge(): boolean {
        return this.activeChallenge !== 'none';
    }

    private updateReputationStreak(): void {
        if (this.activeChallenge !== 'reputation_master') return;

        const reputation = this.gameState.data.reputation;
        if (reputation === 'Good') {
            this.reputationStreak++;
        } else {
            // Reset streak if reputation drops
            this.reputationStreak = 0;
        }
    }

    getReputationStreak(): number {
        return this.reputationStreak;
    }

    checkVictory(): boolean {
        if (this.activeChallenge === 'none') return false;

        const state = this.gameState.data;

        switch (this.activeChallenge) {
            case 'first_profit':
                // $1000 revenue AND positive cash
                return state.totalRevenue >= 1000 && state.cash > 0;

            case 'survivor':
                // 30 days without bankruptcy
                return state.currentDay >= 30;

            case 'reputation_master':
                // 20 consecutive days with "Good" reputation
                return this.reputationStreak >= 20;

            case 'growth_hacker':
                // $5000 total revenue
                return state.totalRevenue >= 5000;

            default:
                return false;
        }
    }

    getProgress(): number {
        if (this.activeChallenge === 'none') return 0;

        const state = this.gameState.data;

        switch (this.activeChallenge) {
            case 'first_profit':
                // Progress based on revenue (0-100%)
                const revenueProgress = Math.min((state.totalRevenue / 1000) * 100, 100);
                const cashOk = state.cash > 0;
                return cashOk ? revenueProgress : Math.min(revenueProgress, 99); // Cap at 99% if cash negative

            case 'survivor':
                // Progress based on days (0-100%)
                return Math.min((state.currentDay / 30) * 100, 100);

            case 'reputation_master':
                // Progress based on streak (0-100%)
                return Math.min((this.reputationStreak / 20) * 100, 100);

            case 'growth_hacker':
                // Progress based on revenue (0-100%)
                return Math.min((state.totalRevenue / 5000) * 100, 100);

            default:
                return 0;
        }
    }

    getProgressText(): string {
        if (this.activeChallenge === 'none') return '';

        const state = this.gameState.data;

        switch (this.activeChallenge) {
            case 'first_profit':
                return `$${state.totalRevenue}/$1000 (Caixa: $${state.cash.toFixed(0)})`;

            case 'survivor':
                return `${state.currentDay}/30 dias`;

            case 'reputation_master':
                return `${this.reputationStreak}/20 dias Good`;

            case 'growth_hacker':
                return `$${state.totalRevenue}/$5000`;

            default:
                return '';
        }
    }
}
