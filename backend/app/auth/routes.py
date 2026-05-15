from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.schemas import LoginRequest, RegisterRequest, TokenData
from app.auth.service import AuthService
from app.core.database import get_db
from app.core.security import create_access_token
from app.shared.schemas import StandardResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> StandardResponse:
    """Register a new owner account and return a JWT access token."""
    service = AuthService(db)
    try:
        owner = await service.register(
            full_name=body.full_name,
            email=str(body.email),
            password=body.password,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    token = create_access_token({"sub": str(owner.id)})
    return StandardResponse(
        success=True,
        data=TokenData(access_token=token),
        message="Account created",
    )


@router.post("/login", response_model=StandardResponse)
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> StandardResponse:
    """Authenticate with email and password, return a JWT access token."""
    service = AuthService(db)
    owner = await service.authenticate(email=str(body.email), password=body.password)
    if owner is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token({"sub": str(owner.id)})
    return StandardResponse(
        success=True,
        data=TokenData(access_token=token),
        message="Login successful",
    )
