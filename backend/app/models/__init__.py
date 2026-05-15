# Import all models so Alembic autogenerate can discover them
from app.models.apartment import Apartment
from app.models.building import Building
from app.models.due_expense import DueExpense
from app.models.expense import Expense
from app.models.expense_category import ExpenseCategory
from app.models.monthly_due import MonthlyDue
from app.models.owner import Owner
from app.models.payment_record import PaymentRecord
from app.models.tenant import Tenant
from app.models.tenant_agreement import TenantAgreement

__all__ = [
    "Owner",
    "Building",
    "Apartment",
    "Tenant",
    "TenantAgreement",
    "MonthlyDue",
    "PaymentRecord",
    "ExpenseCategory",
    "Expense",
    "DueExpense",
]
