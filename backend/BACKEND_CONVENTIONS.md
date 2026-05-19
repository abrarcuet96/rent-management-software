# Govaly Backend — Conventions Document

> Extracted from actual code at `/src/` and `/tests/`. No inference — only what exists.

---

## Structure & Organization

### Folder Structure

Each domain lives under `src/{domain}/` with a consistent internal layout:

```
src/
├── main.py                 # App creation, middleware, router registration
├── config.py               # Pydantic Settings singleton (`settings`)
├── database.py             # Engine + session factories
├── constants.py            # DB naming convention, Environment enum
├── common/                 # Shared utilities (models, schemas, queries, utils, enums, filters, response, exceptions)
│   ├── models.py           # Shared models (Comment, Media)
│   ├── schemas.py          # Shared schemas (BaseModelSchema, MediaOut, CommentOut, etc.)
│   ├── queries.py          # Shared query helpers (get_instance_or_404, async_delete_instance_or_404, etc.)
│   ├── utils.py            # Shared utilities (generate_public_id, generate_order_no, S3 upload, etc.)
│   ├── enums.py            # Shared enums (District, Division, SortOrder, BoolEnum, etc.)
│   ├── filters.py          # PaginationParams, FilterParams, PaginationResponse
│   ├── response.py         # StandardResponse, create_response
│   ├── exceptions.py       # HTTP400, HTTP403, HTTP404, HTTP500
│   ├── mixins.py           # CommonFieldMixin, TimestampMixin, IDMixin
│   ├── const.py            # Domain constants
│   └── routes.py           # Common routes
├── {domain}/
│   ├── __init__.py
│   ├── models.py           # SQLModel table definitions
│   ├── schemas.py          # Pydantic request/response schemas
│   ├── services.py         # Business logic (all async, takes session first)
│   ├── queries.py          # Complex query builders (SQLAlchemy select statements)
│   ├── utils.py            # Domain-specific utilities
│   ├── enums.py            # Domain-specific enums (StrEnum)
│   ├── const.py            # Domain constants
│   ├── associations.py     # Many-to-many link models (SQLModel without table=True)
│   └── routes/
│       ├── __init__.py
│       ├── app_v1_routes.py   # Customer-facing routes (prefix: /v1/{domain})
│       ├── admin_routes.py    # Admin routes (prefix: /{domain}, global auth guard)
│       └── seller_routes.py   # Seller routes (prefix: /shop/{domain}, global auth guard)
alembic/
├── env.py                  # Migration environment (imports all models for autodetect)
└── versions/               # Migration files
tests/
├── conftest.py             # Shared fixtures (test_engine, db_session, test_app, client, mock_sms, mock_email)
└── {domain}/
    ├── __init__.py
    ├── test_*.py           # Integration tests per domain
    └── utils.py            # Test helper functions (payload builders, DB helpers)
```

### Real Domain Examples

| Domain        | Path                 | Has `queries.py` | Has `associations.py` | Has `const.py` | Route Files                                               |
| ------------- | -------------------- | ---------------- | --------------------- | -------------- | --------------------------------------------------------- |
| users         | `src/users/`         | Yes              | Yes                   | Yes            | `app_v1_routes.py`, `admin_routes.py`, `seller_routes.py` |
| products      | `src/products/`      | Yes              | Yes                   | No             | `app_v1_routes.py`, `admin_routes.py`, `seller_routes.py` |
| orders        | `src/orders/`        | Yes              | Yes                   | Yes            | `app_v1_routes.py`, `admin_routes.py`, `seller_routes.py` |
| payments      | `src/payments/`      | Yes              | No                    | No             | `app_v1_routes.py`, `admin_routes.py`, `seller_routes.py` |
| tracking      | `src/tracking/`      | No               | No                    | No             | `routes.py` (single file, no subdirectory)                |
| notifications | `src/notifications/` | No               | Yes                   | No             | `routes.py` (single file)                                 |
| auth          | `src/auth/`          | No               | Yes                   | No             | `app_v1_routes.py`, `admin_routes.py`                     |
| home          | `src/home/`          | No               | No                    | Yes            | `routes.py` (single file)                                 |
| marketing     | `src/marketing/`     | No               | No                    | No             | `routes/admin_routes.py` only                             |
| metrics       | `src/metrics/`       | No               | No                    | No             | `routes/admin_routes.py`, `routes/seller_routes.py`       |
| securities    | `src/securities/`    | No               | No                    | No             | `routes.py` (single file)                                 |
| brands        | `src/brands/`        | No               | No                    | No             | `routes.py` (single file)                                 |
| app           | `src/app/`           | No               | No                    | No             | `routers.py` (note: named `routers.py`, not `routes.py`)  |
| third_party   | `src/third_party/`   | No               | No                    | No             | `routes/admin_routes.py` only                             |

### File Naming Conventions

| File Type         | Pattern             | Examples                                                    |
| ----------------- | ------------------- | ----------------------------------------------------------- |
| Router (customer) | `app_v1_routes.py`  | `src/users/routes/app_v1_routes.py`                         |
| Router (admin)    | `admin_routes.py`   | `src/users/routes/admin_routes.py`                          |
| Router (seller)   | `seller_routes.py`  | `src/users/routes/seller_routes.py`                         |
| Router (single)   | `routes.py`         | `src/tracking/routes.py`, `src/notifications/routes.py`     |
| Models            | `models.py`         | `src/users/models.py`                                       |
| Schemas           | `schemas.py`        | `src/users/schemas.py`                                      |
| Services          | `services.py`       | `src/users/services.py`                                     |
| Queries           | `queries.py`        | `src/users/queries.py`                                      |
| Utils             | `utils.py`          | `src/users/utils.py`                                        |
| Enums             | `enums.py`          | `src/users/enums.py`                                        |
| Constants         | `const.py`          | `src/users/const.py` (note: `const.py`, not `constants.py`) |
| Associations      | `associations.py`   | `src/users/associations.py`                                 |
| Test helpers      | `utils.py`          | `tests/auth/utils.py`                                       |
| Test files        | `test_{feature}.py` | `tests/auth/test_auth.py`                                   |

---

## API Design

### Route Prefixes & Auth Guards

Registered in `src/main.py` via `app.include_router()`:

| Audience     | Prefix Pattern   | Auth Guard                                                                                | Example                                   |
| ------------ | ---------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------- |
| Customer app | `/v1/{domain}`   | Per-route via `Depends(get_current_customer_user)` or `Depends(get_current_user_or_none)` | `/v1/users`, `/v1/products`, `/v1/orders` |
| Admin        | `/{domain}`      | Global: `dependencies=[Depends(get_current_admin_user)]`                                  | `/users`, `/products`, `/orders`          |
| Seller       | `/shop/{domain}` | Global: `dependencies=[Depends(get_current_seller_user)]`                                 | `/shop/products`, `/shop/orders`          |
| Auth         | `/v1/auth`       | No global guard (per-route)                                                               | `/v1/auth/register`, `/v1/auth/login`     |

### Router Registration Pattern (`src/main.py`)

```python
# Customer app routers (some with auth, some without)
app.include_router(app_v1_product_router, prefix="/v1/products", tags=["App Product"])
app.include_router(
    app_v1_order_router,
    prefix="/v1/orders",
    tags=["App Order"],
    dependencies=[Depends(get_current_customer_user)],
)

# Admin routers (all guarded globally)
app.include_router(
    admin_product_router,
    prefix="/products",
    tags=["Admin Products"],
    dependencies=[Depends(get_current_admin_user)],
)

# Seller routers (all guarded globally)
app.include_router(
    seller_product_router,
    prefix="/shop/products",
    tags=["Seller Products"],
    dependencies=[Depends(get_current_seller_user)],
)
```

### Endpoint Structure

Every route handler follows this pattern:

```python
@router.get("/sellers/{public_id}")
async def get_seller(
    session: Annotated[AsyncSession, Depends(get_session)],
    public_id: str,
) -> StandardResponse[dict]:
    response = await services.get_seller(session=session, public_id=public_id)
    return create_response(response, message="Returned seller details successfully")
```

### HTTP Method Usage

| Method   | Usage                            | Example                                                      |
| -------- | -------------------------------- | ------------------------------------------------------------ |
| `GET`    | Retrieve single resource or list | `GET /sellers/{public_id}`, `GET /sellers/detail`            |
| `POST`   | Create resource                  | `POST /sellers` (with `status_code=status.HTTP_201_CREATED`) |
| `PUT`    | Full/partial update              | `PUT /sellers/{public_id}`                                   |
| `DELETE` | Soft delete                      | `DELETE /sellers/advisors/{public_id}`                       |

### Query Params, Path Params, Request Body

**Path params**: Always use `public_id` (string), never `id` (int):

```python
@router.get("/sellers/{public_id}")
async def get_seller(session: AsyncSession, public_id: str):
```

**Query params**: Passed as function parameters with type hints:

```python
async def get_sellers(
    session: AsyncSession,
    pagination: Annotated[PaginationParams, Depends(PaginationParams)],
    search: str | None = None,
) -> StandardResponse[list[dict]]:
```

**Filter params**: Passed via `Depends(FilterParams)` or `Depends(SearchFilter)`:

```python
async def get_customer_tickets(
    session: AsyncSession,
    filter_parameters: Annotated[FilterParams, Depends(FilterParams)],
    pagination: Annotated[PaginationParams, Depends(PaginationParams)],
) -> StandardResponse[dict]:
```

**Request body**: Pydantic schema as positional parameter (no `Depends`):

```python
async def create_seller(
    session: AsyncSession,
    client_ip: Annotated[str, Depends(get_client_ip)],
    user: Annotated[User, Depends(get_current_admin_user)],
    payload: schemas.SellerCreate,
) -> StandardResponse[None]:
```

### Dependency Order in Route Handlers

Consistent parameter ordering across all routes:

1. `session: Annotated[AsyncSession, Depends(get_session)]` — always first
2. `client_ip: Annotated[str, Depends(get_client_ip)]` — when activity logging is needed
3. `user: Annotated[User, Depends(get_current_*_user)]` — when authenticated user is needed
4. `pagination: Annotated[PaginationParams, Depends(PaginationParams)]` — for list endpoints
5. `filter_parameters: Annotated[FilterParams, Depends(FilterParams)]` — for filtered lists
6. Path params (e.g., `public_id: str`, `slug: str`)
7. Request body schemas (e.g., `payload: schemas.SellerCreate`)

---

## Models

### Model Definition Pattern

All models inherit from `CommonFieldMixin` and use `table=True`:

```python
class Seller(CommonFieldMixin, table=True):
    shop_name: str
    owner_name: str
    slug: str = Field(sa_column=sa.Column(sa.String, unique=True, nullable=False))
    # ...
```

### Base Mixins (`src/common/mixins.py`)

```python
class TimestampMixin(SQLModel):
    created_at: datetime = Field(
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"server_default": func.now()},
        nullable=False,
    )
    updated_at: datetime = Field(
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"server_default": func.now(), "onupdate": func.now()},
        nullable=False,
    )

class IDMixin(SQLModel):
    id: int | None = Field(default=None, primary_key=True)
    public_id: str = Field(default_factory=lambda: generate_public_id(), unique=True, max_length=11)

class CommonFieldMixin(IDMixin, TimestampMixin):
    is_active: bool | None = Field(default=True, nullable=False)
```

Every model automatically gets: `id`, `public_id`, `is_active`, `created_at`, `updated_at`.

### Foreign Key Pattern

```python
# Nullable FK
seller_advisor_id: int | None = Field(default=None, foreign_key="selleradvisor.id")

# Required FK
customer_id: int = Field(foreign_key="customer.id", nullable=False)

# FK with unique constraint
seller_id: int | None = Field(default=None, foreign_key="seller.id", nullable=True, unique=True)
```

### Relationship Pattern

```python
# One-to-many
products: list["Product"] = Relationship(back_populates="seller")

# Many-to-one (Optional)
seller: Optional["Seller"] = Relationship(back_populates="products")

# Many-to-many via link model
discounts: list["Discount"] = Relationship(
    back_populates="sellers", link_model=DiscountSellerLink
)

# Multiple FKs to same table (disambiguation)
logo: Optional["Media"] = Relationship(
    back_populates="seller_logo_images",
    sa_relationship_kwargs={"foreign_keys": "Seller.logo_image_id"},
)
```

### Association (Link) Models (`src/{domain}/associations.py`)

Many-to-many links are SQLModel classes **without** `table=True`:

```python
# src/products/associations.py
class DiscountSellerLink(SQLModel, table=True):
    discount_id: int | None = Field(default=None, foreign_key="discount.id", primary_key=True)
    seller_id: int | None = Field(default=None, foreign_key="seller.id", primary_key=True)
```

### Table Naming

Tables use the **lowercase class name** (SQLModel default):

- `Seller` → `seller`
- `ProductVariant` → `productvariant`
- `CustomerAddress` → `customeraddress`

### Column Naming

- snake_case for all columns: `shop_name`, `is_verified`, `total_points`
- FK columns: `{table_name}_id` pattern: `seller_id`, `customer_id`, `category_id`

### Numeric/Decimal Fields

```python
rating: Decimal = Field(
    sa_column=sa.Column(sa.Numeric(precision=3, scale=2), nullable=False, default=0),
)
commission: Decimal = Field(
    sa_column=sa.Column(sa.Numeric(precision=10, scale=2), nullable=False)
)
```

### DateTime Fields

```python
discount_start_date: datetime | None = Field(sa_type=DateTime(timezone=True), nullable=True)
```

### JSON Fields

```python
regions: list[District] = Field(sa_column=sa.Column(sa.JSON, nullable=False))
chart: dict | None = Field(sa_column=sa.Column(sa.JSON, nullable=False))
```

### Check Constraints

```python
class User(CommonFieldMixin, table=True):
    __table_args__ = (
        CheckConstraint("email IS NOT NULL OR mobile IS NOT NULL", name="email_or_mobile_required"),
    )
```

### Indexes

```python
class Product(CommonFieldMixin, table=True):
    __table_args__ = (
        Index("idx_product_name_trgm", "name", postgresql_ops={"name": "gin_trgm_ops"}, postgresql_using="gin"),
    )
```

### Soft Delete Pattern

All models have `is_active: bool = True`. Soft deletion is done via:

```python
db_instance.is_active = False
await session.commit()
```

Query filtering always includes `model.is_active`:

```python
select(Seller).where(Seller.is_active, Seller.public_id == public_id)
```

### Inheritance Pattern for Comment Models

```python
# Base class (no table=True)
class Comment(CommonFieldMixin):
    comment: str
    created_by_id: int = Field(foreign_key="user.id", nullable=False)

# Concrete models
class SellerComment(Comment, table=True):
    seller_id: int = Field(foreign_key="seller.id")
    seller: "Seller" = Relationship(back_populates="comments")
    created_by: "User" = Relationship(back_populates="seller_comments")
```

---

## Schemas

### Schema Naming Convention

| Purpose                             | Suffix                       | Example                                                     |
| ----------------------------------- | ---------------------------- | ----------------------------------------------------------- |
| Base fields shared by Create/Update | `Base`                       | `SellerBase`, `CustomerAddressBase`                         |
| Create request                      | `Create`                     | `SellerCreate`, `ProductCreate`, `CustomerCreateAdmin`      |
| Create (app-specific)               | `CreateApp`                  | `SellerCreateApp`, `CustomerTicketAppCreate`                |
| Update request                      | `Update`                     | `SellerUpdate`, `ProductUpdate`, `CustomerAddressUpdate`    |
| Output/response                     | `Out`                        | `SellerOut`, `CustomerOut`, `ProductOut`                    |
| Detailed output                     | `DetailOut`                  | `CustomerDetailOut`, `SellerDetailOut`, `EmployeeDetailOut` |
| Short/dropdown output               | `ShortOut`, `DropdownOut`    | `BrandShortOut`, `CustomerDropdownOut`                      |
| App-specific output                 | `AppOut`                     | `CustomerAppOut`, `CustomerTicketAppOut`                    |
| Nested grouping                     | No suffix (descriptive name) | `SocialMedia`, `BankAccount`, `PaymentOut`, `AddressInfo`   |

### Schema Hierarchy Pattern

```python
class SellerBase(BaseModel):
    shop_name: str
    owner_name: str
    slug: str
    # ...

class SellerCreate(SellerBase, MobileField):
    email: EmailStr | None = None
    mobile: str
    password: str
    confirm_password: str
    # additional create-only fields

class SellerUpdate(SellerBase):
    email: EmailStr | None = None
    mobile: str | None = None
    # all fields nullable for partial updates

class SellerOut(SellerBase):
    public_id: str
    email: EmailStr | None
    mobile: str | None
    # additional output-only fields

    @classmethod
    def from_seller(cls, seller: Seller) -> "SellerOut":
        # factory method to construct from model
```

### Validation Patterns

**Field validators**:

```python
@field_validator("mobile")
@classmethod
def validate_mobile(cls, v: str | None) -> str | None:
    if not re.match(r"^01\d{9}$", v):
        raise ValueError("Mobile number must be exactly 11 digits starting with 01")
    return v
```

**Model validators**:

```python
@model_validator(mode="after")
def check_password(self) -> "SellerCreate":
    if self.password != self.confirm_password:
        raise ValueError("Password and confirmation password do not match")
    return self
```

**Computed fields**:

```python
@computed_field
@property
def total_orders(self) -> int:
    return self.in_progress + self.delivered + self.returned
```

### Factory Methods on Schemas

Schemas have `from_*` class methods to construct from models:

```python
@classmethod
def from_seller(cls, seller: Seller) -> "SellerOut":
    return cls(
        public_id=seller.public_id,
        shop_name=seller.shop_name,
        # ...
    )
```

Or `to_*` async methods to convert to models:

```python
async def to_db_seller(self, session: AsyncSession) -> Seller:
    logo_image_id = await async_get_instance_id_or_404(session, Media, self.logo_image_public_id)
    return Seller(shop_name=self.shop_name, logo_image_id=logo_image_id, ...)
```

### Shared/Common Schemas (`src/common/schemas.py`)

| Schema                | Fields                                                        |
| --------------------- | ------------------------------------------------------------- |
| `BasePublicID`        | `public_id: str`                                              |
| `BaseModelSchema`     | `public_id`, `name`                                           |
| `BaseModelSlugSchema` | `public_id`, `name`, `slug`                                   |
| `CreatedBy`           | `public_id`, `name`                                           |
| `CommentOut`          | `public_id`, `created_at`, `comment`, `created_by: CreatedBy` |
| `MediaOut`            | `public_id`, `url`, `medium_url`, `thumbnail_url`, `alt_text` |
| `MobileField`         | `mobile` with validator                                       |
| `SlugExistsCheck`     | `is_unique`, `public_id`                                      |

---

## Services & Business Logic

### Service Function Naming

| Operation       | Prefix           | Examples                                                                |
| --------------- | ---------------- | ----------------------------------------------------------------------- |
| Create          | `create_`        | `create_seller_with_user`, `create_customer_address`                    |
| Get single      | `get_`           | `get_seller`, `get_customer`, `get_product`                             |
| Get list        | `get_` + plural  | `get_sellers_dropdown`, `get_customers`, `get_products_with_detail`     |
| Update          | `update_`        | `update_seller`, `update_customer_address`                              |
| Delete          | `delete_`        | `delete_customer_address_by_customer`                                   |
| List/dropdown   | `get_*_dropdown` | `get_sellers_dropdown`, `get_brands_dropdown`                           |
| Async helper    | `async_` prefix  | `async_get_products_by_search_with_filter`                              |
| Internal helper | `_` prefix       | `_get_seller_badge_summary`, `_validate_payload_before_creating_seller` |

### Service Function Signature Pattern

All services are **async** and take `session: AsyncSession` as the first parameter:

```python
async def get_seller(session: AsyncSession, public_id: str) -> dict:
async def create_seller_with_user(session: AsyncSession, payload: schemas.SellerCreate) -> None:
async def update_seller(session: AsyncSession, public_id: str, payload: schemas.SellerUpdate) -> None:
```

Return types:

- `None` for create/update/delete
- Model instance for single get
- `tuple[list, int]` for paginated lists (data, total)
- `dict` for complex responses with summaries

### Database Query Pattern

Services use SQLModel's `select()` with `session.exec()`:

```python
async def get_sellers_dropdown(session: AsyncSession, pagination: PaginationParams, search: str | None = None):
    query = (
        select(Seller.public_id, Seller.shop_name, User.mobile, User.email)
        .join(User, User.seller_id == Seller.id)
        .where(Seller.is_active)
    )
    if search:
        query = query.where(Seller.shop_name.ilike(f"%{search}%"))

    total_sellers = await get_count(session, query)
    query = query.order_by(Seller.shop_name).offset(pagination.offset).limit(pagination.size)
    sellers = await session.exec(query)
    return [...], total_sellers
```

### Transaction Pattern

For multi-step creates, use `async with session.begin()`:

```python
async def create_seller_with_user(session: AsyncSession, payload: schemas.SellerCreate) -> None:
    async with session.begin():
        db_seller = await payload.to_db_seller(session)
        session.add(db_seller)
        await session.flush()

        db_user = User(mobile=payload.mobile, seller_id=db_seller.id, ...)
        session.add(db_user)
    await session.commit()
```

### Loading Relationships

```python
select(Seller).options(
    joinedload(Seller.user),
    joinedload(Seller.logo),
    selectinload(Seller.products).selectinload(Product.category),
)
```

### Update Pattern

```python
async def update_seller_advisor(session: AsyncSession, public_id: str, payload: schemas.SellerAdvisorUpdate) -> None:
    db_advisor = await async_get_instance_or_404(session, SellerAdvisor, public_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_advisor, key, value)
    await session.commit()
```

---

## Authentication & Authorization

### Auth Dependency Functions (`src/auth/utils.py`)

| Function                           | Purpose                                  | Used By                          |
| ---------------------------------- | ---------------------------------------- | -------------------------------- |
| `get_current_user`                 | Any authenticated user                   | Auth routes                      |
| `get_current_user_or_none`         | Optional auth (returns None if no token) | App v1 routes (public endpoints) |
| `get_current_admin_user`           | Admin role only                          | Admin routes (global guard)      |
| `get_current_seller_user`          | Seller role only                         | Seller routes (global guard)     |
| `get_current_customer_user`        | Customer role only                       | App v1 private routes            |
| `get_current_admin_or_seller_user` | Admin or seller                          | Shared admin/seller routes       |

### JWT Token Format

```python
create_access_token(data={"sub": user.public_id, "role": user.role})
```

Token decoded via `get_public_id_from_token()` which extracts `sub` claim.

### RBAC Permission System (`src/auth/permissions.py`)

Permission strings: `"{resource}:{action}"` (e.g., `"CUSTOMER:READ"`, `"SHOP:CREATE"`)

```python
# Single permission
@router.post("/customers", dependencies=[Depends(require_permission(PermissionResource.CUSTOMER, PermissionAction.CREATE))])

# Any of multiple permissions
@router.get("/sellers/check-slug/{slug}", dependencies=[Depends(require_any_permission(
    (PermissionResource.SHOP, PermissionAction.CREATE),
    (PermissionResource.SHOP, PermissionAction.UPDATE),
))])

# All permissions required
@router.put("/sellers/{public_id}", dependencies=[Depends(require_all_permissions(
    (PermissionResource.SHOP, PermissionAction.READ),
    (PermissionResource.SHOP, PermissionAction.UPDATE),
))])
```

Permissions are cached via `@async_cache_result(key_prefix="user_permissions", tags=["permissions"])`.

### Activity Logging

Every mutating admin/seller action logs an activity:

```python
create_async_activity_log(
    session, user.id, client_ip, description="Created seller", data=payload.model_dump()
)
```

### Client IP Extraction

```python
client_ip: Annotated[str, Depends(get_client_ip)]
```

Checks headers in order: `X-Client-IP`, `X-Forwarded-For`, `X-Real-IP`, then `request.client.host`.

---

## Error Handling

### Custom HTTP Exceptions (`src/common/exceptions.py`)

```python
class HTTP400(HTTPException):
    def __init__(self, detail: str) -> None:
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

class HTTP403(HTTPException): ...
class HTTP404(HTTPException): ...
class HTTP500(HTTPException): ...
```

### Usage Pattern

```python
from src.common.exceptions import HTTP400, HTTP404

raise HTTP400("Seller with this slug already exists")
raise HTTP404("Customer not found")
```

### Query Helpers with 404

```python
db_seller = await async_get_instance_or_404(session, Seller, public_id)
# Raises HTTPException(status=404, detail="Seller not found")
```

### Validation Errors

Pydantic validation errors return HTTP 422 with FastAPI's default format:

```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error"
    }
  ]
}
```

### Credential Exceptions

```python
CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)
FORBIDDEN_EXCEPTION = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Insufficient Access",
    headers={"WWW-Authenticate": "Bearer"},
)
```

---

## Dependencies & Injection

### Session Factories (`src/database.py`)

Two separate session factories:

| Factory         | Type                 | Driver   | Used In                              |
| --------------- | -------------------- | -------- | ------------------------------------ |
| `get_db()`      | Sync `Session`       | psycopg2 | Auth routes, legacy                  |
| `get_session()` | Async `AsyncSession` | asyncpg  | Users, products, orders, most routes |

```python
def get_db() -> Generator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_session() -> AsyncGenerator[AsyncSession]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

### Dependency Usage in Routes

```python
# Async session (most routes)
session: Annotated[AsyncSession, Depends(get_session)]

# Sync session (auth routes only)
db: Annotated[Session, Depends(get_db)]
```

### Other Common Dependencies

| Dependency                  | Source                    | Purpose                             |
| --------------------------- | ------------------------- | ----------------------------------- |
| `get_client_ip`             | `src/auth/utils.py`       | Extract client IP from headers      |
| `get_current_customer_user` | `src/auth/utils.py`       | Auth guard for customer routes      |
| `get_current_admin_user`    | `src/auth/utils.py`       | Auth guard for admin routes         |
| `get_current_seller_user`   | `src/auth/utils.py`       | Auth guard for seller routes        |
| `get_current_user_or_none`  | `src/auth/utils.py`       | Optional auth (no error if missing) |
| `PaginationParams`          | `src/common/filters.py`   | Pagination query params             |
| `FilterParams`              | `src/common/filters.py`   | Filter query params                 |
| `require_permission(...)`   | `src/auth/permissions.py` | RBAC permission check               |

---

## Naming Conventions

### Functions

- snake_case: `get_seller`, `create_customer_address`, `async_get_products_by_search_with_filter`
- Private helpers: `_get_seller_badge_summary`, `_validate_payload_before_creating_seller`

### Classes

- PascalCase: `Seller`, `ProductVariant`, `SellerCreate`, `CustomerDetailOut`
- Mixins: `CommonFieldMixin`, `TimestampMixin`, `IDMixin`

### Variables

- snake_case: `shop_name`, `public_id`, `filter_parameters`, `pagination_response`

### Constants

- UPPER_SNAKE_CASE: `CUSTOMER_BADGES`, `SELLER_BADGES`, `INITIAL_CUSTOMER_POINT`, `DEFAULT_SELLER_COMMISSION`
- In `const.py` files (not `constants.py`)

### Files

- snake_case: `app_v1_routes.py`, `admin_routes.py`, `seller_routes.py`
- Single-word: `models.py`, `schemas.py`, `services.py`, `queries.py`, `utils.py`, `enums.py`

### Enums

All enums inherit from `StrEnum`:

```python
class SellerStatus(StrEnum):
    ACTIVE = "ACTIVE"
    PENDING = "PENDING"
    ON_HOLD = "ON_HOLD"
```

Enum values are UPPER_SNAKE_CASE keys with matching string values.

---

## Response Structure

### StandardResponse (`src/common/response.py`)

```python
class StandardResponse(BaseModel, Generic[T]):
    pagination: PaginationResponse | None
    detail: str
    data: T
```

### create_response Helper

```python
MESSAGE_200 = "Returned successfully"
MESSAGE_201 = "Created successfully"

def create_response(
    data: list[dict] | dict | list[BaseModel] | BaseModel | None = None,
    message: str = MESSAGE_200,
    pagination: PaginationResponse | None = None,
) -> StandardResponse:
    return StandardResponse(detail=message, data=data, pagination=pagination)
```

### Success Response Examples

**Single item**:

```json
{
  "pagination": null,
  "detail": "Returned seller details successfully",
  "data": { "public_id": "...", "shop_name": "..." }
}
```

**List with pagination**:

```json
{
  "pagination": { "page": 1, "size": 10, "total": 42 },
  "detail": "Returned Seller data successfully",
  "data": { "summary": {...}, "sellers": [...] }
}
```

**Create (201)**:

```json
{
  "pagination": null,
  "detail": "Customer created successfully",
  "data": null
}
```

### Pagination Pattern

```python
pagination_response = PaginationResponse(
    page=pagination.page, size=pagination.size, total=total_items
)
return create_response(data=response, message="...", pagination=pagination_response)
```

`PaginationParams`:

- `page: int = Field(default=1, ge=1)`
- `size: int = Field(default=10, ge=1, le=100)`
- Computed `offset` property: `(page - 1) * size`

### Message Conventions

- Success list: `"Returned {resource} successfully"` or `"Returned {resource} data successfully"`
- Create: `"{Resource} created successfully"`
- Update: `"Updated {resource} successfully"`
- Delete: `"{Resource} deleted successfully"`
- Dropdown: `"{Resource} dropdown returned successfully"`

---

## Migrations

### Alembic Configuration

- Config: `alembic.ini` with `script_location = alembic`
- Environment: `alembic/env.py`
- Target metadata: `SQLModel.metadata`
- Auto-detect: `config.compare_type = True`, `config.compare_server_default = True`

### Model Import Pattern in `alembic/env.py`

All models must be explicitly imported for Alembic to detect them:

```python
from src.users.models import Seller, SellerBanner  # noqa: F401
from src.products.models import Product, Category, Brand  # noqa: F401
# ... etc
```

### URL Handling

The async URL (`postgresql+asyncpg://...`) is converted to sync (`postgresql://...`) for Alembic:

```python
db_driver = settings.DATABASE_URL.scheme
db_driver_parts = db_driver.split("+")
if len(db_driver_parts) > 1:
    sync_scheme = db_driver_parts[0].strip()
    DATABASE_URL = DATABASE_URL.replace(db_driver, sync_scheme)
```

---

## Configuration

### Settings Pattern (`src/config.py`)

```python
class CustomBaseSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

class Config(CustomBaseSettings):
    DEBUG: bool = False
    DATABASE_URL: PostgresDsn
    DATABASE_ASYNC_URL: PostgresDsn
    # ... all config fields as class attributes

settings = Config()  # Singleton
```

### Environment Enum (`src/constants.py`)

```python
class Environment(str, Enum):
    LOCAL = "LOCAL"
    TESTING = "TESTING"
    STAGING = "STAGING"
    PRODUCTION = "PRODUCTION"
```

### App Config

```python
app_configs: dict[str, Any] = {"title": "App API"}
if settings.ENVIRONMENT.is_deployed:
    app_configs["root_path"] = f"/v{settings.APP_VERSION}"
if not settings.ENVIRONMENT.is_debug:
    app_configs["openapi_url"] = None  # hide docs
```

---

## Testing Architecture

### Test Database

- Dedicated DB: `govaly_test` at `postgresql://postgres:1234@localhost:5432/govaly_test`
- Created automatically if missing via `_ensure_test_database_exists()`

### Transaction Rollback Isolation

```python
@pytest.fixture
def db_session(test_engine: Engine) -> Generator[SASession]:
    connection = test_engine.connect()
    transaction = connection.begin()
    session = SASession(bind=connection, join_transaction_mode="create_savepoint")
    try:
        yield session
    finally:
        session.close()
        if transaction.is_active:
            transaction.rollback()
        connection.close()
```

### Fixture Hierarchy

```
test_engine (session-scoped)
    └── create_tables (session-scoped, autouse) — SQLModel.metadata.create_all
            └── db_session (function-scoped) — connection + transaction + rollback
                    └── test_app (function-scoped) — app with dependency_overrides
                            └── client (function-scoped) — httpx.AsyncClient
```

### Dependency Override

```python
def override_get_db() -> Generator[SASession]:
    yield db_session

app.dependency_overrides[get_db] = override_get_db
```

### Test Pattern

```python
async def test_register_new_user_with_email_returns_jwt(client: AsyncClient) -> None:
    resp = await client.post(f"{AUTH_PREFIX}/register", json=_register_payload("new.user@gmail.com"))
    assert resp.status_code == 200
    body = resp.json()
    assert body["data"]["status"] == "REGISTERED"
```

### Mock Fixtures

| Fixture      | What it mocks                                                         |
| ------------ | --------------------------------------------------------------------- |
| `mock_sms`   | `src.auth.utils.send_message_by_sms` → `AsyncMock(return_value="OK")` |
| `mock_email` | `src.auth.utils.send_verification_email` → `lambda **_: True`         |

### Test Helper Pattern

Helpers live in `tests/{domain}/utils.py`:

```python
def register_payload(email_or_mobile: str) -> dict:
    return {"email_or_mobile": email_or_mobile, "origin": "WEB"}

def set_password(db_session: SASession, email: str, password: str) -> None:
    user = db_session.query(User).filter(User.email == email).first()
    user.password = get_password_hash(password)
    db_session.commit()
```

---

## DB Naming Convention

Defined in `src/constants.py`:

```python
DB_NAMING_CONVENTION = {
    "ix": "%(column_0_label)s_idx",
    "uq": "%(table_name)s_%(column_0_name)s_key",
    "ck": "%(table_name)s_%(constraint_name)s_check",
    "fk": "%(table_name)s_%(column_0_name)s_fkey",
    "pk": "%(table_name)s_pkey",
}
```

Applied via:

```python
metadata = MetaData(naming_convention=DB_NAMING_CONVENTION)
```

---

## Linting & Formatting

- **Linter**: Ruff (configured in `pyproject.toml`)
- **Pre-commit**: `.pre-commit-config.yaml` runs Ruff on all files
- Command: `ruff check src/` and `ruff format src/`
- Pre-commit hook: `pre-commit run --all-files`

---

## Dev Commands

```bash
source .venv/bin/activate
uvicorn src.main:app --reload       # Dev server
ruff check src/                      # Lint
ruff format src/                     # Format
pre-commit run --all-files           # Pre-commit check
alembic upgrade head                 # Run migrations
alembic revision --autogenerate -m "description"  # Create migration
pytest tests/ -v                     # Run tests
pytest tests/ --cov=src --cov-report=term-missing  # Tests with coverage
```

---

## Key Observations

1. **Public ID is the external identifier** — routes always use `public_id` (11-char nanoid-style string), never expose internal `id` (int) to clients.
2. **Soft deletes are universal** — every model has `is_active`, queries always filter `model.is_active`.
3. **Async-first** — almost all routes use `AsyncSession` via `get_session()`. Only auth routes use sync `Session` via `get_db()`.
4. **Activity logging is mandatory** — every admin/seller mutating action logs via `create_async_activity_log()`.
5. **RBAC is granular** — admin routes use `require_permission()` with `PermissionResource:PermissionAction` pairs, cached in Redis.
6. **Pagination is standardized** — `PaginationParams` via `Depends()`, `PaginationResponse` in output.
7. **FilterParams is a catch-all** — single `FilterParams` class handles all filter query params across domains, with `@computed_field` properties for comma-separated IDs.
8. **Schema factory methods** — `from_*` classmethods on `*Out` schemas, `to_*` async methods on `*Create` schemas.
9. **No service-layer transactions** — transactions are handled at the service level with `async with session.begin()` for multi-step operations.
10. **Models imported in alembic/env.py** — every model must be explicitly imported for migration autodetect to work.
