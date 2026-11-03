import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.application.context import Actor
from app.core.exceptions import ValidationError, NotFoundError
from app.apps.payments_gateway.base import GatewayInitiateRequest
from app.apps.payments_gateway.adapters.mock import MockPaymentGateway
from app.apps.payments_gateway.models import OnlinePaymentTransaction
from app.apps.payments_gateway.schemas import InitiateOnlinePaymentRequest, OnlinePaymentInitResponse, OnlinePaymentVerifyResponse
from app.infrastructure.db.models import Student, Coach, Payment
from app.domain.enums import PaymentMethod

class PaymentGatewayService:
    def __init__(self, db: Session, gateway=None):
        self.db = db
        self.gateway = gateway or MockPaymentGateway()

    def initiate(self, actor: Actor, data: InitiateOnlinePaymentRequest) -> OnlinePaymentInitResponse:
        student_id = actor.student_ids[0] if actor.student_ids else None
        if not student_id:
            raise ValidationError("????? ???? ????? ????? ????")

        student = self.db.get(Student, student_id)
        if not student:
            raise NotFoundError("????? ???? ???")

        desc = data.description or f"?????? ????? ????? {student.full_name}"
        res = self.gateway.initiate(GatewayInitiateRequest(
            amount=data.amount,
            description=desc,
            callback_url=data.callback_url,
            mobile=student.phone,
        ))
        if not res.is_success:
            raise ValidationError(res.error_message or "??? ?? ????? ?? ????? ?????")

        tx = OnlinePaymentTransaction(
            student_id=student.id,
            coach_id=data.coach_id,
            amount=data.amount,
            gateway="mock",
            authority=res.authority,
            status="pending",
            term_id=data.term_id,
            class_id=data.class_id,
            description=desc,
        )
        self.db.add(tx)
        self.db.commit()
        self.db.refresh(tx)

        return OnlinePaymentInitResponse(
            transaction_id=tx.id,
            authority=res.authority,
            payment_url=res.payment_url,
        )

    def verify(self, authority: str) -> OnlinePaymentVerifyResponse:
        tx = self.db.scalar(select(OnlinePaymentTransaction).where(OnlinePaymentTransaction.authority == authority))
        if not tx:
            raise NotFoundError("?????? ?????? ?????? ???? ???")

        if tx.status == "success":
            return OnlinePaymentVerifyResponse(
                is_success=True, status="success", amount=tx.amount, ref_id=tx.ref_id, message="?????? ????? ?? ?????? ????? ??? ???"
            )

        res = self.gateway.verify(authority, tx.amount)
        if res.is_success:
            tx.status = "success"
            tx.ref_id = res.ref_id
            tx.card_pan = res.card_pan
            tx.verified_at = datetime.now(timezone.utc)

            # Record payment in Finance records
            from app.application.services.finance_service import FinanceService
            from app.application.schemas.finance import PaymentCreate
            actor_coach = Actor(coach=self.db.get(Coach, tx.coach_id), user=None)
            fs = FinanceService(self.db)
            try:
                fs.record_payment(actor_coach, PaymentCreate(
                    student_id=tx.student_id,
                    amount=tx.amount,
                    paid_at=datetime.now(timezone.utc).date(),
                    method=PaymentMethod.ONLINE,
                    description=f"?????? ?????? ????? ({tx.ref_id or ''})",
                    reference_no=tx.ref_id,
                    term_id=tx.term_id,
                    class_id=tx.class_id,
                ))
            except Exception as e:
                pass  # Soft log

            self.db.commit()
            return OnlinePaymentVerifyResponse(
                is_success=True, status="success", amount=tx.amount, ref_id=tx.ref_id, message="?????? ?? ?????? ????? ? ??? ??"
            )
        else:
            tx.status = "failed"
            tx.error_message = res.error_message
            self.db.commit()
            return OnlinePaymentVerifyResponse(
                is_success=False, status="failed", amount=tx.amount, message=res.error_message or "?????? ?????? ???"
            )
