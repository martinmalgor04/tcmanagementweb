import Link from "next/link"
import Image from "next/image"

interface PortfolioCardProps {
  title: string
  client: string
  imageSrc: string
  href: string
}

export function PortfolioCard({ title, client, imageSrc, href }: PortfolioCardProps) {
  return (
    <Link href={href} className="block text-black">
      <div className="relative aspect-[3/4]">
        <Image src={imageSrc || "/placeholder.svg"} alt={title} fill className="object-cover" />
      </div>
      <div className="mt-3 px-1">
        <h3 className="text-sm font-normal uppercase tracking-tight">{title}</h3>
        <p className="text-sm font-bold uppercase tracking-tight">{client}</p>
      </div>
    </Link>
  )
}
