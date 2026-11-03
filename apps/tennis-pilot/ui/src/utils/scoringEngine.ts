/**
 * Scoring Engine - Tennis Scoring Logic
 *
 * Handles all tennis scoring: points, games, sets, matches
 * UI should ONLY read from this engine
 */

export interface ScoreState {
    currentSet: number;
    currentGame: number;
    studentPoints: number;
    opponentPoints: number;
    studentGames: number[];
    opponentGames: number[];
    server: 'student' | 'opponent';
    studentSetsWon: number;
    opponentSetsWon: number;
    bestOf: 3 | 5;
    isMatchOver: boolean;
    matchWinner?: 'student' | 'opponent';
}

export class ScoringEngine {
    private state: ScoreState;

    constructor(bestOf: 3 | 5 = 3, firstServer: 'student' | 'opponent' = 'student') {
        this.state = this.getInitialState(bestOf, firstServer);
    }

    // ============================================
    // STATE MANAGEMENT
    // ============================================

    private getInitialState(bestOf: 3 | 5, firstServer: 'student' | 'opponent'): ScoreState {
        return {
            currentSet: 0,
            currentGame: 0,
            studentPoints: 0,
            opponentPoints: 0,
            studentGames: [0],
            opponentGames: [0],
            server: firstServer,
            studentSetsWon: 0,
            opponentSetsWon: 0,
            bestOf,
            isMatchOver: false,
        };
    }

    getState(): ScoreState {
        return { ...this.state };
    }

    setState(state: ScoreState): void {
        this.state = state;
    }

    // ============================================
    // POINT SCORING
    // ============================================

    /**
     * Add a point to the score
     */
    addPoint(winner: 'student' | 'opponent'): void {
        if (this.state.isMatchOver) {
            return;
        }

        // Add point
        if (winner === 'student') {
            this.state.studentPoints++;
        } else {
            this.state.opponentPoints++;
        }

        // Check if game is won
        const gameWinner = this.checkGameWon();
        if (gameWinner) {
            this.handleGameWon(gameWinner);
        }
    }

    /**
     * Check if current game is won
     */
    private checkGameWon(): 'student' | 'opponent' | null {
        const { studentPoints, opponentPoints } = this.state;

        // Regular win (4+ points with 2+ lead)
        if (studentPoints >= 4 && studentPoints - opponentPoints >= 2) {
            return 'student';
        }
        if (opponentPoints >= 4 && opponentPoints - studentPoints >= 2) {
            return 'opponent';
        }

        return null;
    }

    /**
     * Handle game won
     */
    private handleGameWon(winner: 'student' | 'opponent'): void {
        // Update games score
        const setIndex = this.state.currentSet - 1;
        if (winner === 'student') {
            this.state.studentGames[setIndex]++;
        } else {
            this.state.opponentGames[setIndex]++;
        }

        // Reset points
        this.state.studentPoints = 0;
        this.state.opponentPoints = 0;

        // Change server
        this.state.server = this.state.server === 'student' ? 'opponent' : 'student';

        // Check if set is won
        const setWinner = this.checkSetWon();
        if (setWinner) {
            this.handleSetWon(setWinner);
        } else {
            // Next game
            this.state.currentGame++;
        }
    }

    /**
     * Check if current set is won
     */
    private checkSetWon(): 'student' | 'opponent' | null {
        const setIndex = this.state.currentSet - 1;
        const studentGames = this.state.studentGames[setIndex];
        const opponentGames = this.state.opponentGames[setIndex];

        // Regular set win (6+ games with 2+ lead)
        if (studentGames >= 6 && studentGames - opponentGames >= 2) {
            return 'student';
        }
        if (opponentGames >= 6 && opponentGames - studentGames >= 2) {
            return 'opponent';
        }

        // Tiebreak win (7-6)
        if (studentGames === 7 && opponentGames === 6) {
            return 'student';
        }
        if (opponentGames === 7 && studentGames === 6) {
            return 'opponent';
        }

        return null;
    }

    /**
     * Handle set won
     */
    private handleSetWon(winner: 'student' | 'opponent'): void {
        // Update sets won
        if (winner === 'student') {
            this.state.studentSetsWon++;
        } else {
            this.state.opponentSetsWon++;
        }

        // Check if match is won
        const setsNeededToWin = Math.ceil(this.state.bestOf / 2);
        if (this.state.studentSetsWon >= setsNeededToWin) {
            this.state.isMatchOver = true;
            this.state.matchWinner = 'student';
            return;
        }
        if (this.state.opponentSetsWon >= setsNeededToWin) {
            this.state.isMatchOver = true;
            this.state.matchWinner = 'opponent';
            return;
        }

        // Start new set
        this.state.currentSet++;
        this.state.currentGame = 1;
        this.state.studentGames.push(0);
        this.state.opponentGames.push(0);
    }

    // ============================================
    // DISPLAY METHODS
    // ============================================

    /**
     * Get point display (0, 15, 30, 40, Deuce, Ad)
     */
    getPointDisplay(): { student: string; opponent: string } {
        const { studentPoints, opponentPoints } = this.state;
        const pointValues = ['0', '15', '30', '40'];

        // Deuce situation
        if (studentPoints >= 3 && opponentPoints >= 3) {
            if (studentPoints === opponentPoints) {
                return { student: 'Deuce', opponent: 'Deuce' };
            }
            if (studentPoints > opponentPoints) {
                return { student: 'Ad', opponent: '' };
            }
            return { student: '', opponent: 'Ad' };
        }

        return {
            student: pointValues[studentPoints] || studentPoints.toString(),
            opponent: pointValues[opponentPoints] || opponentPoints.toString(),
        };
    }

    /**
     * Get game score display
     */
    getGameScoreDisplay(): string {
        const pointDisplay = this.getPointDisplay();

        // Handle Deuce/Ad
        if (pointDisplay.student === 'Deuce') {
            return 'Deuce';
        }
        if (pointDisplay.student === 'Ad') {
            return 'Ad-Student';
        }
        if (pointDisplay.opponent === 'Ad') {
            return 'Ad-Opponent';
        }

        return `${pointDisplay.student}-${pointDisplay.opponent}`;
    }

    /**
     * Get match score display (sets)
     */
    getMatchScoreDisplay(): string {
        const setsDisplay: string[] = [];

        for (let i = 0; i < this.state.studentGames.length; i++) {
            setsDisplay.push(`${this.state.studentGames[i]}-${this.state.opponentGames[i]}`);
        }

        return setsDisplay.join(', ');
    }

    /**
     * Get current set score
     */
    getCurrentSetScore(): { student: number; opponent: number } {
        const setIndex = this.state.currentSet - 1;
        return {
            student: this.state.studentGames[setIndex],
            opponent: this.state.opponentGames[setIndex],
        };
    }

    /**
     * Check if match is over
     */
    isMatchOver(): boolean {
        return this.state.isMatchOver;
    }

    /**
     * Get match winner
     */
    getMatchWinner(): 'student' | 'opponent' | null {
        return this.state.matchWinner || null;
    }
}