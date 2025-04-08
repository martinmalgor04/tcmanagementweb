"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { FadeInSection } from "@/components/fade-in-section"
import { CampaignCard } from "@/components/cards/campaign-card"
import { ContactForm } from "@/components/contact-form"
import { ImageSlider } from "@/components/image-slider"
import { client, urlFor, queries } from "@/lib/sanity"
import { Skeleton } from "@/components/ui/skeleton"
import { PortableText } from "@/components/portable-text"

export default function Home() {
  const [campaigns, setCampaigns] = useState([])
  const [aboutContent, setAboutContent] = useState(null)
  const [aboutImages, setAboutImages] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch campaigns and about content from Sanity
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Fetch campaigns
        const campaignsData = await client.fetch(queries.getCampaigns)
        console.log("Fetched campaigns:", campaignsData)
        setCampaigns(campaignsData)

        // Fetch about content
        const aboutData = await client.fetch(`
          *[_type == "about"][0] {
            textES,
            textEN,
            aboutImages
          }
        `)
        console.log("Fetched about:", aboutData)

        if (aboutData) {
          setAboutContent(aboutData)
          setAboutImages(aboutData.aboutImages || [])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Use only the first 4 campaigns for the featured section
  const featuredCampaigns = campaigns.slice(0, 4)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 mt-8">
        {/* Featured Campaigns - No title as requested */}
        <FadeInSection>
          <section className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl mb-20">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-[3/4]">
                    <Skeleton className="w-full h-full" />
                  </div>
                ))}
              </div>
            ) : featuredCampaigns.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {featuredCampaigns.map((campaign, index) => (
                  <CampaignCard
                    key={campaign._id}
                    id={index + 1}
                    title={campaign.title}
                    client={campaign.client || "Client"}
                    imageSrc={campaign.coverImage ? urlFor(campaign.coverImage).url() : "/placeholder.svg"}
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

        {/* About Section - Removed "Learn more about us" button */}
        <FadeInSection>
          <section id="about" className="py-20 md:py-32">
            <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="max-w-prose">
                  <h2 className="text-3xl font-bold tracking-tight md:text-4xl uppercase mb-6">ABOUT TC MANAGEMENT</h2>

                  {loading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ) : (
                    <>
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
                      {/* Removed "Learn more about us" button */}
                    </>
                  )}
                </div>

                {/* Image slider from Sanity */}
                <div>
                  {loading ? (
                    <div className="relative w-full h-[500px] md:h-[600px] bg-gray-200 animate-pulse rounded-md"></div>
                  ) : aboutImages && aboutImages.length > 0 ? (
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

        {/* Contact Form Section - Positioned at the bottom of the page */}
        <FadeInSection>
          <section id="contact" className="py-20 bg-neutral-100 dark:bg-neutral-900">
            <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl uppercase text-center mb-10">
                  CONTACTANOS
                </h2>
                <ContactForm />
              </div>
            </div>
          </section>
        </FadeInSection>
      </main>
      <SiteFooter />
    </div>
  )
}
