import Image from 'next/image';

/** next/image wrapper (responsive sizes, lazy loading, AVIF/WebP). Set NEXT_PUBLIC_UNOPTIMIZED_IMAGES=true to bypass the optimizer. */
export default function Img({ src, alt, sizes, priority, className }: { src: string; alt: string; sizes: string; priority?: boolean; className?: string }) {
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} unoptimized={process.env.NEXT_PUBLIC_UNOPTIMIZED_IMAGES === 'true'} />;
}
