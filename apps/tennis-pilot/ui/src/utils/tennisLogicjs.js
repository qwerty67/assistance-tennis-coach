/**
 * Tennis Game Logic - Single Source of Truth
 * This file contains all tennis game logic, valid values, and state transitions.
 * Both backend and frontend should use this logic.
 */

// ============================================
// VALID VALUES - Single Source of Truth
// ============================================

export const ValidValues = {
    // Players
    PLAYERS: ['student', 'opponent'],

    // Serve types
    SERVE_TYPES: ['first', 'second'],

    // Serve results
    SERVE_RESULTS: ['ace', 'fault', 'let', 'in', 'double_fault'],

    // Return results
    RETURN_RESULTS: ['error', 'in'],

    // Stroke types
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
    ],

    // Directions
    DIRECTIONS: [
        'cross_court',
        'down_the_line',
        'inside_out',
        'inside_in',
        'middle',
        'short_angle'
    ],

    // Final stroke results
    FINAL_STROKE_RESULTS: ['winner', 'forced_error', 'unforced_error', 'net'],

    // Match status
    MATCH_STATUS: ['ongoing', 'completed', 'abandoned'],

    // Match results
    MATCH_RESULTS: ['win', 'loss', 'draw']
};

// ============================================
// STATE MACHINE - Point Flow
// ============================================

export const PointState = {
    // States
    IDLE: 'idle',
    SERVING_FIRST: 'serving_first',
    SERVING_SECOND: 'serving_second',
    RETURN: 'return',
    RALLY: 'rally',
    POINT_COMPLETE: 'point_complete',

    // Transitions
    getNextState(currentState, action) {
        const transitions = {
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

        return transitions[currentState]?.[action] || null;
    }
};

// ============================================
// VALIDATION FUNCTIONS
// ============================================

export const TennisValidator = {
    validatePlayer(player) {
        return ValidValues.PLAYERS.includes(player);
    },

    validateServeType(serveType) {
        if (!serveType) return true;
        return ValidValues.SERVE_TYPES.includes(serveType);
    },

    validateServeResult(serveResult) {
        if (!serveResult) return true;
        return ValidValues.SERVE_RESULTS.includes(serveResult);
    },

    validateReturnResult(returnResult) {
        if (!returnResult) return true;
        return ValidValues.RETURN_RESULTS.includes(returnResult);
    },

    validateStrokeType(strokeType) {
        if (!strokeType) return true;
        return ValidValues.STROKE_TYPES.includes(strokeType);
    },

    validateDirection(direction) {
        if (!direction) return true;
        return ValidValues.DIRECTIONS.includes(direction);
    },

    validateFinalStrokeResult(result) {
        if (!result) return true;
        return ValidValues.FINAL_STROKE_RESULTS.includes(result);
    }
};

// ============================================
// POINT WINNER CALCULATION
// ============================================

export const PointWinnerCalculator = {
    calculateWinner(server, serveResult, returnResult, finalStrokePlayer, finalStrokeResult) {
        // Ace - server wins
        if (serveResult === 'ace') {
            return server;
        }

        // Double fault - receiver wins
        if (serveResult === 'double_fault') {
            return server === 'student' ? 'opponent' : 'student';
        }

        // Let or fault - point not complete
        if (['let', 'fault'].includes(serveResult)) {
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

            // Errors - opponent wins
            if (['forced_error', 'unforced_error', 'net'].includes(finalStrokeResult)) {
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
            players: ValidValues.PLAYERS,
            serve_types: ValidValues.SERVE_TYPES,
            serve_results: ValidValues.SERVE_RESULTS,
            return_results: ValidValues.RETURN_RESULTS,
            stroke_types: ValidValues.STROKE_TYPES,
            directions: ValidValues.DIRECTIONS,
            final_stroke_results: ValidValues.FINAL_STROKE_RESULTS,
            match_status: ValidValues.MATCH_STATUS,
            match_results: ValidValues.MATCH_RESULTS
        };
    },

    validatePointData(pointData) {
        const errors = [];

        // Validate server
        if (!TennisValidator.validatePlayer(pointData.server)) {
            errors.push(`Invalid server: ${pointData.server}`);
        }

        // Validate serve type
        if (!TennisValidator.validateServeType(pointData.serve_type)) {
            errors.push(`Invalid serve_type: ${pointData.serve_type}`);
        }

        // Validate serve result
        if (!TennisValidator.validateServeResult(pointData.serve_result)) {
            errors.push(`Invalid serve_result: ${pointData.serve_result}`);
        }

        // Validate return result
        if (!TennisValidator.validateReturnResult(pointData.return_result)) {
            errors.push(`Invalid return_result: ${pointData.return_result}`);
        }

        // Validate final stroke
        if (pointData.final_stroke_player) {
            if (!TennisValidator.validatePlayer(pointData.final_stroke_player)) {
                errors.push(`Invalid final_stroke_player: ${pointData.final_stroke_player}`);
            }
        }

        if (pointData.final_stroke_type) {
            if (!TennisValidator.validateStrokeType(pointData.final_stroke_type)) {
                errors.push(`Invalid final_stroke_type: ${pointData.final_stroke_type}`);
            }
        }

        if (pointData.final_stroke_direction) {
            if (!TennisValidator.validateDirection(pointData.final_stroke_direction)) {
                errors.push(`Invalid final_stroke_direction: ${pointData.final_stroke_direction}`);
            }
        }

        if (pointData.final_stroke_result) {
            if (!TennisValidator.validateFinalStrokeResult(pointData.final_stroke_result)) {
                errors.push(`Invalid final_stroke_result: ${pointData.final_stroke_result}`);
            }
        }

        // Validate point winner
        if (!TennisValidator.validatePlayer(pointData.point_winner)) {
            errors.push(`Invalid point_winner: ${pointData.point_winner}`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
};