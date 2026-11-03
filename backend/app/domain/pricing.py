"""Pure pricing rules (no I/O). All money values are integers in the coach currency (Toman)."""
from dataclasses import dataclass

from app.domain.enums import BillingMode
from app.core.exceptions import ValidationError


@dataclass(frozen=True)
class PriceBreakdown:
    session_price: int
    court_cost: int
    coach_income: int

    @classmethod
    def build(cls, session_price: int, court_cost: int = 0, coach_income: int | None = None) -> "PriceBreakdown":
        if session_price < 0 or court_cost < 0:
            raise ValidationError("Prices must be positive", code="invalid_price")
        if court_cost > session_price:
            raise ValidationError("Court cost cannot exceed session price", code="invalid_price")
        if coach_income is None:
            coach_income = session_price - court_cost
        if court_cost + coach_income != session_price:
            raise ValidationError(
                "session_price must equal court_cost + coach_income", code="price_mismatch"
            )
        return cls(session_price, court_cost, coach_income)

    def scale(self, amount: int) -> "PriceBreakdown":
        """Return a proportional breakdown for `amount` (e.g. a student's share)."""
        if self.session_price == 0:
            return PriceBreakdown(amount, 0, amount)
        court = round(self.court_cost * amount / self.session_price)
        return PriceBreakdown(amount, court, amount - court)


def split_amount(total: int, parts: int) -> list[int]:
    """Split an integer amount into `parts` shares whose sum equals `total` exactly.

    1_400_000 / 3 -> [466_667, 466_667, 466_666]
    """
    if parts <= 0:
        return []
    base, remainder = divmod(total, parts)
    return [base + (1 if i < remainder else 0) for i in range(parts)]


def per_student_shares(
    total_price: int, member_count: int, mode: BillingMode, payer_index: int = 0
) -> list[int]:
    """Compute default per-session share for each member according to billing mode."""
    if member_count <= 0:
        return []
    if mode == BillingMode.PER_STUDENT:
        return [total_price] * member_count
    if mode == BillingMode.SPLIT:
        return split_amount(total_price, member_count)
    # LUMP: one payer covers all
    return [total_price if i == payer_index else 0 for i in range(member_count)]


def term_total(price_per_session: int, total_sessions: int | None) -> int:
    return price_per_session * (total_sessions or 0)
