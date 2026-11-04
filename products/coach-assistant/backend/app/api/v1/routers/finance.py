import uuid
from datetime import date

from fastapi import APIRouter, Response

from app.api.deps import DB, CoachActor
from app.application.schemas.finance import (
    ChargeCreate, ChargeOut, FinancialSummaryOut, PaymentCreate, PaymentOut,
)
from app.application.services.finance_service import FinanceService

router = APIRouter(tags=["finance"])


@router.get("/payments", response_model=list[PaymentOut])
def list_payments(actor: CoachActor, db: DB, student_id: uuid.UUID | None = None,
                  date_from: date | None = None, date_to: date | None = None):
    return FinanceService(db).list_payments(actor, student_id, date_from, date_to)


@router.post("/payments", response_model=PaymentOut, status_code=201)
def create_payment(data: PaymentCreate, actor: CoachActor, db: DB):
    return FinanceService(db).record_payment(actor, data)


@router.delete("/payments/{payment_id}", status_code=204)
def void_payment(payment_id: uuid.UUID, actor: CoachActor, db: DB):
    FinanceService(db).void_payment(actor, payment_id)
    return Response(status_code=204)


@router.get("/charges", response_model=list[ChargeOut])
def list_charges(actor: CoachActor, db: DB, student_id: uuid.UUID | None = None, status: str | None = None):
    return FinanceService(db).list_charges(actor, student_id, status)


@router.post("/charges", response_model=ChargeOut, status_code=201)
def create_charge(data: ChargeCreate, actor: CoachActor, db: DB):
    return FinanceService(db).create_manual_charge(actor, data)


@router.delete("/charges/{charge_id}", status_code=204)
def void_charge(charge_id: uuid.UUID, actor: CoachActor, db: DB):
    FinanceService(db).void_charge(actor, charge_id)
    return Response(status_code=204)


@router.get("/financial-summary", response_model=FinancialSummaryOut)
def financial_summary(actor: CoachActor, db: DB, months: int = 6, date_from: date | None = None,
                      date_to: date | None = None):
    return FinanceService(db).summary(actor, max(1, min(months, 24)), date_from, date_to)
