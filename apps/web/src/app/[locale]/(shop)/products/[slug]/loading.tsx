import { Skeleton } from '@/components/Skeleton';

export default function Loading() {
  return (
    <div className="container-page">
      <Skeleton className="mb-6 h-4 w-64" />
      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr]">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-5"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-4/5" /><Skeleton className="h-8 w-40" /><Skeleton className="h-10 w-full" /><Skeleton className="h-28 w-full" /><Skeleton className="h-12 w-full" /></div>
      </div>
    </div>
  );
}
