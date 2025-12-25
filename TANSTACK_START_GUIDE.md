# TanStack Start Full-Stack Development Guide

A comprehensive, beginner-friendly guide to setting up a full-stack application with **TanStack Start**, **TanStack Query**, **TanStack Form**, **Drizzle ORM**, and **Supabase**.

---

## Table of Contents

1.  [Project Initialization](#1-project-initialization)
2.  [Install Dependencies](#2-install-dependencies)
3.  [Configure Vite](#3-configure-vite)
4.  [Supabase Database Setup](#4-supabase-database-setup)
5.  [Drizzle ORM Configuration](#5-drizzle-orm-configuration)
6.  [Database Schema Definition](#6-database-schema-definition)
7.  [Database Migrations](#7-database-migrations)
8.  [TanStack Router Setup](#8-tanstack-router-setup)
9.  [Server Functions](#9-server-functions)
10. [Route Loaders and TanStack Query](#10-route-loaders-and-tanstack-query)
11. [TanStack Form Integration](#11-tanstack-form-integration)
12. [Cache Invalidation After Mutations](#12-cache-invalidation-after-mutations)
13. [Architectural Rules (The Golden Pattern)](#13-architectural-rules-the-golden-pattern)
14. [Authentication Middleware](#14-authentication-middleware)

---

## 1. Project Initialization

The easiest way to start is with the official TanStack Start CLI.

```bash
npx create-tanstack-start@latest my-app
cd my-app
```

Choose your preferred options (TypeScript, ESLint, etc.). This gives you a working starter with file-based routing.

---

## 2. Install Dependencies

After initialization, install all required libraries.

### Core Dependencies

```bash
# TanStack Libraries
npm install @tanstack/react-query @tanstack/react-form

# Validation
npm install zod

# Drizzle ORM with Postgres
npm install drizzle-orm pg

# Styling (Optional but recommended)
npm install tailwindcss @tailwindcss/vite
```

### Dev Dependencies

```bash
npm install -D drizzle-kit @types/pg @types/node dotenv typescript
```

Your `package.json` dependencies should look similar to:

```json
{
  "dependencies": {
    "@tanstack/react-form": "^1.27.6",
    "@tanstack/react-query": "^5.90.12",
    "@tanstack/react-router": "^1.132.0",
    "@tanstack/react-start": "^1.132.0",
    "drizzle-orm": "^0.45.1",
    "pg": "^8.16.3",
    "zod": "^4.2.1"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.8",
    "@types/pg": "^8.16.0",
    "dotenv": "^17.2.3"
  }
}
```

---

## 3. Configure Vite

Update your `vite.config.ts` to include all the necessary plugins.

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    // Path aliases from tsconfig
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  // Required for node-postgres (pg) to work in SSR
  ssr: {
    noExternal: [],
    external: ['pg', 'pg-native'],
  },
  optimizeDeps: {
    exclude: ['pg', 'pg-native'],
  },
})
```

---

## 4. Supabase Database Setup

### Step 4.1: Create a Supabase Project

1.  Go to [supabase.com](https://supabase.com) and sign in.
2.  Click **"New Project"**.
3.  Choose your organization, give it a name, and set a strong database password.
4.  Select your region (pick one close to your users).
5.  Click **"Create new project"**.

### Step 4.2: Get Your Connection String

1.  In your Supabase dashboard, go to **Project Settings > Database**.
2.  Copy the **Connection String (URI)**. Instead of Direct Connection, select **Session pooler**. It looks like:
    ```
    postgresql://postgres:[YOUR-PASSWORD]@west-2.pooler.supabase.com:5432/postgres
    ```

### Step 4.3: Create `.env` File

Create a `.env` file in your project root:

```bash
# .env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@west-2.pooler.supabase.com:5432/postgres"
```

> ⚠️ **Important**: Add `.env` to your `.gitignore` file to keep your credentials secure.

---

## 5. Drizzle ORM Configuration

Create the Drizzle configuration file in your project root.

```typescript
// drizzle.config.ts
import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',          // Where migration files will be generated
  schema: './src/db/schema.ts', // Your schema file location
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

---

## 6. Database Schema Definition

Create your database schema with Drizzle types.

### Step 6.1: Create the Schema File

```typescript
// src/db/schema.ts
import {
  pgTable,
  varchar,
  numeric,
  integer,
  text,
  pgEnum,
  uuid,
  timestamp,
} from 'drizzle-orm/pg-core'

// Define enums
const badgeValues = ['New', 'Sale', 'Featured', 'Limited'] as const
const inventoryValues = ['in-stock', 'backorder', 'preorder'] as const

export const badgeEnum = pgEnum('badge', badgeValues)
export const inventoryEnum = pgEnum('inventory', inventoryValues)

// Define tables
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 256 }).notNull(),
  description: text('description').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  badge: badgeEnum('badge'),
  rating: numeric('rating', { precision: 3, scale: 2 }).notNull().default('0'),
  reviews: integer('reviews').notNull().default(0),
  image: varchar('image', { length: 512 }).notNull(),
  inventory: inventoryEnum('inventory').notNull().default('in-stock'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const cartItems = pgTable('cart_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Export inferred types for use in your app
export type ProductSelect = typeof products.$inferSelect
export type ProductInsert = typeof products.$inferInsert
export type CartItemSelect = typeof cartItems.$inferSelect
export type CartItemInsert = typeof cartItems.$inferInsert

// Export enum value types
export type BadgeValue = (typeof badgeValues)[number]
export type InventoryValue = (typeof inventoryValues)[number]
```

### Step 6.2: Create the Database Connection

```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Enable SSL for Supabase connections
  ssl: process.env.DATABASE_URL?.includes('supabase')
    ? { rejectUnauthorized: false }
    : false,
})

export const db = drizzle(pool, { schema })
```

---

## 7. Database Migrations

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

### Generate and Push Migrations

```bash
# Generate migration files from your schema
npm run db:generate

# Push changes directly to the database (development)
npm run db:push

# (Optional) Open Drizzle Studio to view your data
npm run db:studio
```

---

## 8. TanStack Router Setup

### Step 8.1: Create the Router

```typescript
// src/router.tsx
import { createRouter, Link } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen' // Auto-generated
import { QueryClient } from '@tanstack/react-query'

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    context: {
      queryClient: new QueryClient(),
    },
    defaultPreloadStaleTime: 0,
    defaultPreload: 'intent', // Preload links on hover
    defaultNotFoundComponent: () => (
      <div>
        <p>Not found!</p>
        <Link to="/">Go home</Link>
      </div>
    ),
  })

  return router
}
```

### Step 8.2: Create the Root Route

```tsx
// src/routes/__root.tsx
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { type QueryClient, QueryClientProvider } from '@tanstack/react-query'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    shellComponent: RootDocument,
  },
)

function RootDocument({ children }: { children: React.ReactNode }) {
  const { queryClient } = Route.useRouteContext()

  return (
    <QueryClientProvider client={queryClient}>
      <html lang="en">
        <head>
          <HeadContent />
        </head>
        <body>
          <main>{children}</main>
          <Scripts />
        </body>
      </html>
    </QueryClientProvider>
  )
}
```

---

## 9. Data Layer and Server Functions

This project uses a **two-layer architecture** to separate concerns:

| Layer | Location | Purpose |
|-------|----------|---------|
| **Data Layer** | `src/data/*.ts` | Regular async functions using Drizzle ORM |
| **Server Functions** | Route files | TanStack's RPC bridge that calls the data layer |

### Layer 1: Data Layer Functions (Drizzle)

These are **regular async functions** that interact with the database using Drizzle ORM. They are **NOT** TanStack Server Functions.

```typescript
// src/data/products.ts
// These are regular async functions, NOT Server Functions!

import { db } from '@/db'
import { products } from '@/db/schema'
import type { ProductInsert, ProductSelect } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function getAllProducts() {
  try {
    const productsData = await db.select().from(products)
    return productsData
  } catch (error) {
    console.error('Error getting all products:', error)
    return []
  }
}

export async function getProductById(id: string) {
  try {
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1)
    return product?.[0] ?? null
  } catch (error) {
    console.error('Error getting product by id:', error)
    return null
  }
}

export async function createProduct(data: ProductInsert): Promise<ProductSelect> {
  const result = await db.insert(products).values(data).returning()
  return result[0]
}
```

### Layer 2: TanStack Server Functions (The Bridge)

Server Functions are created with `createServerFn()`. They act as an **RPC bridge** between the client and your data layer. They are defined in route files and **call** the data layer functions.

```typescript
// src/routes/products/index.tsx
import { createServerFn } from '@tanstack/react-start'

// This is a TanStack Server Function - it calls the data layer
const fetchProducts = createServerFn({ method: 'GET' }).handler(async () => {
  // Dynamic import ensures this only runs on the server
  const { getAllProducts } = await import('@/data/products')
  return getAllProducts()
})
```

### Server Function Syntax

#### GET Request (No Input)

```typescript
export const fetchProducts = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getAllProducts } = await import('@/data/products')
    return getAllProducts()
  },
)
```

#### POST Request (With Input Validation)

```typescript
export const fetchProductById = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { getProductById } = await import('@/data/products')
    return getProductById(data.id)
  })
```

#### Mutation Server Function

```typescript
import { createServerFn } from '@tanstack/react-start'
import type { ProductInsert } from '@/db/schema'

export const createProductFn = createServerFn({ method: 'POST' })
  .inputValidator((data: ProductInsert) => data)
  .handler(async ({ data }) => {
    const { createProduct } = await import('@/data/products')
    return createProduct(data)
  })
```

### Why Two Layers?

| Benefit | Explanation |
|---------|-------------|
| **Separation of Concerns** | Data logic is isolated from routing/RPC logic |
| **Testability** | Data functions can be unit tested without TanStack |
| **Reusability** | Same data function can be called by multiple Server Functions |
| **Server-Only Guarantee** | Dynamic imports ensure database code never reaches the client bundle |

---

## 10. Route Loaders and TanStack Query

### Using Loaders for Initial Data

Loaders run on the server during SSR and fetch data before the page renders.

```tsx
// src/routes/products/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

const fetchProducts = createServerFn({ method: 'GET' }).handler(async () => {
  const { getAllProducts } = await import('@/data/products')
  return getAllProducts()
})

export const Route = createFileRoute('/products/')(
  component: ProductsPage,
  loader: async () => {
    return await fetchProducts()
  },
})

function ProductsPage() {
  const products = Route.useLoaderData()
  return (
    <div>
      {products.map((p) => (
        <div key={p.id}>{p.name}</div>
      ))}
    </div>
  )
}
```

### Combining Loaders with TanStack Query

For data that needs client-side refetching:

```tsx
import { useQuery } from '@tanstack/react-query'

function ProductsPage() {
  const initialProducts = Route.useLoaderData()

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetchProducts(),
    initialData: initialProducts, // Use loader data as starting point
  })

  return <ProductList products={products} />
}
```

---

## 11. TanStack Form Integration

TanStack Form handles form state, validation, and submission.

### Complete Form Example

```tsx
// src/routes/products/create.tsx
import { useForm } from '@tanstack/react-form'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { z } from 'zod'

// Zod schema for validation
const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.string().refine((val) => !isNaN(Number(val)), 'Must be a number'),
})

export const Route = createFileRoute('/products/create')({
  component: CreateProductForm,
})

function CreateProductForm() {
  const navigate = useNavigate()
  const router = useRouter()

  const form = useForm({
    // Initial values
    defaultValues: {
      name: '',
      description: '',
      price: '',
    },

    // Validation on every change
    validators: {
      onChange: ({ value }) => {
        const result = productSchema.safeParse(value)
        if (!result.success) {
          return result.error.issues.map((i) => i.message).join(', ')
        }
        return undefined
      },
    },

    // Handle submission
    onSubmit: async ({ value }) => {
      try {
        await createProductFn({ data: value })
        await router.invalidate({ sync: true })
        navigate({ to: '/products' })
      } catch (error) {
        console.error('Failed to create product', error)
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      {/* Field: Name */}
      <form.Field name="name">
        {(field) => (
          <div>
            <label htmlFor={field.name}>Name</label>
            <input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors && <span>{field.state.meta.errors}</span>}
          </div>
        )}
      </form.Field>

      {/* Field: Description */}
      <form.Field name="description">
        {(field) => (
          <div>
            <label htmlFor={field.name}>Description</label>
            <textarea
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>

      {/* Field: Price */}
      <form.Field name="price">
        {(field) => (
          <div>
            <label htmlFor={field.name}>Price</label>
            <input
              type="number"
              step="0.01"
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>

      {/* Submit Button */}
      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <button type="submit" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Product'}
          </button>
        )}
      </form.Subscribe>
    </form>
  )
}
```

---

## 12. Cache Invalidation After Mutations

After any data mutation, you need to update the UI. This project uses **two types** of invalidation:

### Type 1: Router Invalidation

Updates data fetched via `Route.useLoaderData()`.

```typescript
const router = useRouter()
await router.invalidate({ sync: true })
```

### Type 2: Query Client Invalidation

Updates data fetched via `useQuery()` (e.g., global components like headers).

```typescript
const queryClient = useQueryClient()
await queryClient.invalidateQueries({ queryKey: ['cart-items-data'] })
```

### Combined Pattern

```typescript
const handleAddToCart = async (productId: string) => {
  // 1. Perform the mutation
  await mutateCartFn({ data: { action: 'add', productId, quantity: 1 } })

  // 2. Refresh page data (loaders)
  await router.invalidate({ sync: true })

  // 3. Refresh global components (React Query)
  await queryClient.invalidateQueries({ queryKey: ['cart-items-data'] })
}
```

---

## 13. Data Loading Patterns

This section covers two approaches to loading data. **Start with the Standard Pattern** — it's simpler and sufficient for most cases. Use the Advanced Pattern only when you have specific needs.

### Rule 1: Never Fetch Data Directly in Components

❌ **Wrong:**

```tsx
function MyComponent() {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch('/api/data').then((res) => setData(res.json()))
  }, [])
}
```

✅ **Correct:** Use Loaders + Server Functions (and optionally Query for refetching).

---

### Choosing Your Pattern

| Question | If YES → | If NO → |
|----------|----------|---------|
| Is the data specific to one route? | Standard Pattern | Consider Advanced |
| Do you want a simpler mental model? | Standard Pattern | — |
| Do multiple routes need the same data? | Advanced Pattern | Standard Pattern |
| Do you need automatic background refetching everywhere? | Advanced Pattern | Standard Pattern |
| Are you building a small-to-medium app? | Standard Pattern | — |

---

### Standard Pattern (Recommended for Most Cases) ✅

This is what **this project uses**. It's simpler and easier to understand.

#### How It Works

1. **Loader** fetches data via Server Function
2. **Component** uses `Route.useLoaderData()` for static display
3. **Optional:** Wrap with `useQuery` if you need client-side refetching

#### Complete Example

```tsx
// src/routes/products/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'

// Step 1: Define Server Function
const fetchProducts = createServerFn({ method: 'GET' }).handler(async () => {
  const { getAllProducts } = await import('@/data/products')
  return getAllProducts()
})

// Step 2: Create Route with Loader
export const Route = createFileRoute('/products/')({
  component: ProductsPage,
  loader: async () => {
    return await fetchProducts()
  },
})

// Step 3: Use Data in Component
function ProductsPage() {
  // Option A: Simple - just use loader data (no refetching)
  const products = Route.useLoaderData()

  // Option B: With refetching - wrap in useQuery
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetchProducts(),
    initialData: Route.useLoaderData(), // SSR data as starting point
  })

  return <ProductList products={products} />
}
```

#### When to Use This Pattern

- ✅ Route-specific data (product list, product details, cart)
- ✅ Data that doesn't need to be shared across unrelated routes
- ✅ You want simplicity and less boilerplate
- ✅ SSR is your primary concern, occasional client refetch is fine

---

### Advanced Pattern (For Larger Apps)

Use this when you need **shared query options** across multiple routes, or want **automatic cache deduplication**.

#### How It Works

1. **Query Options** defined in a shared file (`src/queries/*.ts`)
2. **Loader** uses `queryClient.ensureQueryData()` to warm the cache
3. **Component** uses `useSuspenseQuery()` — data is already cached

#### Complete Example

```typescript
// Step A: Define Query Options (shared)
// src/queries/products.ts
import { queryOptions } from '@tanstack/react-query'

const fetchProducts = createServerFn({ method: 'GET' }).handler(async () => {
  const { getAllProducts } = await import('@/data/products')
  return getAllProducts()
})

export const productsQueryOptions = queryOptions({
  queryKey: ['products'],
  queryFn: () => fetchProducts(),
})
```

```tsx
// Step B: Route with Cache Seeding
// src/routes/products/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { productsQueryOptions } from '@/queries/products'

export const Route = createFileRoute('/products/')({
  component: ProductsPage,
  loader: async ({ context: { queryClient } }) => {
    // "Warm" the cache for SSR
    await queryClient.ensureQueryData(productsQueryOptions)
  },
})
```

```tsx
// Step C: Component Consuming Cached Data
import { useSuspenseQuery } from '@tanstack/react-query'
import { productsQueryOptions } from '@/queries/products'

function ProductsPage() {
  // Data is already in cache — no loading state needed!
  const { data: products } = useSuspenseQuery(productsQueryOptions)

  return <ProductList products={products} />
}
```

#### When to Use This Pattern

- ✅ Same data needed on multiple routes (e.g., user profile in header AND settings page)
- ✅ You want automatic cache deduplication
- ✅ Building a larger app with complex data dependencies
- ✅ You're already comfortable with TanStack Query

---

### Summary: Which Pattern to Use?

| App Size | Data Sharing | Recommended Pattern |
|----------|-------------|---------------------|
| Small-Medium | Route-specific | **Standard Pattern** |
| Medium-Large | Shared across routes | **Advanced Pattern** |
| Any size | Learning TanStack | **Standard Pattern first** |

> 💡 **Tip:** Start with the Standard Pattern. Refactor to the Advanced Pattern only when you find yourself duplicating query logic across multiple routes.

---

## 14. Authentication Middleware

Protect your Server Functions with middleware.

### Step A: Define the Middleware

```typescript
// src/middleware/auth.ts
import { createMiddleware } from '@tanstack/react-start'

export const authMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    // Example: Check for a session cookie or auth header
    const session = await getSession(request) // Your auth logic

    if (!session) {
      throw new Error('Unauthorized')
    }

    // Pass the user to the handler
    return next({ context: { user: session.user } })
  },
)
```

### Step B: Apply to Server Functions

```typescript
import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '@/middleware/auth'

export const createProductFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware]) // Apply here
  .inputValidator((data: ProductInsert) => data)
  .handler(async ({ data, context }) => {
    // `context.user` is now available from the middleware
    console.log('Created by:', context.user.email)
    return db.insert(products).values(data).returning()
  })
```

### Step C: Route-Level Protection (Optional)

For page-level redirects, use `beforeLoad`:

```typescript
export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ context }) => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }
  },
  component: AdminPage,
})
```

> ⚠️ **Important**: Always enforce authentication at the **Server Function level**. Route-level protection is for UX only; it can be bypassed. Server Functions are the final line of defense.

---

## Quick Reference Cheat Sheet

| Task                          | Tool/Method                          |
| ----------------------------- | ------------------------------------ |
| Define schema                 | `src/db/schema.ts`                   |
| Connect to DB                 | `src/db/index.ts`                    |
| Run migrations                | `npm run db:push`                    |
| Fetch data (server)           | `createServerFn()`                   |
| Load data for a page          | `loader` in route definition         |
| Use data in component         | `Route.useLoaderData()`              |
| Refetch data on client        | `useQuery()` / `useSuspenseQuery()`  |
| Handle form state             | `useForm()` from `@tanstack/react-form` |
| Validate form data            | `zod` schema in `validators.onChange`|
| Invalidate loader data        | `router.invalidate()`                |
| Invalidate query data         | `queryClient.invalidateQueries()`    |
| Protect server functions      | `.middleware([authMiddleware])`      |

---

## Running the Application

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

Happy building! 🚀
