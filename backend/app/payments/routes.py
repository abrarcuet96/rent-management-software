from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi import status as http_status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dues.routes import _due_response
from app.models.payment_record import PaymentRecord
from app.payments.schemas import (
    BulkPaymentDueUpdate,
    BulkPaymentRequest,
    BulkPaymentResult,
    PaymentCreate,
    PaymentRecordResponse,
)
from app.payments.service import PaymentService
from app.shared.dependencies import get_current_owner
from app.shared.schemas import PaginatedResponse, PaginationMeta, StandardResponse

router = APIRouter(tags=["payments"])


def _payment_response(payment: PaymentRecord, due_public_id: UUID) -> PaymentRecordResponse:
    return PaymentRecordResponse(
        public_id=payment.public_id,
        due_public_id=due_public_id,
        amount_paid=payment.amount_paid,
        paid_on=payment.paid_on,
        note=payment.note,
        is_active=payment.is_active,
        created_at=payment.created_at,
    )


@router.post(
    "/dues/{due_public_id}/payments",
    response_model=StandardResponse,
    status_code=http_status.HTTP_201_CREATED,
)
async def record_payment(
    due_public_id: UUID,
    body: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = PaymentService(db, owner_id)
    payment, due = await service.record_payment(due_public_id, body)
    return StandardResponse(
        success=True,
        data={
            "payment": _payment_response(payment, due_public_id),
            "due": await _due_response(due, db),
        },
        message="Payment recorded",
    )


@router.get("/dues/{due_public_id}/payments", response_model=PaginatedResponse)
async def list_payments(
    due_public_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> PaginatedResponse:
    service = PaymentService(db, owner_id)
    payments, total = await service.list_payments(due_public_id, page, page_size)
    return PaginatedResponse(
        success=True,
        data=[_payment_response(p, due_public_id) for p in payments],
        pagination=PaginationMeta(page=page, page_size=page_size, total=total),
    )


@router.post(
    "/payments/bulk",
    response_model=StandardResponse,
    status_code=http_status.HTTP_201_CREATED,
)
async def record_bulk_payment(
    body: BulkPaymentRequest,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = PaymentService(db, owner_id)
    payments, dues, unapplied = await service.record_bulk_payment(body)

    dues_cleared = sum(1 for d in dues if d.status == "paid")
    dues_partial = sum(1 for d in dues if d.status == "partial")
    total_applied = body.total_amount - unapplied

    dues_updated = [
        BulkPaymentDueUpdate(
            due_public_id=d.public_id,
            month=d.month,
            year=d.year,
            applied_amount=p.amount_paid,
            new_status=d.status,
        )
        for d, p in zip(dues, payments)
    ]
    payment_records = [_payment_response(p, d.public_id) for p, d in zip(payments, dues)]

    result = BulkPaymentResult(
        total_applied=total_applied,
        unapplied=unapplied,
        dues_cleared=dues_cleared,
        dues_partially_paid=dues_partial,
        dues_updated=dues_updated,
        payment_records=payment_records,
    )
    return StandardResponse(success=True, data=result, message="Bulk payment applied")
