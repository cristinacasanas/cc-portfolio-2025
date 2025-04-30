import { createFileRoute } from '@tanstack/react-router'
import CollectionView from '@/views/collection.view'
export const Route = createFileRoute('/collection')({
  component: RouteComponent,
})

function RouteComponent() {
  return <CollectionView />
}
