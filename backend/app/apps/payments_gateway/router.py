from fastapi import APIRouter
from app.api.deps import CurrentActor, DB
from app.apps.payments_gateway.schemas import (
    InitiateOnlinePaymentRequest, OnlinePaymentInitResponse, VerifyOnlinePaymentRequest, OnlinePaymentVerifyResponse
)
from app.apps.payments_gateway.service import PaymentGatewayService

router = APIRouter(prefix="/payments/online", tags=["payments-gateway"])

@router.post("/initiate", response_model=OnlinePaymentInitResponse, status_code=201)
def initiate_payment(data: InitiateOnlinePaymentRequest, actor: CurrentActor, db: DB):
    service = PaymentGatewayService(db)
    return service.initiate(actor, data)

@router.post("/verify", response_model=OnlinePaymentVerifyResponse)
def verify_payment(data: VerifyOnlinePaymentRequest, db: DB):
    service = PaymentGatewayService(db)
    return service.verify(data.authority)
