import { ProductGridSkeleton, Skeleton } from '@/components/Skeleton';

export default function Loading() {
  return (
    <div className="container-page">
      <Skeleton className="mb-6 h-4 w-40" /><Skeleton className="mb-10 h-12 w-72" />
      <div className="grid gap-10 md:grid-cols-[250px_1fr]">
        <div className="hidden space-y-4 md:block">{Array.from({ length: 5 }, (_, i) => (<Skeleton key={i} className="h-24 w-full" />))}</div>
        <ProductGridSkeleton count={9} />
      </div>
    </div>
  );
}
