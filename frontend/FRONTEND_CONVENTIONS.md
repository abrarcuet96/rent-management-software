# FRONTEND_CONVENTIONS.md

> Extracted from the actual codebase. No inferred best practices — only what this project does.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Folder Structure](#folder-structure)
3. [File Naming Conventions](#file-naming-conventions)
4. [Component Conventions](#component-conventions)
5. [Forms](#forms)
6. [Data Fetching & Mutations](#data-fetching--mutations)
7. [API Layer](#api-layer)
8. [Routing & Navigation](#routing--navigation)
9. [State Management](#state-management)
10. [Styling](#styling)
11. [TypeScript](#typescript)
12. [Error Handling](#error-handling)
13. [Naming Conventions Summary](#naming-conventions-summary)
14. [Key Dependencies](#key-dependencies)

---

## Project Overview

A **feature-based, permission-aware admin dashboard** built with:

- React 18 + TypeScript
- React Hook Form + Zod (forms & validation)
- TanStack Query v5 (server state / data fetching)
- Zustand v5 (client state)
- Tailwind CSS v4 + shadcn/ui (styling & components)
- Axios with interceptors (HTTP client)
- React Router DOM v7 (routing)

---

## Folder Structure

```
src/
├── api/                    # API call functions (*.api.ts)
├── apiIntelesence.ts       # Axios instance with interceptors
├── components/
│   ├── custom-ui/          # Custom reusable UI components (by category)
│   │   ├── button/
│   │   ├── form/
│   │   └── ...
│   ├── ui/                 # shadcn/ui components (do not hand-edit)
│   ├── provider/           # Context/QueryClient providers
│   └── utils/              # Utility components
├── constants/              # App-wide constants (*.constants.ts)
├── hooks/                  # Custom React hooks (use*.ts/tsx)
├── layout/
│   ├── admin-layout/       # Main authenticated layout + sub-components
│   └── auth-layout/        # Login/auth flow layout
├── lib/
│   ├── utils.ts            # cn() utility + misc exports
│   ├── handyFunctions.ts   # Shared helper functions
│   ├── FallbackFunctions.ts# Error/toast handler by HTTP status
│   ├── firebase.ts         # Firebase client init
│   └── utils/
│       └── generateRoutes.tsx # Dynamic route generation from sidebar config
├── pages/                  # Feature page components (feature-folder based)
│   ├── auth/
│   ├── product/
│   ├── order/
│   └── ...
├── routes/
│   ├── router.tsx          # createBrowserRouter call
│   └── ProtectedRoute.tsx  # Auth guard wrapper
├── schema/                 # Zod schemas (*.schema.ts)
├── services/               # Service layer (if distinct from api/)
├── store/                  # Zustand stores (*.store.ts)
├── styles/                 # Global CSS
├── types/                  # TypeScript types/interfaces (*.types.ts)
└── utils/                  # Misc utility functions
```

### Key structural rules

- Features are grouped by domain inside `src/pages/` (e.g., `product/`, `order/`, `auth/`).
- Each page folder contains a main page component and a `components/` subfolder for page-specific components.
- Shared components go in `src/components/custom-ui/`, shadcn primitives in `src/components/ui/`.
- Schemas and types are **global**, not co-located with features.

---

## File Naming Conventions

| What              | Pattern                           | Examples                                              |
| ----------------- | --------------------------------- | ----------------------------------------------------- |
| Component         | `PascalCase.tsx`                  | `CustomButton.tsx`, `ProductsFilter.tsx`              |
| Page component    | `[Feature]Page.tsx`               | `ProductsPage.tsx`, `SigninPage.tsx`                  |
| API functions     | `[feature].api.ts`                | `product.api.ts`, `order.api.ts`                      |
| Zod schemas       | `[feature].schema.ts`             | `product.schema.ts`, `user.schema.ts`                 |
| TypeScript types  | `[feature].types.ts`              | `product.types.ts`, `auth.types.ts`                   |
| Zustand stores    | `[feature].store.ts`              | `auth.store.ts`, `addproduct.store.ts`                |
| Constants         | `[feature].constants.ts`          | `sidebar-items.constants.ts`, `ticket.constants.ts`   |
| Custom hooks      | `use[Name].ts` or `use[Name].tsx` | `useFetchData.ts`, `useIndex.tsx`, `usePermission.ts` |
| Utility functions | `camelCase.ts`                    | `handyFunctions.ts`, `FallbackFunctions.ts`           |

---

## Component Conventions

### Export style

- **Reusable / shared components**: named export.
- **Page components**: default export.

```tsx
// Reusable — named export
export const CustomButton = React.forwardRef<HTMLButtonElement, ButtonProps>(...)

// Page — default export
const ProductsPage = () => { ... }
export default ProductsPage;
```

### Props typing

- Props are typed as a separate `interface` when extending HTML elements; otherwise as a plain `type`.
- HTML element extensions use `extends React.ButtonHTMLAttributes<HTMLButtonElement>` (etc.).
- Props destructured with defaults inline.
- `...props` spread for pass-through props.

```tsx
// src/components/custom-ui/button/CustomButton.tsx
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const CustomButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "outline-blue",
      size = "sm",
      className,
      children,
      type = "submit",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={clsx(
          base,
          sizeClasses[size],
          variantClasses[variant],
          className,
        )}
        type={type}
        {...props}
      >
        {children}
      </button>
    );
  },
);
```

### Variant/size pattern

Variants and sizes are defined as string union types and resolved via `Record<Type, string>` maps:

```tsx
type Variant = "outline-blue" | "outline-gray" | "solid-blue" | "link";
type Size = "xs" | "sm" | "md" | "lg";

const sizeClasses: Record<Size, string> = { xs: "...", sm: "...", md: "...", lg: "..." };
const variantClasses: Record<Variant, string> = { "outline-blue": "...", ... };
```

### `forwardRef` usage

Components that wrap native DOM elements (button, input) use `React.forwardRef`.

---

## Forms

### Libraries

- **Form state**: `react-hook-form`
- **Validation**: `zod`
- **Resolver**: `@hookform/resolvers/zod`
- **UI primitives**: shadcn `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`

### Schema definition (`src/schema/`)

Schemas live in `src/schema/[feature].schema.ts`. Enums are exported alongside schemas. Types are **inferred from schemas** in `src/types/`.

```ts
// src/schema/product.schema.ts
import { string, z } from "zod";

export const productTypeEnum = z.enum(["SIMPLE", "VARIABLE"]);
export const productStatusEnum = z.enum([
  "PENDING",
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);

export const createProductSchema = z
  .object({
    name: string()
      .min(30, { message: "Title must be at least 30 characters" })
      .max(100),
    slug: slugSchema?.min(20),
    status: productStatusEnum,
  })
  .superRefine((data, ctx) => {
    if (data.type === "VARIABLE" && data.attributes?.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["variable"],
        message: "At least one variable attribute is required",
      });
    }
  });
```

### Form component setup

Default values are defined as a named `const` (not inline) and exported alongside the form.

```tsx
// src/pages/product/mutateProduct/components/CreateProductForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProductSchema } from "@/schema";

export const createProductDefaultValues: DefaultValues<CREATE_PRODUCT> = {
  name: "",
  slug: "",
  status: "PUBLISHED",
};

const CreateProductForm = ({ onSubmit, formRef, isPending }: props) => {
  const form = useForm<CREATE_PRODUCT>({
    resolver: zodResolver(createProductSchema),
    defaultValues: createProductDefaultValues,
  });

  return <Form {...form}>{/* form fields */}</Form>;
};
```

### Custom form field components (`src/components/custom-ui/form/`)

Each field type has its own wrapper component (e.g., `FormInput.tsx`, `FormPassword.tsx`, `FormSelect.tsx`). They all follow the same structure:

```tsx
// src/components/custom-ui/form/FormPassword.tsx
const FormPassword = ({
  label,
  name,
  form,
  description,
  isRequired,
  placeholder,
}: props) => {
  return (
    <FormField
      control={form?.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col gap-2 w-full">
          <FormLabel className="flex items-center justify-between gap-1">
            <p className="flex items-start gap-1">
              <span>{label}</span>
              {isRequired && (
                <span className="text-destructive font-semibold">*</span>
              )}
            </p>
          </FormLabel>
          <FormControl>
            <PasswordInput placeholder={placeholder} {...field} />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
};
```

---

## Data Fetching & Mutations

### Query hooks

Two primary patterns:

**1. `useFetchData` — generic query wrapper** (`src/hooks/useFetchData.ts`)

```ts
import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
} from "@tanstack/react-query";

const useFetchData = <TData, TError>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: UseQueryOptions<TData, TError>,
) => {
  return useQuery<TData, TError>({
    queryKey,
    queryFn,
    staleTime: 1000,
    ...options,
  });
};
```

**2. `useIndex` — paginated list hook** (`src/hooks/useIndex.tsx`)

Returns `{ data, paginationComponent, searchComponent, isLoading, refetch, ... }`. Persists state in URL search params.

```tsx
const {
  data: productsData,
  isLoading,
  refetch,
  searchComponent,
  paginationComponent,
} = useIndex({
  dependencies: ["getProducts", requirePermission("PRODUCT", "READ")],
  indexFn: getProducts,
  queries: productFilters,
  options: {
    enabled: requirePermission("PRODUCT", "READ"),
    queryKey: [
      "getProducts",
      requirePermission("PRODUCT", "READ"),
      productFilters,
    ],
  },
});
```

### Mutation pattern

Mutations are defined inline inside page/component functions using `useMutation`. Cache is invalidated either via `queryClient.invalidateQueries` or a manual `refetch()` call.

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getFallback } from "@/lib/FallbackFunctions";
import { toast } from "sonner";

const queryClient = useQueryClient();

const deleteMutation = useMutation({
  mutationFn: deleteProduct,
  onSuccess: (response) => {
    if (response?.status === 200) {
      refetch();
      toast.success(response?.data?.detail);
    }
  },
  onError: (error: AxiosError) => {
    getFallback({ error });
  },
});

// Trigger
deleteMutation.mutate({ product_public_id: selectedProduct });
```

```tsx
const updateStatusMutation = useMutation({
  mutationFn: updateMultipleProductStatusChange,
  onSuccess: (response) => {
    if (response?.status === 200) {
      queryClient.invalidateQueries({ queryKey: ["getProducts"] });
      toast.success(response?.data?.detail);
    }
  },
  onError: (error: AxiosError) => {
    getFallback({ error });
  },
});
```

---

## API Layer

### Axios instance (`src/apiIntelesence.ts`)

Single shared axios instance. Auth token is injected via request interceptor by reading Zustand store state directly (not from React context). 401 responses trigger automatic logout.

```ts
import axios from "axios";
import { useAuth } from "@/store/auth.store.ts";

export const instance = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

instance.interceptors.request.use((config) => {
  const token = useAuth?.getState()?.token;
  if (token && config.headers) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      getFallback({ error });
      useAuth.getState()?.logOut();
    }
    return Promise.reject(error);
  },
);
```

### API function pattern (`src/api/[feature].api.ts`)

Each endpoint is a **named export function** that takes a typed object parameter. No error handling inside API functions — that's handled by mutation `onError`.

```ts
// src/api/product.api.ts
import { instance } from "@/apiIntelesence";
import type { CREATE_PRODUCT } from "@/types";

export const getProducts = () => instance.get(`products/detail`);

export const productsDropdown = ({
  seller_public_id,
  page,
  search,
}: {
  seller_public_id?: string;
  page?: number;
  search?: string;
} = {}) =>
  instance.get(`products/dropdown`, {
    params: {
      sellers: seller_public_id,
      size: 10,
      page: page ?? "",
      search: search ?? "",
    },
  });

export const viewProduct = ({
  product_public_id,
}: {
  product_public_id: string;
}) => instance.get(`/products/${product_public_id}`);

export const editProduct = ({
  product_public_id,
  data,
}: {
  product_public_id: string;
  data: CREATE_PRODUCT;
}) => instance.put(`products/${product_public_id}`, data);

export const deleteProduct = ({
  product_public_id,
}: {
  product_public_id: string;
}) => instance.delete(`products/${product_public_id}`);
```

---

## Routing & Navigation

### Router setup (`src/routes/router.tsx`)

Routes are **generated dynamically** from the sidebar config, not written manually.

```tsx
import { createBrowserRouter } from "react-router-dom";
import { items } from "@/constants/sidebar-items.constants";
import { generateRoutesFromSidebar } from "@/lib/utils/generateRoutes";

export const router = createBrowserRouter(generateRoutesFromSidebar(items));
```

### Route generation (`src/lib/utils/generateRoutes.tsx`)

`routeComponentMap` maps URL strings to JSX elements. New routes require adding an entry to both the sidebar config and this map.

```tsx
export function generateRoutesFromSidebar(items: SidebarItem[]) {
  const children = items.flatMap((item) => {
    if (item.subItem) {
      return item.subItem
        .filter((sub) => routeComponentMap[sub.url])
        .map((sub) => ({ path: sub.url, element: routeComponentMap[sub.url] }));
    }
    return routeComponentMap[item.url as string]
      ? [{ path: item.url, element: routeComponentMap[item.url as string] }]
      : [];
  });

  return [
    {
      path: "/",
      element: (
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      ),
      children,
    },
    {
      path: "/auth",
      element: <AuthLayout />,
      children: [
        /* auth routes */
      ],
    },
  ];
}
```

### Sidebar config (`src/constants/sidebar-items.constants.ts`)

The sidebar config is the **source of truth** for both the sidebar UI and the route tree.

```ts
export const items: SidebarItem[] = [
  { module: "DASHBOARD", title: "Dashboard", url: "/", icon: Home },
  { module: "MEDIA", title: "Media", url: "/media", icon: Image },
  {
    module: "PRODUCT",
    title: "Product",
    icon: Package,
    subItem: [
      { resource: "PRODUCT", title: "Products", url: "/product/products" },
      {
        title: "Add Product",
        url: "/product/add-product",
        is_action: true,
        resource: "PRODUCT",
        action: "CREATE",
      },
      { resource: "CATEGORY", title: "Category", url: "/product/category" },
    ],
  },
];
```

---

## State Management

### Zustand stores (`src/store/[feature].store.ts`)

All global client state lives in Zustand stores. The auth store uses `persist` middleware (localStorage). All stores use `devtools`.

```ts
// src/store/auth.store.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface STORE_TYPE {
  token?: string;
  setToken: (token?: string) => void;
  profile?: PROFILE;
  setProfile: (profile: PROFILE) => void;
  logOut: () => void;
}

export const useAuth = create<STORE_TYPE>()(
  devtools(
    persist(
      (set) => ({
        token: undefined,
        setToken: (token) => set({ token }),
        profile: undefined,
        setProfile: (profile) => set({ profile }),
        logOut: () => set({ profile: undefined, token: undefined }),
      }),
      { name: "govaly-admin-auth-token" },
    ),
  ),
);
```

### Store usage in components

State is accessed via selector functions. Optional chaining (`?.`) is used throughout.

```tsx
const token = useAuth((state) => state?.token);
const setToken = useAuth((state) => state?.setToken);
```

### Stores present

| File                   | Purpose                           |
| ---------------------- | --------------------------------- |
| `auth.store.ts`        | Auth token, user profile, logout  |
| `addproduct.store.ts`  | Multi-step product creation state |
| `addSeller.store.ts`   | Multi-step seller creation state  |
| `chat.store.ts`        | Chat/messaging state              |
| `media.store.ts`       | Media manager state               |
| `ui.store.ts`          | Global UI state                   |
| `tableheader.store.ts` | Table column visibility state     |
| `pagename.store.ts`    | Active page name for header       |

---

## Styling

### Tailwind CSS v4

Tailwind utility classes are used directly on JSX elements. No CSS modules or styled-components.

### `cn()` utility (`src/lib/utils.ts`)

All conditional or merged class names use `cn()` (combination of `clsx` + `tailwind-merge`).

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Class composition patterns

- Simple conditional: `clsx(base, isActive && "bg-blue-500")`
- Variant maps: `clsx(base, variantClasses[variant], className)` — user-passed `className` always comes last to allow overrides.
- shadcn components accept `className` and override via `cn()` internally.

```tsx
// Custom components use clsx directly
<button className={clsx(base, sizeClasses[size], variantClasses[variant], className)} />

// shadcn primitives use cn()
<div className={cn("flex flex-col gap-2", className)} />
```

### shadcn components

Located in `src/components/ui/`. These files should not be manually edited (they're generated). Wrap them in `src/components/custom-ui/` to add behavior.

---

## TypeScript

### Type file location (`src/types/[feature].types.ts`)

All types and interfaces are **global** (not co-located with features). Each feature has its own `*.types.ts` file, all re-exported from `src/types/index.ts`.

```ts
// src/types/index.ts
export * from "./product.types";
export * from "./seller.types";
export * from "./auth.types";
// ...
```

### Type naming convention

| What                      | Convention                              | Examples                               |
| ------------------------- | --------------------------------------- | -------------------------------------- |
| Data model interfaces     | `SCREAMING_SNAKE_CASE`                  | `PRODUCT`, `SELLER`, `PROFILE`         |
| Form/mutation input types | `SCREAMING_SNAKE_CASE` with verb prefix | `CREATE_PRODUCT`, `UPDATE_PRODUCT`     |
| Return/response types     | `SCREAMING_SNAKE_CASE`                  | `IMG_RETURN_TYPE`, `ERROR_422`         |
| Props interfaces          | `PascalCase` + `Props` suffix           | `ButtonProps`, `FormFieldContextValue` |
| Store state interfaces    | `SCREAMING_SNAKE_CASE`                  | `STORE_TYPE`                           |

### Types inferred from Zod schemas

Form input types are **always** inferred from their Zod schemas, never written manually:

```ts
// src/types/product.types.ts
import { z } from "zod";
import type { createProductSchema, productStatusEnum } from "@/schema";

export type CREATE_PRODUCT = z.infer<typeof createProductSchema>;

// API response interfaces are hand-written
export interface PRODUCT {
  id?: number;
  public_id: string;
  name: string;
  status: z.infer<typeof productStatusEnum>; // enum types still use z.infer
  images: IMG_RETURN_TYPE[];
}
```

---

## Error Handling

### `getFallback` (`src/lib/FallbackFunctions.ts`)

All mutation `onError` handlers call `getFallback({ error })`. It branches by HTTP status and shows `sonner` toasts.

```ts
import type { AxiosError } from "axios";
import { toast } from "sonner";

export const getFallback = ({ error }: { error: AxiosError<ANY> }) => {
  const status = error?.response?.status;
  switch (status) {
    case 422:
      return get422Fallback({ detail: error?.response?.data?.detail });
    case 409:
      return get409FallBack({ detail: error?.response?.data?.detail });
    case 400:
      return get400FallBack({ detail: error?.response?.data?.detail });
    case 401:
      return get401Fallback({ detail: error?.response?.data?.detail });
    case 403:
      return get403FallBack({ detail: error?.response?.data?.detail });
    default:
      toast.error("An unexpected error occurred");
  }
};

export const get422Fallback = ({ detail }: { detail: ERROR_422[] }) => {
  detail?.forEach((err) => {
    const field = err?.loc?.[1] || "Unknown field";
    toast.error(`${field}: ${err?.msg || "Validation error"}`);
  });
};
```

### Toast notifications

Library: `sonner`. Used as `toast.success(...)` and `toast.error(...)` throughout mutations.

### Permission checks

```tsx
const { requirePermission } = usePermission();
const canRead = requirePermission("PRODUCT", "READ");
const canCreate = requirePermission("PRODUCT", "CREATE");
const canUpdate = requirePermission("PRODUCT", "UPDATE");
const canDelete = requirePermission("PRODUCT", "DELETE");

// Used as both a boolean and as a query enabler
useIndex({ options: { enabled: canRead } });
{
  canCreate && <CreateButton />;
}
```

---

## Naming Conventions Summary

| Entity             | Convention                    | Example                                            |
| ------------------ | ----------------------------- | -------------------------------------------------- |
| React components   | `PascalCase`                  | `ProductsPage`, `CustomButton`                     |
| Page components    | `[Feature]Page` suffix        | `ProductsPage`, `SigninPage`                       |
| Custom hooks       | `use` prefix, `camelCase`     | `useFetchData`, `usePermission`                    |
| API functions      | `camelCase` verb+noun         | `getProducts`, `deleteProduct`, `editProduct`      |
| Zustand stores     | `use` prefix, named export    | `useAuth`, `useAddProduct`                         |
| Data model types   | `SCREAMING_SNAKE_CASE`        | `PRODUCT`, `CREATE_PRODUCT`                        |
| Props interfaces   | `PascalCase` + `Props`        | `ButtonProps`                                      |
| Zod enums          | `camelCase` + `Enum` suffix   | `productTypeEnum`, `productStatusEnum`             |
| Zod schemas        | `camelCase` + `Schema` suffix | `createProductSchema`                              |
| Constants (values) | `camelCase`                   | `createProductDefaultValues`, `productStatusBadge` |
| Constants (files)  | `kebab-case.constants.ts`     | `sidebar-items.constants.ts`                       |
| Variables          | `camelCase`                   | `productFilters`, `selectedProducts`               |
| Environment vars   | `VITE_APP_[NAME]`             | `VITE_APP_BASE_URL`                                |

---

## Key Dependencies

```json
{
  "react": "18.3.1",
  "react-router-dom": "7.6.1",
  "typescript": "~5.8.3",
  "vite": "6.3.5",

  "react-hook-form": "7.56.4",
  "@hookform/resolvers": "5.0.1",
  "zod": "3.25.32",

  "zustand": "5.0.5",
  "@tanstack/react-query": "5.77.2",
  "axios": "1.9.0",

  "tailwindcss": "4.1.7",
  "@tailwindcss/vite": "4.1.7",
  "clsx": "2.1.1",
  "tailwind-merge": "3.3.0",
  "class-variance-authority": "0.7.1",

  "lucide-react": "0.511.0",
  "@tabler/icons-react": "3.34.1",
  "sonner": "2.0.7",
  "date-fns": "3.6.0",
  "react-dropzone": "14.3.8",
  "react-dnd": "16.0.1",
  "firebase": "12.7.0",
  "react-helmet-async": "2.0.5"
}
```
