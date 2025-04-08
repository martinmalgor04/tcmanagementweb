"use client"

import { useState, useEffect } from "react"
import { FadeInSection } from "@/components/fade-in-section"
import { CampaignCard } from "@/components/cards/campaign-card"
import { Button } from "@/components/ui/button"
import { client, urlFor, queries } from "@/lib/sanity"

// Campaign categories
const CATEGORIES = ["All", "UGC", "Parade", "Production"]

export default function PortfolioClientPage() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch campaigns from Sanity
  useEffect(() => {
    async function fetchCampaigns() {
      try {
        setLoading(true)
        const data = await client.fetch(queries.getCampaigns)
        console.log("✅ Fetched campaigns for portfolio:", data)
        setCampaigns(data)
      } catch (error) {
        console.error("❌ Error fetching campaigns:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCampaigns()
  }, [])

  // Filter campaigns based on active category
  const filteredCampaigns =
    activeCategory === "All" ? campaigns : campaigns.filter((campaign) => campaign.category === activeCategory)

  return (
    <main className="flex-1 py-20">
      <div className="container mx-auto px-6 md:px-8">
        <h1 className="text-4xl font-bold text-center mb-12 uppercase">OUR CAMPAIGNS</h1>

        {/* Filter buttons */}
        <FadeInSection>
          <div className="flex justify-center mb-10 overflow-x-auto">
            <div className="flex gap-2">
              {CATEGORIES.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  onClick={() => setActiveCategory(category)}
                  className="uppercase"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </FadeInSection>

        <FadeInSection>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-[3/4] bg-gray-200 animate-pulse rounded" />
              ))}
            </div>
          ) : filteredCampaigns.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {filteredCampaigns.map((campaign, index) =>
                campaign.slug ? (
                  <CampaignCard
                    key={campaign._id}
                    id={index + 1}
                    title={campaign.title}
                    client={campaign.client || "Client"}
                    imageSrc={campaign.coverImage ? urlFor(campaign.coverImage).url() : "/placeholder.svg"}
                    slug={campaign.slug} // ✅ Aca el cambio
                    priority={index < 4}
                  />
                ) : (
                  console.warn("⚠️ Campaña ignorada por falta de slug:", campaign)
                )
              )}
            </div>
          ) : (
            <div className="text-center py-10">
              <p>No campaigns found in this category. Add some in your Sanity Studio.</p>
            </div>
          )}
        </FadeInSection>
      </div>
    </main>
  )
}
