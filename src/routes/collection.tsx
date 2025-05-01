import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

// Use lazy loading for the component
const CollectionView = lazy(() => import('@/views/collection.view'))

export const Route = createFileRoute('/collection')({
  component: RouteComponent,
  validateSearch: (search) => {
    return {
      view: search.view === 'grid' ? 'grid' : 'canvas',
    }
  },
})

function RouteComponent() {
  const { view } = Route.useSearch()
  return (
    <Suspense fallback={<div className="p-4">Loading collection view...</div>}>
      <CollectionView initialView={view} />
    </Suspense>
  )
}
