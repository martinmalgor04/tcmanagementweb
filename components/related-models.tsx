import Link from "next/link"
import Image from "next/image"
import { urlFor } from "@/lib/sanity"

interface Model {
  _id: string
  name: string
  gender: string
  slug: { current: string }
  profileImage: any
}

interface RelatedModelsProps {
  models: Model[]
  currentModelId?: string
}

export function RelatedModels({ models, currentModelId }: RelatedModelsProps) {
  // Filter out current model and limit to 4 models
  const filteredModels = models.filter((model) => model._id !== currentModelId).slice(0, 4)

  if (!filteredModels.length) return null

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold mb-6 uppercase">Related Models</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {filteredModels.map((model) => (
          <Link key={model._id} href={`/${model.gender.toLowerCase()}/${model.slug.current}`} className="block">
            <div className="relative aspect-[3/4] overflow-hidden">
              <Image
                src={model.profileImage ? urlFor(model.profileImage).url() : "/placeholder.svg"}
                alt={model.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-300 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <div className="text-white">
                  <h3 className="font-bold uppercase">{model.name}</h3>
                  <p className="text-sm text-white/80 uppercase">{model.gender}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
