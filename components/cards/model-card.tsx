import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"

interface ModelCardProps {
  id: string | number
  name: string
  division: string
  imageSrc: string
  slug: string
}

export function ModelCard({ id, name, division, imageSrc, slug }: ModelCardProps) {
  return (
    <Link href={`/${division.toLowerCase()}/${slug}`} className="block group">
      <Card className="overflow-hidden border-0 rounded-none">
        <div className="relative aspect-[3/4] h-full min-h-[400px]">
          <Image
            src={imageSrc || `/placeholder.svg?height=600&width=450&text=Model+${id}`}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={typeof id === "number" && id <= 4}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <div className="text-white">
              <h3 className="font-bold uppercase">{name}</h3>
              <p className="text-sm text-white/80 uppercase">{division}</p>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
