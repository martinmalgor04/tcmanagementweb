import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import { getImageUrl } from '@/lib/api'

interface ImageLoaderProps {
  image: any
  alt: string
  priority?: boolean
  sizes?: string
  className?: string
  fill?: boolean
  width?: number
  height?: number
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
}

export function ImageLoader({
  image,
  alt,
  priority = false,
  sizes = '(max-width: 768px) 100vw, 50vw',
  className = '',
  fill = true,
  width,
  height,
  objectFit = 'cover'
}: ImageLoaderProps) {
  const imageUrl = getImageUrl(image)
  
  if (fill) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={imageUrl}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={`object-${objectFit}`}
        />
      </div>
    )
  }
  
  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={width || 800}
      height={height || 800}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  )
} 