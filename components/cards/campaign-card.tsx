import Link from "next/link"
import Image from "next/image"

interface CampaignCardProps {
  id: number
  title: string
  client: string
  imageSrc: string
  slug?: string
  priority?: boolean
}

export function CampaignCard({ title, client, imageSrc, slug, priority = false }: CampaignCardProps) {
  if (!slug) {
    console.warn("🛑 Campaña sin slug. Skipping render:", title)
    return null
  }

  return (
    <Link href={`/portfolio/${slug}`} className="block group">
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={imageSrc}
          alt={title}
          fill
          priority={priority}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="mt-3 px-1">
        <h3 className="text-base font-semibold uppercase">{title}</h3>
        <p className="text-sm font-bold uppercase text-neutral-700 dark:text-neutral-300">{client}</p>
      </div>
    </Link>
  )
}
