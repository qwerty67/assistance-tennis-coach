/**
 * Tennis Game Logic - Single Source of Truth
 * This file contains all tennis game logic, valid values, and state transitions.
 * Both backend and frontend should use this logic.
 */

import { PointCreate } from '../types';

// ============================================
// VALID VALUES - Single Source of Truth
// ============================================

export const ValidValues = {
    // Players
    PLAYERS: ['student', 'opponent'] as const,

    // Serve types
    SERVE_TYPES: ['first', 'second'] as const,

    // Serve results
    SERVE_RESULTS: ['ace', 'fault', 'let', 'in', 'double_fault'] as const,

    // Return results
    RETURN_RESULTS: ['error', 'in'] as const,

    // Stroke types (Techniques)
    STROKE_TYPES: [
        // Groundstrokes
        'forehand',
        'backhand',
        'slice',
        'drop_shot',
        'lob',
        'passing_shot',
        // Net/Air shots
        'forehand_volley',
        'backhand_volley',
        'half_volley',
        'drive_volley',
        'swing_volley',
        'smash'
    ] as const,

    // Directions (Tactics)
    DIRECTIONS: [
        'cross_court',
        'down_the_line',
        'inside_out',
        'inside_in',
        'middle',
        'short_angle'
    ] as const,

    // Final stroke results (States / Outcomes)
    FINAL_STROKE_RESULTS: ['winner', 'forced_error', 'unforced_error', 'net'] as const,

    // Match status
    MATCH_STATUS: ['ongoing', 'completed', 'abandoned'] as const,

    // Match results
    MATCH_RESULTS: ['win', 'loss', 'draw'] as const,
} as const;

// Type definitions for valid values
export type Player = typeof ValidValues.PLAYERS[number];
export type ServeType = typeof ValidValues.SERVE_TYPES[number];
export type ServeResult = typeof ValidValues.SERVE_RESULTS[number];
export type ReturnResult = typeof ValidValues.RETURN_RESULTS[number];
export type StrokeType = typeof ValidValues.STROKE_TYPES[number];
export type Direction = typeof ValidValues.DIRECTIONS[number];
export type FinalStrokeResult = typeof ValidValues.FINAL_STROKE_RESULTS[number];
export type MatchStatus = typeof ValidValues.MATCH_STATUS[number];
export type MatchResult = typeof ValidValues.MATCH_RESULTS[number];

// ============================================
// STATE MACHINE - Point Flow
// ============================================

export const PointState = {
    IDLE: 'idle',
    SERVING_FIRST: 'serving_first',
    SERVING_SECOND: 'serving_second',
    RETURN: 'return',
    RALLY: 'rally',
    POINT_COMPLETE: 'point_complete',
} as const;

export type PointStateType = typeof PointState[keyof typeof PointState];

interface StateTransitions {
    [key: string]: {
        [action: string]: PointStateType;
    };
}

const transitions: StateTransitions = {
    [PointState.IDLE]: {
        'start': PointState.SERVING_FIRST
    },
    [PointState.SERVING_FIRST]: {
        'ace': PointState.POINT_COMPLETE,
        'let': PointState.SERVING_FIRST,  // Repeat
        'fault': PointState.SERVING_SECOND,
        'in': PointState.RETURN
    },
    [PointState.SERVING_SECOND]: {
        'ace': PointState.POINT_COMPLETE,
        'let': PointState.SERVING_SECOND,  // Repeat
        'double_fault': PointState.POINT_COMPLETE,
        'in': PointState.RETURN
    },
    [PointState.RETURN]: {
        'error': PointState.POINT_COMPLETE,
        'in': PointState.RALLY
    },
    [PointState.RALLY]: {
        'in': PointState.RALLY,  // Continue rally
        'winner': PointState.POINT_COMPLETE,
        'forced_error': PointState.POINT_COMPLETE,
        'unforced_error': PointState.POINT_COMPLETE,
        'net': PointState.POINT_COMPLETE
    }
};

export const PointStateMachine = {
    /**
     * Get next state based on current state and action
     */
    getNextState(currentState: PointStateType, action: string): PointStateType | null {
        return transitions[currentState]?.[action] || null;
    },

    /**
     * Check if transition is valid
     */
    isValidTransition(currentState: PointStateType, action: string): boolean {
        return transitions[currentState]?.[action] !== undefined;
    }
};

// ============================================
// VALIDATION FUNCTIONS
// ============================================

export const TennisValidator = {
    validatePlayer(player: string): player is Player {
        return ValidValues.PLAYERS.includes(player as Player);
    },

    validateServeType(serveType?: string): boolean {
        if (!serveType) return true;
        return ValidValues.SERVE_TYPES.includes(serveType as ServeType);
    },

    validateServeResult(serveResult?: string): boolean {
        if (!serveResult) return true;
        return ValidValues.SERVE_RESULTS.includes(serveResult as ServeResult);
    },

    validateReturnResult(returnResult?: string): boolean {
        if (!returnResult) return true;
        return ValidValues.RETURN_RESULTS.includes(returnResult as ReturnResult);
    },

    validateStrokeType(strokeType?: string): boolean {
        if (!strokeType) return true;
        return ValidValues.STROKE_TYPES.includes(strokeType as StrokeType);
    },

    validateDirection(direction?: string): boolean {
        if (!direction) return true;
        return ValidValues.DIRECTIONS.includes(direction as Direction);
    },

    validateFinalStrokeResult(result?: string): boolean {
        if (!result) return true;
        return ValidValues.FINAL_STROKE_RESULTS.includes(result as FinalStrokeResult);
    },

    validateMatchStatus(status: string): status is MatchStatus {
        return ValidValues.MATCH_STATUS.includes(status as MatchStatus);
    },

    validateMatchResult(result: string): result is MatchResult {
        return ValidValues.MATCH_RESULTS.includes(result as MatchResult);
    }
};

// ============================================
// POINT WINNER CALCULATION
// ============================================

export const PointWinnerCalculator = {
    calculateWinner(
        server: Player,
        serveResult?: ServeResult,
        returnResult?: ReturnResult,
        finalStrokePlayer?: Player,
        finalStrokeResult?: FinalStrokeResult
    ): Player | null {
        // Ace - server wins
        if (serveResult === 'ace') {
            return server;
        }

        // Double fault - receiver wins
        if (serveResult === 'double_fault') {
            return server === 'student' ? 'opponent' : 'student';
        }

        // Let or fault - point not complete
        if (serveResult === 'let' || serveResult === 'fault') {
            return null;
        }

        // Return error - server wins
        if (returnResult === 'error') {
            return server;
        }

        // Return in - check final stroke
        if (returnResult === 'in' && finalStrokePlayer && finalStrokeResult) {
            // Winner - player who hit it wins
            if (finalStrokeResult === 'winner') {
                return finalStrokePlayer;
            }

            // Forced Error - player who hit it wins (forced error on opponent)
            if (finalStrokeResult === 'forced_error') {
                return finalStrokePlayer;
            }

            // Unforced Error - opponent wins
            if (finalStrokeResult === 'unforced_error') {
                return finalStrokePlayer === 'student' ? 'opponent' : 'student';
            }

            // Net - opponent wins
            if (finalStrokeResult === 'net') {
                return finalStrokePlayer === 'student' ? 'opponent' : 'student';
            }
        }

        return null;
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const TennisHelpers = {
    getValidValues() {
        return {
            players: [...ValidValues.PLAYERS],
            serve_types: [...ValidValues.SERVE_TYPES],
            serve_results: [...ValidValues.SERVE_RESULTS],
            return_results: [...ValidValues.RETURN_RESULTS],
            stroke_types: [...ValidValues.STROKE_TYPES],
            directions: [...ValidValues.DIRECTIONS],
            final_stroke_results: [...ValidValues.FINAL_STROKE_RESULTS],
            match_status: [...ValidValues.MATCH_STATUS],
            match_results: [...ValidValues.MATCH_RESULTS]
        };
    },

    validatePointData(pointData: Partial<PointCreate>): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (pointData.server && !TennisValidator.validatePlayer(pointData.server)) {
            errors.push(`Invalid server: ${pointData.server}`);
        }
        if (pointData.serve_type && !TennisValidator.validateServeType(pointData.serve_type)) {
            errors.push(`Invalid serve_type: ${pointData.serve_type}`);
        }
        if (pointData.serve_result && !TennisValidator.validateServeResult(pointData.serve_result)) {
            errors.push(`Invalid serve_result: ${pointData.serve_result}`);
        }
        if (pointData.return_result && !TennisValidator.validateReturnResult(pointData.return_result)) {
            errors.push(`Invalid return_result: ${pointData.return_result}`);
        }
        if (pointData.final_stroke_player && !TennisValidator.validatePlayer(pointData.final_stroke_player)) {
            errors.push(`Invalid final_stroke_player: ${pointData.final_stroke_player}`);
        }
        if (pointData.final_stroke_type && !TennisValidator.validateStrokeType(pointData.final_stroke_type)) {
            errors.push(`Invalid final_stroke_type: ${pointData.final_stroke_type}`);
        }
        if (pointData.final_stroke_direction && !TennisValidator.validateDirection(pointData.final_stroke_direction)) {
            errors.push(`Invalid final_stroke_direction: ${pointData.final_stroke_direction}`);
        }
        if (pointData.final_stroke_result && !TennisValidator.validateFinalStrokeResult(pointData.final_stroke_result)) {
            errors.push(`Invalid final_stroke_result: ${pointData.final_stroke_result}`);
        }
        if (pointData.point_winner && !TennisValidator.validatePlayer(pointData.point_winner)) {
            errors.push(`Invalid point_winner: ${pointData.point_winner}`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    },

    getStrokeTypeDisplayName(strokeType: StrokeType): string {
        const displayNames: Record<StrokeType, string> = {
            forehand: 'فورهند (Forehand)',
            backhand: 'بک‌هند (Backhand)',
            slice: 'اسلایس (Slice)',
            drop_shot: 'دراپ شات (Drop Shot)',
            lob: 'لاب (Lob)',
            passing_shot: 'پاسینگ شات (Passing Shot)',
            forehand_volley: 'والی فورهند (F. Volley)',
            backhand_volley: 'والی بک‌هند (B. Volley)',
            half_volley: 'هاف والی (Half Volley)',
            drive_volley: 'درایو والی (Drive Volley)',
            swing_volley: 'سویینگ والی (Swing Volley)',
            smash: 'اسمش (Smash)'
        };
        return displayNames[strokeType] || strokeType;
    },

    getDirectionDisplayName(direction: Direction): string {
        const displayNames: Record<Direction, string> = {
            cross_court: 'مورب (Cross Court)',
            down_the_line: 'موازی خط (Down The Line)',
            inside_out: 'اینساید اوت (Inside Out)',
            inside_in: 'اینساید این (Inside In)',
            middle: 'وسط زمین (Middle)',
            short_angle: 'زاویه تیز (Short Angle)'
        };
        return displayNames[direction] || direction;
    },

    getServeResultDisplayName(serveResult: ServeResult): string {
        const displayNames: Record<ServeResult, string> = {
            ace: 'ایس (Ace)',
            fault: 'خطا (Fault)',
            let: 'نت / تکرار (Let)',
            in: 'داخل زمین (In Play)',
            double_fault: 'دوبل فالت (Double Fault)'
        };
        return displayNames[serveResult] || serveResult;
    },

    getFinalStrokeResultDisplayName(result: FinalStrokeResult): string {
        const displayNames: Record<FinalStrokeResult, string> = {
            winner: 'وینر - امتیاز مستقیم (Winner)',
            forced_error: 'خطای تحمیلی (Forced Error)',
            unforced_error: 'خطای غیرتحمیلی (Unforced Error)',
            net: 'برخورد به تور (Net)'
        };
        return displayNames[result] || result;
    }
};

export default {
    ValidValues,
    PointState,
    PointStateMachine,
    TennisValidator,
    PointWinnerCalculator,
    TennisHelpers
};
