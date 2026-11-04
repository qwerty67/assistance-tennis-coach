from fastapi import APIRouter
from app.services.tennis_logic import TennisHelpers
from app.services.tennis_logic import PointState

router = APIRouter()


@router.get("/valid-values")
def get_valid_values():
    """Get all valid values for tennis game logic"""
    return {
        "success": True,
        "data": TennisHelpers.get_valid_values(),
        "message": "Valid values retrieved successfully"
    }


@router.get("/point-states")
def get_point_states():
    """Get point state machine information"""

    return {
        "success": True,
        "data": {
            "states": [
                PointState.IDLE,
                PointState.SERVING_FIRST,
                PointState.SERVING_SECOND,
                PointState.RETURN,
                PointState.RALLY,
                PointState.POINT_COMPLETE
            ],
            "description": "State machine for point flow"
        },
        "message": "Point states retrieved successfully"
    }