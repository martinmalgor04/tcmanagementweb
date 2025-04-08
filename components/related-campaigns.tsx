import { type Campaign, getCampaignById } from "@/lib/data/campaigns"
import { CampaignCard } from "@/components/cards/campaign-card"

interface RelatedCampaignsProps {
  campaignIds: number[]
  currentCampaignId?: number
}

export function RelatedCampaigns({ campaignIds, currentCampaignId }: RelatedCampaignsProps) {
  // Filter out current campaign and get campaign data
  const campaigns = campaignIds
    .filter((id) => id !== currentCampaignId)
    .map((id) => getCampaignById(id))
    .filter((campaign): campaign is Campaign => !!campaign)
    .slice(0, 4) // Limit to 4 campaigns

  if (!campaigns.length) return null

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold mb-6 uppercase">Related Work</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            id={campaign.id}
            title={campaign.title}
            client={campaign.client}
            imageSrc={campaign.coverImage}
            slug={campaign.slug}
          />
        ))}
      </div>
    </div>
  )
}
