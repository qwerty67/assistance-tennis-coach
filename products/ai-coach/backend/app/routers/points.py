from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Match, Point
from app.schemas import PointCreate, PointResponse
from app.services.tennis_logic import (
    TennisValidator,
    PointWinnerCalculator,
    TennisHelpers
)

router = APIRouter()


@router.get("/{match_id}/points", response_model=List[PointResponse])
def get_match_points(
        match_id: int,
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db)
):
    """Get all points for a match"""
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match with id {match_id} not found"
        )

    points = db.query(Point).filter(Point.match_id == match_id).offset(skip).limit(limit).all()
    return points


@router.post("/{match_id}/points", response_model=PointResponse, status_code=status.HTTP_201_CREATED)
def create_point(
        match_id: int,
        point: PointCreate,
        db: Session = Depends(get_db)
):
    """Record a new point"""
    # Verify match exists
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match with id {match_id} not found"
        )

    # Validate point data using tennis logic
    point_data = point.dict()
    validation = TennisHelpers.validate_point_data(point_data)

    if not validation['valid']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Invalid point data",
                "errors": validation['errors']
            }
        )

    # Calculate point winner if not provided
    if not point_data.get('point_winner'):
        calculated_winner = PointWinnerCalculator.calculate_winner(
            server=point_data.get('server'),
            serve_result=point_data.get('serve_result'),
            return_result=point_data.get('return_result'),
            final_stroke_player=point_data.get('final_stroke_player'),
            final_stroke_result=point_data.get('final_stroke_result')
        )

        if calculated_winner:
            point_data['point_winner'] = calculated_winner
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot determine point winner from provided data"
            )

    # Create point
    point_data['match_id'] = match_id
    db_point = Point(**point_data)
    db.add(db_point)
    db.commit()
    db.refresh(db_point)
    return db_point


@router.delete("/{match_id}/points/{point_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_point(
        match_id: int,
        point_id: int,
        db: Session = Depends(get_db)
):
    """Delete a point (undo)"""
    point = db.query(Point).filter(
        Point.id == point_id,
        Point.match_id == match_id
    ).first()

    if not point:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Point with id {point_id} not found"
        )

    db.delete(point)
    db.commit()
    return None