import { Suspense } from "react"
import Image from "next/image"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { FadeInSection } from "@/components/fade-in-section"
import { CampaignCard } from "@/components/cards/campaign-card"
import { ContactForm } from "@/components/ContactForm"
import { ImageSlider } from "@/components/image-slider"
import { Skeleton } from "@/components/ui/skeleton"
import { PortableText } from "@/components/portable-text"
import { USSection } from "@/components/USSection"
import { getCampaigns, getAboutContent, getUSContent, getImageUrl } from "@/lib/api"

export const revalidate = 3600 // revalidate cada 1 hora

// Interfaces para los tipos de datos
interface Campaign {
  _id: string
  title: string
  client?: string
  coverImage?: any
  slug: string
}

export default async function Home() {
  // Fetch all data in parallel
  const [campaignsData, aboutData, usData] = await Promise.all([
    getCampaigns(),
    getAboutContent(),
    getUSContent()
  ])

  // Use only the first 4 campaigns for the featured section
  const featuredCampaigns = (campaignsData as Campaign[] || []).slice(0, 4)
  
  // Get about content
  const aboutContent = aboutData || null
  const aboutImages = aboutData?.aboutImages || []
  
  // Get US content
  const usContent = usData || null

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 mt-8">
        {/* Featured Campaigns - No title as requested */}
        <FadeInSection>
          <section className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl mb-20">
            {featuredCampaigns.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {featuredCampaigns.map((campaign: Campaign, index: number) => (
                  <CampaignCard
                    key={campaign._id}
                    id={index + 1}
                    title={campaign.title}
                    client={campaign.client || "Client"}
                    imageSrc={getImageUrl(campaign.coverImage)}
                    slug={campaign.slug}
                    priority={index < 2}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p>No campaigns found. Add some in your Sanity Studio.</p>
              </div>
            )}
          </section>
        </FadeInSection>

        {/* About Section */}
        <FadeInSection>
          <section id="about" className="py-20 md:py-32">
            <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="max-w-prose">
                  <h2 className="text-3xl font-bold tracking-tight md:text-4xl uppercase mb-6">ABOUT TC MANAGEMENT</h2>

                  {aboutContent && (
                    <div>
                      {/* Spanish content */}
                      <div className="mb-6">
                        <PortableText value={aboutContent.textES} language="es" />
                      </div>

                      {/* English content */}
                      <div className="text-sm italic text-muted-foreground">
                        <PortableText value={aboutContent.textEN} language="en" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Image slider from Sanity */}
                <div>
                  {aboutImages && aboutImages.length > 0 ? (
                    <ImageSlider images={aboutImages} />
                  ) : (
                    <Image
                      src="/images/about-tc-1.jpeg"
                      alt="About TC Management"
                      width={800}
                      height={1000}
                      priority
                      className="object-cover rounded-md w-full h-[500px] md:h-[600px]"
                    />
                  )}
                </div>
              </div>
            </div>
          </section>
        </FadeInSection>
        
        {/* US Section */}
        <FadeInSection>
          {usContent ? (
            <USSection
              sectionTitle={usContent.sectionTitle}
              teamMembers={usContent.teamMembers}
            />
          ) : null}
        </FadeInSection>

        {/* Contact Form Section */}
        <FadeInSection>
          <section id="contact" className="py-20 bg-neutral-100 dark:bg-neutral-900">
            <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
              <ContactForm />
            </div>
          </section>
        </FadeInSection>
      </main>
      <SiteFooter />
    </div>
  )
}
