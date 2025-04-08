import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { ImageGallery } from "@/components/image-gallery"
import { MultilingualText } from "@/components/multilingual-text"
import { FadeInSection } from "@/components/fade-in-section"
import { client, urlFor, queries } from "@/lib/sanity"

interface ModelPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: ModelPageProps): Promise<Metadata> {
  try {
    const model = await client.fetch(queries.getModelBySlug, { slug: params.slug })

    if (!model) {
      return {
        title: "Model Not Found | TC Management",
      }
    }

    return {
      title: `${model.name} | TC Management Women`,
      description: model.mainDescriptionEN,
      openGraph: {
        title: `${model.name} | TC Management Women`,
        description: model.mainDescriptionEN,
        images: model.profileImage ? [{ url: urlFor(model.profileImage).url() }] : [],
      },
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
    return {
      title: "Model | TC Management",
    }
  }
}

export default async function ModelPage({ params }: ModelPageProps) {
  try {
    const model = await client.fetch(queries.getModelBySlug, { slug: params.slug })

    if (!model || model.gender !== "Women") {
      notFound()
    }

    // Format images for the gallery
    const modelImages = [
      {
        id: "profile",
        url: model.profileImage ? urlFor(model.profileImage).url() : "/placeholder.svg",
        alt: `${model.name} Profile`,
        isCover: true,
      },
      ...(model.additionalImages || []).map((image, index) => ({
        id: `additional-${index}`,
        url: urlFor(image).url(),
        alt: image.alt || `${model.name} Image ${index + 1}`,
      })),
    ]

    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1 py-12">
          <div className="container px-6 md:px-8">
            <Link href="/women" className="inline-flex items-center text-sm mb-8 hover:underline uppercase">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Women
            </Link>

            <FadeInSection>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <ImageGallery images={modelImages} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold uppercase">{model.name}</h1>
                  <p className="text-lg text-muted-foreground mt-2 uppercase">{model.gender}</p>

                  <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-3 uppercase">Measurements</h2>
                    <div className="grid grid-cols-2 gap-4">
                      {model.height && (
                        <div>
                          <p className="text-sm font-medium uppercase">Height</p>
                          <p className="text-muted-foreground">{model.height}</p>
                        </div>
                      )}
                      {model.measurements?.bust && (
                        <div>
                          <p className="text-sm font-medium uppercase">Bust</p>
                          <p className="text-muted-foreground">{model.measurements.bust}</p>
                        </div>
                      )}
                      {model.measurements?.waist && (
                        <div>
                          <p className="text-sm font-medium uppercase">Waist</p>
                          <p className="text-muted-foreground">{model.measurements.waist}</p>
                        </div>
                      )}
                      {model.measurements?.hips && (
                        <div>
                          <p className="text-sm font-medium uppercase">Hips</p>
                          <p className="text-muted-foreground">{model.measurements.hips}</p>
                        </div>
                      )}
                      {model.measurements?.shoes && (
                        <div>
                          <p className="text-sm font-medium uppercase">Shoes</p>
                          <p className="text-muted-foreground">{model.measurements.shoes}</p>
                        </div>
                      )}
                      {model.measurements?.hair && (
                        <div>
                          <p className="text-sm font-medium uppercase">Hair</p>
                          <p className="text-muted-foreground">{model.measurements.hair}</p>
                        </div>
                      )}
                      {model.measurements?.eyes && (
                        <div>
                          <p className="text-sm font-medium uppercase">Eyes</p>
                          <p className="text-muted-foreground">{model.measurements.eyes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-3 uppercase">About</h2>
                    <MultilingualText primary={model.mainDescriptionES} secondary={model.mainDescriptionEN} />
                  </div>

                  {model.campaigns && model.campaigns.length > 0 && (
                    <div className="mt-8">
                      <h2 className="text-xl font-semibold mb-3 uppercase">Featured In</h2>
                      <ul className="list-disc pl-5 text-muted-foreground">
                        {model.campaigns.map((campaign) => (
                          <li key={campaign._id}>
                            <Link href={`/portfolio/${campaign.slug}`} className="hover:underline">
                              {campaign.title} for {campaign.client}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-8">{/* Book This Model button removed */}</div>
                </div>
              </div>
            </FadeInSection>

            {model.campaigns && model.campaigns.length > 0 && (
              <FadeInSection>
                <div className="mt-16">
                  <h2 className="text-2xl font-bold mb-6 uppercase">Related Work</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {model.campaigns.slice(0, 4).map((campaign) => (
                      <Link key={campaign._id} href={`/portfolio/${campaign.slug}`} className="block">
                        <div className="relative aspect-[3/4]">
                          <div className="w-full h-full bg-gray-200 relative overflow-hidden">
                            {campaign.coverImage && (
                              <img
                                src={urlFor(campaign.coverImage).url() || "/placeholder.svg"}
                                alt={campaign.title}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        </div>
                        <div className="mt-3 px-1">
                          <h3 className="text-sm font-normal uppercase tracking-tight">{campaign.title}</h3>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </FadeInSection>
            )}
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  } catch (error) {
    console.error("Error loading model:", error)
    notFound()
  }
}
