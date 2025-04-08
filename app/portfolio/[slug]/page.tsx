import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { ImageGallery } from "@/components/image-gallery"
import { RelatedModels } from "@/components/related-models"
import { MultilingualText } from "@/components/multilingual-text"
import { FadeInSection } from "@/components/fade-in-section"
import { client, urlFor, queries } from "@/lib/sanity"

interface CampaignPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: CampaignPageProps): Promise<Metadata> {
  try {
    const campaign = await client.fetch(queries.getCampaignBySlug, { slug: params.slug })

    if (!campaign) {
      return {
        title: "Campaign Not Found | TC Management",
      }
    }

    return {
      title: `${campaign.title} | TC Management`,
      description: campaign.descriptionEN,
      openGraph: {
        title: `${campaign.title} | TC Management`,
        description: campaign.descriptionEN,
        images: campaign.coverImage ? [{ url: urlFor(campaign.coverImage).url() }] : [],
      },
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
    return {
      title: "Campaign | TC Management",
    }
  }
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  try {
    // Debug log to check the slug being received
    console.log("Campaign slug:", params.slug)

    // Fetch campaign data with the slug
    const campaign = await client.fetch(queries.getCampaignBySlug, { slug: params.slug })
    console.log("Campaign data:", campaign)

    if (!campaign) {
      console.error("Campaign not found for slug:", params.slug)
      notFound()
    }

    // Format images for the gallery
    const galleryImages =
      campaign.gallery?.map((image, index) => ({
        id: `gallery-${index}`,
        url: urlFor(image).url(),
        alt: image.alt || `Campaign image ${index + 1}`,
        isCover: index === 0,
      })) || []

    // If no gallery images but we have a cover image, use that
    if (galleryImages.length === 0 && campaign.coverImage) {
      galleryImages.push({
        id: "cover",
        url: urlFor(campaign.coverImage).url(),
        alt: `${campaign.title} cover image`,
        isCover: true,
      })
    }

    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
            <Link href="/portfolio" className="inline-flex items-center text-sm mb-8 hover:underline uppercase">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Portfolio
            </Link>

            <FadeInSection>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  {galleryImages.length > 0 ? (
                    <ImageGallery images={galleryImages} />
                  ) : (
                    <div className="aspect-[3/4] bg-gray-200 flex items-center justify-center">
                      <p>No images available</p>
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold uppercase">{campaign.title}</h1>
                  <p className="text-lg text-muted-foreground mt-2 uppercase">Client: {campaign.client}</p>

                  {campaign.season && campaign.year && (
                    <p className="text-muted-foreground mt-2 uppercase">
                      {campaign.season} {campaign.year}
                    </p>
                  )}

                  <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-3 uppercase">About the Campaign</h2>
                    <MultilingualText primary={campaign.descriptionES} secondary={campaign.descriptionEN} />
                  </div>

                  {campaign.models && campaign.models.length > 0 && (
                    <div className="mt-8">
                      <h2 className="text-xl font-semibold mb-3 uppercase">Featured Models</h2>
                      <ul className="list-disc pl-5 text-muted-foreground">
                        {campaign.models.map((model) => (
                          <li key={model._id}>
                            <Link
                              href={`/${model.gender.toLowerCase()}/${model.slug.current}`}
                              className="hover:underline uppercase"
                            >
                              {model.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-8">{/* Contact About This Campaign button removed */}</div>
                </div>
              </div>
            </FadeInSection>

            {campaign.models && campaign.models.length > 0 && (
              <FadeInSection>
                <RelatedModels models={campaign.models} />
              </FadeInSection>
            )}
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  } catch (error) {
    console.error("Error loading campaign:", error)
    notFound()
  }
}
