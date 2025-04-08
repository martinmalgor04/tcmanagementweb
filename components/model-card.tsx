import Image from "next/image"
import Link from "next/link"

interface ModelCardProps {
  id: number
  name: string
  division: string
  coverImage: string
  slug: string
}

export function ModelCard({ id, name, division, coverImage, slug }: ModelCardProps) {
  return (
    <Link
      href={`/${division.toLowerCase()}/${slug}`}
      className="group relative aspect-[3/4] overflow-hidden cursor-pointer block"
    >
      <Image
        src={coverImage || `/placeholder.svg?height=600&width=450&text=Model+${id}`}
        alt={name}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
        <div className="text-white">
          <h3 className="font-bold uppercase">{name}</h3>
          <p className="text-sm text-white/80 uppercase">{division}</p>
        </div>
      </div>
    </Link>
  )
}
