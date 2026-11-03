import abc
from dataclasses import dataclass

@dataclass
class GatewayInitiateRequest:
    amount: int
    description: str
    callback_url: str
    mobile: str | None = None
    email: str | None = None

@dataclass
class GatewayInitiateResult:
    authority: str
    payment_url: str
    is_success: bool
    error_message: str | None = None

@dataclass
class GatewayVerifyResult:
    is_success: bool
    ref_id: str | None = None
    card_pan: str | None = None
    error_message: str | None = None

class BasePaymentGateway(abc.ABC):
    @abc.abstractmethod
    def initiate(self, req: GatewayInitiateRequest) -> GatewayInitiateResult:
        pass

    @abc.abstractmethod
    def verify(self, authority: str, amount: int) -> GatewayVerifyResult:
        pass
