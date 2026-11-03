import uuid
from app.apps.payments_gateway.base import BasePaymentGateway, GatewayInitiateRequest, GatewayInitiateResult, GatewayVerifyResult

class MockPaymentGateway(BasePaymentGateway):
    """Mock payment gateway for test & offline development environments."""
    def initiate(self, req: GatewayInitiateRequest) -> GatewayInitiateResult:
        auth = f"MOCK_{uuid.uuid4().hex[:12]}"
        url = f"{req.callback_url}?Authority={auth}&Status=OK"
        return GatewayInitiateResult(authority=auth, payment_url=url, is_success=True)

    def verify(self, authority: str, amount: int) -> GatewayVerifyResult:
        if "FAIL" in authority:
            return GatewayVerifyResult(is_success=False, error_message="?????? ???? ??????")
        return GatewayVerifyResult(is_success=True, ref_id=f"REF_{uuid.uuid4().hex[:8]}", card_pan="603799******1234")
