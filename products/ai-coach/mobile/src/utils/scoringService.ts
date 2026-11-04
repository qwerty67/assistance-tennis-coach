/**
 * Tennis Scoring Logic
 * Handles point, game, set, and match scoring according to tennis rules
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
}

export interface PointDisplay {
    student: string;
    opponent: string;
}

export interface SetScoreDisplay {
    student: number;
    opponent: number;
}

export const ScoringService = {
    /**
     * Get single point display (0, 15, 30, 40, Deuce, Ad)
     */
    getSinglePointDisplay(points: number, opponentPoints: number): string {
        const pointValues = ['0', '15', '30', '40'];

        if (points >= 3 && opponentPoints >= 3) {
            if (points === opponentPoints) {
                return 'Deuce';
            }
            if (points > opponentPoints) {
                return 'Ad';
            }
            return '';
        }

        return pointValues[points] || '0';
    },

    /**
     * Get point display as object {student, opponent}
     * This is what UI uses
     */
    getPointDisplay(state: ScoreState): PointDisplay {
        if (!state) {
            return { student: '0', opponent: '0' };
        }

        const studentDisplay = this.getSinglePointDisplay(state.studentPoints, state.opponentPoints);
        const opponentDisplay = this.getSinglePointDisplay(state.opponentPoints, state.studentPoints);

        return {
            student: studentDisplay,
            opponent: opponentDisplay,
        };
    },

    /**
     * Get game score display as string
     */
    getGameScoreDisplay(state: ScoreState): string {
        if (!state) return '0-0';

        const pointDisplay = this.getPointDisplay(state);

        // Handle Deuce/Ad
        if (state.studentPoints >= 3 && state.opponentPoints >= 3) {
            if (state.studentPoints === state.opponentPoints) {
                return 'Deuce';
            }
            if (state.studentPoints > state.opponentPoints) {
                return 'Ad-You';
            }
            return 'Ad-Opp';
        }

        return `${pointDisplay.student}-${pointDisplay.opponent}`;
    },

    /**
     * Get current set score
     */
    getCurrentSetScore(state: ScoreState): SetScoreDisplay {
        if (!state || !state.studentGames || !state.opponentGames) {
            return { student: 0, opponent: 0 };
        }

        const setIndex = state.currentSet - 1;

        // Defensive check
        if (setIndex < 0 || setIndex >= state.studentGames.length) {
            return { student: 0, opponent: 0 };
        }

        return {
            student: state.studentGames[setIndex] || 0,
            opponent: state.opponentGames[setIndex] || 0,
        };
    },

    /**
     * Calculate new score after a point is won
     */
    addPoint(state: ScoreState, winner: 'student' | 'opponent'): ScoreState {
        const newState = { ...state };

        if (winner === 'student') {
            newState.studentPoints++;
        } else {
            newState.opponentPoints++;
        }

        const gameWon = this.checkGameWon(newState.studentPoints, newState.opponentPoints);

        if (gameWon) {
            const setIndex = newState.currentSet - 1;

            if (gameWon === 'student') {
                newState.studentGames[setIndex] = (newState.studentGames[setIndex] || 0) + 1;
            } else {
                newState.opponentGames[setIndex] = (newState.opponentGames[setIndex] || 0) + 1;
            }

            newState.studentPoints = 0;
            newState.opponentPoints = 0;

            newState.server = newState.server === 'student' ? 'opponent' : 'student';

            const setWon = this.checkSetWon(
                newState.studentGames[setIndex],
                newState.opponentGames[setIndex]
            );

            if (setWon) {
                if (setWon === 'student') {
                    newState.studentSetsWon++;
                } else {
                    newState.opponentSetsWon++;
                }

                const setsNeededToWin = Math.ceil(newState.bestOf / 2);
                if (newState.studentSetsWon >= setsNeededToWin ||
                    newState.opponentSetsWon >= setsNeededToWin) {
                    return newState;
                }

                newState.currentSet++;
                newState.currentGame = 1;
                newState.studentGames.push(0);
                newState.opponentGames.push(0);
            } else {
                newState.currentGame++;
            }
        }

        return newState;
    },

    /**
     * Check if a game is won
     */
    checkGameWon(studentPoints: number, opponentPoints: number): 'student' | 'opponent' | null {
        if (studentPoints >= 4 && studentPoints - opponentPoints >= 2) {
            return 'student';
        }
        if (opponentPoints >= 4 && opponentPoints - studentPoints >= 2) {
            return 'opponent';
        }
        return null;
    },

    /**
     * Check if a set is won
     */
    checkSetWon(studentGames: number, opponentGames: number): 'student' | 'opponent' | null {
        if (studentGames >= 6 && studentGames - opponentGames >= 2) {
            return 'student';
        }
        if (opponentGames >= 6 && opponentGames - studentGames >= 2) {
            return 'opponent';
        }
        if (studentGames === 7 && opponentGames === 6) {
            return 'student';
        }
        if (opponentGames === 7 && studentGames === 6) {
            return 'opponent';
        }
        return null;
    },

    /**
     * Get initial score state
     */
    getInitialState(bestOf: 3 | 5 = 3, firstServer: 'student' | 'opponent' = 'student'): ScoreState {
        return {
            currentSet: 1,
            currentGame: 1,
            studentPoints: 0,
            opponentPoints: 0,
            studentGames: [0],
            opponentGames: [0],
            server: firstServer,
            studentSetsWon: 0,
            opponentSetsWon: 0,
            bestOf,
        };
    },

    /**
     * Get overall match score display
     */
    getMatchScoreDisplay(state: ScoreState): string {
        if (!state || !state.studentGames || !state.opponentGames) {
            return '0-0';
        }

        const setsDisplay: string[] = [];

        for (let i = 0; i < state.studentGames.length; i++) {
            const studentGames = state.studentGames[i] || 0;
            const opponentGames = state.opponentGames[i] || 0;
            setsDisplay.push(`${studentGames}-${opponentGames}`);
        }

        return setsDisplay.join(', ');
    },
};