"""Pure financial rules: FIFO allocation of payments to charges and account status."""
from dataclasses import dataclass, field
from datetime import date

from app.domain.enums import ChargeStatus, FinancialStatus


@dataclass
class ChargeLine:
    id: object
    amount: int
    due_date: date | None
    paid: int = 0
    status: ChargeStatus = ChargeStatus.UNPAID

    @property
    def remaining(self) -> int:
        return self.amount - self.paid


@dataclass
class AccountSnapshot:
    total_charged: int
    total_paid: int
    balance: int  # paid - charged ; negative = debt, positive = credit
    overdue_amount: int
    status: FinancialStatus
    lines: list[ChargeLine] = field(default_factory=list)

    @property
    def debt(self) -> int:
        return max(0, -self.balance)

    @property
    def credit(self) -> int:
        return max(0, self.balance)


def allocate(charges: list[ChargeLine], total_paid: int, today: date) -> list[ChargeLine]:
    """Allocate payments FIFO (oldest due date first) and set each line's status."""
    pool = total_paid
    ordered = sorted(charges, key=lambda c: (c.due_date or date.max))
    for line in ordered:
        line.paid = min(line.amount, max(0, pool))
        pool -= line.paid
        if line.paid >= line.amount:
            line.status = ChargeStatus.PAID
        elif line.due_date and line.due_date < today:
            line.status = ChargeStatus.OVERDUE
        elif line.paid > 0:
            line.status = ChargeStatus.PARTIAL
        else:
            line.status = ChargeStatus.UNPAID
    return ordered


def account_snapshot(charges: list[ChargeLine], total_paid: int, today: date) -> AccountSnapshot:
    lines = allocate(charges, total_paid, today)
    total_charged = sum(c.amount for c in lines)
    balance = total_paid - total_charged
    overdue = sum(c.remaining for c in lines if c.status == ChargeStatus.OVERDUE)
    if balance > 0:
        status = FinancialStatus.CREDIT
    elif balance == 0:
        status = FinancialStatus.SETTLED
    elif overdue > 0:
        status = FinancialStatus.OVERDUE
    elif total_paid > 0:
        status = FinancialStatus.PARTIAL
    else:
        status = FinancialStatus.DEBT
    return AccountSnapshot(total_charged, total_paid, balance, overdue, status, lines)
