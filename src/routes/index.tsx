import { ProductCard } from '@/components/ProductCard'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { ArrowRightIcon } from 'lucide-react'


const fetchProductsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { getRecommendedProducts } = await import('@/data/products')
  const products = getRecommendedProducts()
  return products
})


export const Route = createFileRoute('/')({
  component: App,
  loader: async () => {
    // This runs on server during SSR AND on client during navigation
    return fetchProductsFn()
  },
})

async function App() {
  const products = Route.useLoaderData()

  console.log(products)
  return (
    <div className="space-y-12 bg-linear-to-b from-slate-50 via-white to-slate-50 p-6">
      <section>
        <Card className="p-8 shadow-md bg-white/80">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Your favourite e-commerce store
          </p>
          <CardTitle className="text-4xl font-bold leading-tight text-slate-900 dark:text-white max-w-2xl">
            <h1>StartShop - Your one-stop shop for all your needs</h1>
          </CardTitle>
          <CardDescription>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Browse products
              <ArrowRightIcon size={16} />
            </Link>
          </CardDescription>
        </Card>
      </section>
      <section className="space-y-4 max-w-6xl mx-auto">
        <Card className="p-8 shadow-md bg-white/80">
          <div className="flex items-center justify-between">
            <div>
              <CardHeader className="px-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Recommended
                </p>
              </CardHeader>
              <CardTitle className="text-2xl font-semibold text-slate-900">
                Starter picks from the catalogue
              </CardTitle>
              <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                Curated items to try the cart and detail page quickly
              </CardDescription>
            </div>
            <div>
              <Link
                to="/products"
                className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                View All <ArrowRightIcon size={14} />
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            {products.map((product, index) => (
              <ProductCard product={product} key={`product-${index}`} />
            ))}
          </div>
        </Card>
      </section>
    </div>
  )
}
