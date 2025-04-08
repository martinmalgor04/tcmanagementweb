// src/data/campaigns.ts

export interface CampaignImage {
  id: string
  url: string
  alt: string
  isCover?: boolean
}

export interface Campaign {
  id: number
  slug: string
  title: string
  client: string
  description: {
    es: string
    en: string
  }
  season?: string
  year?: number
  images: CampaignImage[]
  coverImage: string
  featured?: boolean
  models?: number[]
}

export const campaigns: Campaign[] = [
  {
    id: 1,
    slug: "maliva-ss24",
    title: "ANNA & ARANTZA",
    client: "Maliva",
    description: {
      es: "Editorial de moda para la colección Otoño/Invierno 2023 de Maliva, realizada en Corrientes en su estudio con fotografía de Mateo De Finis",
      en: "Fashion editorial for Maliva's Fall/Winter 2023 collection, shot in Corrientes at their studio with photography by Mateo De Finis",
    },
    season: "Spring/Summer",
    year: 2024,
    coverImage: "/images/maliva.jpeg",
    featured: true,
    models: [1, 2],
    images: [
      {
        id: "maliva-1",
        url: "/images/maliva-1.jpg",
        alt: "Maliva Campaign Photo 1",
        isCover: true,
      },
      {
        id: "maliva-2",
        url: "/images/maliva-2.jpg",
        alt: "Maliva Campaign Photo 2",
      },
      {
        id: "maliva-3",
        url: "/images/maliva-3.jpg",
        alt: "Maliva Campaign Photo 3",
      },
    ],
  },
  {
    id: 2,
    slug: "valveloso",
    title: "ABRIL RODRIGUEZ",
    client: "Val Veloso",
    description: {
      es: "Desfile colección STYLE CRUISE 25 en el Museo de Bellas Artes de Corrientes.",
      en: "Fashion show for STYLE CRUISE 25 collection at the Museum of Fine Arts in Corrientes.",
    },
    season: "Summer",
    year: 2024,
    coverImage: "/images/valveloso.jpeg",
    featured: true,
    models: [3],
    images: [
      {
        id: "verso-1",
        url: "/images/verso-1.jpg",
        alt: "Verso Campaign Photo 1",
        isCover: true,
      },
      {
        id: "verso-2",
        url: "/images/verso-2.jpg",
        alt: "Verso Campaign Photo 2",
      },
    ],
  },
  {
    id: 3,
    slug: "recamador",
    title: "HERMES BÄR",
    client: "Recamador",
    description: {
      es: "Desfile AREIA SS25 en Kohaus en Corrientes.",
      en: "AREIA SS25 fashion show at Kohaus in Corrientes.",
    },
    season: "Spring/Summer",
    year: 2024,
    coverImage: "/images/areia.jpeg",
    featured: true,
    models: [4, 5],
    images: [
      {
        id: "aurora-1",
        url: "/images/aurora-1.jpg",
        alt: "Aurora Resort Campaign Photo 1",
        isCover: true,
      },
      {
        id: "aurora-2",
        url: "/images/aurora-2.jpg",
        alt: "Aurora Resort Campaign Photo 2",
      },
    ],
  },
  {
    id: 4,
    slug: "abuma",
    title: "CECILIA GOTTOLI",
    client: "Abuma Project",
    description: {
      es: "Producción AW24 abuma project en un estudio Chaco Argentina.",
      en: "AW24 production for abuma project at a studio in Chaco, Argentina.",
    },
    season: "Spring/Summer",
    year: 2023,
    coverImage: "/images/abuma.jpeg",
    featured: true,
    models: [6],
    images: [
      {
        id: "noir-1",
        url: "/images/noir-1.jpg",
        alt: "NOIR Editorial Photo 1",
        isCover: true,
      },
      {
        id: "noir-2",
        url: "/images/noir-2.jpg",
        alt: "NOIR Editorial Photo 2",
      },
    ],
  },
  {
    id: 5,
    slug: "optica",
    title: "Gonzalo Witte",
    client: "Optica Copete",
    description: {
      es: "Campaña comercial filmada en el sur de Argentina para la colección otoño/invierno 2022 de Viento.",
      en: "Commercial campaign filmed in southern Argentina for Viento's Fall/Winter 2022 collection.",
    },
    season: "Spring/Summer",
    year: 2022,
    coverImage: "/images/optic.jpeg",
    featured: false,
    models: [2, 5],
    images: [
      {
        id: "viento-1",
        url: "/images/viento-1.jpg",
        alt: "Viento Campaign Photo 1",
        isCover: true,
      },
      {
        id: "viento-2",
        url: "/images/viento-2.jpg",
        alt: "Viento Campaign Photo 2",
      },
    ],
  },
  {
    id: 6,
    slug: "eclipse-x-collab",
    title: "Eclipse × Collab",
    client: "Eclipse x NewAge",
    description: {
      es: "Campaña conceptual de colaboración entre Eclipse y NewAge, con estilismo futurista y locaciones urbanas.",
      en: "Conceptual collaboration campaign between Eclipse and NewAge, featuring futuristic styling and urban locations.",
    },
    season: "Resort",
    year: 2023,
    coverImage: "/images/eclipse-cover.jpg",
    featured: false,
    models: [1],
    images: [
      {
        id: "eclipse-1",
        url: "/images/eclipse-1.jpg",
        alt: "Eclipse Campaign Photo 1",
        isCover: true,
      },
      {
        id: "eclipse-2",
        url: "/images/eclipse-2.jpg",
        alt: "Eclipse Campaign Photo 2",
      },
    ],
  },
]

// 🚀 Helpers
export function getCampaignBySlug(slug: string): Campaign | undefined {
  return campaigns.find((campaign) => campaign.slug === slug)
}

export function getCampaignById(id: number): Campaign | undefined {
  return campaigns.find((campaign) => campaign.id === id)
}

export function getFeaturedCampaigns(): Campaign[] {
  return campaigns.filter((campaign) => campaign.featured)
}

export function getCampaignsByModelId(modelId: number): Campaign[] {
  return campaigns.filter((campaign) => campaign.models?.includes(modelId))
}
