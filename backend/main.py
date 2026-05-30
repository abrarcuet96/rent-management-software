import logging

from app.agreements.routes import router as agreements_router
from app.apartments.routes import router as apartments_router
from app.auth.routes import router as auth_router
from app.buildings.routes import router as buildings_router
from app.dashboard.routes import router as dashboard_router
from app.dues.routes import router as dues_router
from app.expenses.routes import router as expenses_router
from app.core.config import settings
from app.middleware.error_handler import ErrorHandlerMiddleware
from app.payments.routes import router as payments_router
from app.reports.routes import router as reports_router
from app.tenants.routes import router as tenants_router
from app.tenants.routes import router_portfolio as tenants_portfolio_router
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

app = FastAPI(
    title="RentFlow API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(ErrorHandlerMiddleware)


# ── exception handlers ────────────────────────────────────────────────────────


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "data": None, "message": exc.detail},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    errors = [
        {
            "field": ".".join(str(loc) for loc in err["loc"][1:]) if len(err["loc"]) > 1 else None,
            "message": err["msg"],
        }
        for err in exc.errors()
    ]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"success": False, "data": errors, "message": "Validation failed"},
    )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"success": False, "data": None, "message": str(exc)},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error("Unhandled exception: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "data": None, "message": "Internal server error"},
    )


# ── routers ───────────────────────────────────────────────────────────────────

API_PREFIX = "/api/v1"

app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(buildings_router, prefix=API_PREFIX)
app.include_router(apartments_router, prefix=API_PREFIX)
app.include_router(tenants_router, prefix=API_PREFIX)
app.include_router(tenants_portfolio_router, prefix=API_PREFIX)
app.include_router(agreements_router, prefix=API_PREFIX)
app.include_router(dues_router, prefix=API_PREFIX)
app.include_router(payments_router, prefix=API_PREFIX)
app.include_router(expenses_router, prefix=API_PREFIX)
app.include_router(dashboard_router, prefix=API_PREFIX)
app.include_router(reports_router, prefix=API_PREFIX)


@app.get("/health", tags=["health"])
async def health_check() -> dict:
    return {"status": "ok"}
