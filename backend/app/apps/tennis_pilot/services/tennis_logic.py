"""
Tennis Game Logic - Single Source of Truth
This module contains all tennis game logic, valid values, and state transitions.
Both backend and frontend should use this logic.
"""

from typing import Optional, Dict, List, Any


# ============================================
# VALID VALUES - Single Source of Truth
# ============================================

class ValidValues:
    """All valid values for tennis game logic"""

    # Players
    PLAYERS = ['student', 'opponent']

    # Serve types
    SERVE_TYPES = ['first', 'second']

    # Serve results
    SERVE_RESULTS = ['ace', 'fault', 'let', 'in', 'double_fault']

    # Return results
    RETURN_RESULTS = ['error', 'in']

    # Stroke types
    STROKE_TYPES = [
        # Groundstrokes
        'forehand',
        'backhand',
        'slice',
        'drop_shot',
        'lob',
        'passing_shot',
        # Net/Air shots
        'forehand_volley',
        'backhand_volley',
        'half_volley',
        'drive_volley',
        'swing_volley',
        'smash'
    ]

    # Directions
    DIRECTIONS = [
        'cross_court',
        'down_the_line',
        'inside_out',
        'inside_in',
        'middle',
        'short_angle'
    ]

    # Final stroke results
    FINAL_STROKE_RESULTS = ['winner', 'forced_error', 'unforced_error', 'net']

    # Match status
    MATCH_STATUS = ['ongoing', 'completed', 'abandoned']

    # Match results
    MATCH_RESULTS = ['win', 'loss', 'draw']


# ============================================
# STATE MACHINE - Point Flow
# ============================================

class PointState:
    """State machine for point flow"""

    # States
    IDLE = 'idle'
    SERVING_FIRST = 'serving_first'
    SERVING_SECOND = 'serving_second'
    RETURN = 'return'
    RALLY = 'rally'
    POINT_COMPLETE = 'point_complete'

    # Transitions
    @staticmethod
    def get_next_state(current_state: str, action: str) -> Optional[str]:
        """
        Get next state based on current state and action

        Args:
            current_state: Current state
            action: Action taken (e.g., 'ace', 'fault', 'in', etc.)

        Returns:
            Next state or None if invalid
        """
        transitions = {
            PointState.IDLE: {
                'start': PointState.SERVING_FIRST
            },
            PointState.SERVING_FIRST: {
                'ace': PointState.POINT_COMPLETE,
                'let': PointState.SERVING_FIRST,  # Repeat
                'fault': PointState.SERVING_SECOND,
                'in': PointState.RETURN
            },
            PointState.SERVING_SECOND: {
                'ace': PointState.POINT_COMPLETE,
                'let': PointState.SERVING_SECOND,  # Repeat
                'double_fault': PointState.POINT_COMPLETE,
                'in': PointState.RETURN
            },
            PointState.RETURN: {
                'error': PointState.POINT_COMPLETE,
                'in': PointState.RALLY
            },
            PointState.RALLY: {
                'in': PointState.RALLY,  # Continue rally
                'winner': PointState.POINT_COMPLETE,
                'forced_error': PointState.POINT_COMPLETE,
                'unforced_error': PointState.POINT_COMPLETE,
                'net': PointState.POINT_COMPLETE
            }
        }

        return transitions.get(current_state, {}).get(action)


# ============================================
# VALIDATION FUNCTIONS
# ============================================

class TennisValidator:
    """Validation functions for tennis data"""

    @staticmethod
    def validate_player(player: str) -> bool:
        """Validate player value"""
        return player in ValidValues.PLAYERS

    @staticmethod
    def validate_serve_type(serve_type: Optional[str]) -> bool:
        """Validate serve type"""
        if serve_type is None:
            return True
        return serve_type in ValidValues.SERVE_TYPES

    @staticmethod
    def validate_serve_result(serve_result: Optional[str]) -> bool:
        """Validate serve result"""
        if serve_result is None:
            return True
        return serve_result in ValidValues.SERVE_RESULTS

    @staticmethod
    def validate_return_result(return_result: Optional[str]) -> bool:
        """Validate return result"""
        if return_result is None:
            return True
        return return_result in ValidValues.RETURN_RESULTS

    @staticmethod
    def validate_stroke_type(stroke_type: Optional[str]) -> bool:
        """Validate stroke type"""
        if stroke_type is None:
            return True
        return stroke_type in ValidValues.STROKE_TYPES

    @staticmethod
    def validate_direction(direction: Optional[str]) -> bool:
        """Validate direction"""
        if direction is None:
            return True
        return direction in ValidValues.DIRECTIONS

    @staticmethod
    def validate_final_stroke_result(result: Optional[str]) -> bool:
        """Validate final stroke result"""
        if result is None:
            return True
        return result in ValidValues.FINAL_STROKE_RESULTS


# ============================================
# POINT WINNER CALCULATION
# ============================================

class PointWinnerCalculator:
    """Calculate point winner based on game events"""

    @staticmethod
    def calculate_winner(
            server: str,
            serve_result: str,
            return_result: Optional[str],
            final_stroke_player: Optional[str],
            final_stroke_result: Optional[str]
    ) -> Optional[str]:
        """
        Calculate who won the point

        Returns:
            'student' or 'opponent' or None if point not complete
        """
        # Ace - server wins
        if serve_result == 'ace':
            return server

        # Double fault - receiver wins
        if serve_result == 'double_fault':
            return 'opponent' if server == 'student' else 'student'

        # Let or fault - point not complete
        if serve_result in ['let', 'fault']:
            return None

        # Return error - server wins
        if return_result == 'error':
            return server

        # Return in - check final stroke
        if return_result == 'in' and final_stroke_player and final_stroke_result:
            # Winner - player who hit it wins
            if final_stroke_result == 'winner':
                return final_stroke_player

            # Forced Error - player who hit it wins (opponent couldn't return)
            if final_stroke_result == 'forced_error':
                return final_stroke_player  # ← اصلاح شد

            # Unforced Error - opponent wins
            if final_stroke_result == 'unforced_error':
                return 'opponent' if final_stroke_player == 'student' else 'student'

            # Net - opponent wins
            if final_stroke_result == 'net':
                return 'opponent' if final_stroke_player == 'student' else 'student'

        return None


# ============================================
# HELPER FUNCTIONS
# ============================================

class TennisHelpers:
    """Helper functions for tennis logic"""

    @staticmethod
    def get_valid_values() -> Dict[str, List[str]]:
        """Get all valid values as a dictionary"""
        return {
            'players': ValidValues.PLAYERS,
            'serve_types': ValidValues.SERVE_TYPES,
            'serve_results': ValidValues.SERVE_RESULTS,
            'return_results': ValidValues.RETURN_RESULTS,
            'stroke_types': ValidValues.STROKE_TYPES,
            'directions': ValidValues.DIRECTIONS,
            'final_stroke_results': ValidValues.FINAL_STROKE_RESULTS,
            'match_status': ValidValues.MATCH_STATUS,
            'match_results': ValidValues.MATCH_RESULTS
        }

    @staticmethod
    def validate_point_data(point_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate complete point data

        Returns:
            {'valid': bool, 'errors': list}
        """
        errors = []

        # Validate server
        if not TennisValidator.validate_player(point_data.get('server')):
            errors.append(f"Invalid server: {point_data.get('server')}")

        # Validate serve type
        if not TennisValidator.validate_serve_type(point_data.get('serve_type')):
            errors.append(f"Invalid serve_type: {point_data.get('serve_type')}")

        # Validate serve result
        if not TennisValidator.validate_serve_result(point_data.get('serve_result')):
            errors.append(f"Invalid serve_result: {point_data.get('serve_result')}")

        # Validate return result
        if not TennisValidator.validate_return_result(point_data.get('return_result')):
            errors.append(f"Invalid return_result: {point_data.get('return_result')}")

        # Validate final stroke
        if point_data.get('final_stroke_player'):
            if not TennisValidator.validate_player(point_data.get('final_stroke_player')):
                errors.append(f"Invalid final_stroke_player: {point_data.get('final_stroke_player')}")

        if point_data.get('final_stroke_type'):
            if not TennisValidator.validate_stroke_type(point_data.get('final_stroke_type')):
                errors.append(f"Invalid final_stroke_type: {point_data.get('final_stroke_type')}")

        if point_data.get('final_stroke_direction'):
            if not TennisValidator.validate_direction(point_data.get('final_stroke_direction')):
                errors.append(f"Invalid final_stroke_direction: {point_data.get('final_stroke_direction')}")

        if point_data.get('final_stroke_result'):
            if not TennisValidator.validate_final_stroke_result(point_data.get('final_stroke_result')):
                errors.append(f"Invalid final_stroke_result: {point_data.get('final_stroke_result')}")

        # Validate point winner
        if not TennisValidator.validate_player(point_data.get('point_winner')):
            errors.append(f"Invalid point_winner: {point_data.get('point_winner')}")

        return {
            'valid': len(errors) == 0,
            'errors': errors
        }