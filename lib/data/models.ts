// src/lib/data/models.ts

export interface ModelMeasurements {
  height: string
  bust: string
  waist: string
  hips: string
  shoes: string
  hair: string
  eyes: string
}

export interface ModelImage {
  id: string
  url: string
  alt: string
  isCover?: boolean
}

export interface Model {
  id: number
  slug: string
  name: string
  firstName: string
  lastName: string
  division: "Women" | "Men"
  description: {
    es: string
    en: string
  }
  measurements: ModelMeasurements
  images: ModelImage[]
  coverImage: string
  featured?: boolean
  campaigns?: number[]
}

// ----------------------
// WOMEN MODELS
// ----------------------

export const womenModels: Model[] = [
  {
    id: 101,
    slug: "arantza",
    name: "Arantza",
    firstName: "Arantza",
    lastName: "Arantza",
    division: "Women",
    description: {
      es: "Arantza es una modelo destacada conocida por su elegante silueta y versátil presencia en pasarela. Ha participado en campañas para casas de moda de lujo en toda Europa.",
      en: "Arantza is a striking model known for her elegant silhouette and versatile runway presence. She has been featured in campaigns for luxury fashion houses across Europe.",
    },
    measurements: {
      height: "5'10\" / 178cm",
      bust: '32" / 81cm',
      waist: '24" / 61cm',
      hips: '34" / 86cm',
      shoes: "US 9 / EU 40",
      hair: "Brown",
      eyes: "Hazel",
    },
    images: [
      { id: "arantza-1", url: "/images/models/arantzap.jpg", alt: "Arantza Portrait", isCover: true },
      { id: "arantza-2", url: "/images/models/arantzap.jpg", alt: "Arantza Campaign" },
    ],
    coverImage: "/images/models/arantzap.jpg",
    featured: true,
    campaigns: [1],
  },
  {
    id: 102,
    slug: "anna",
    name: "Anna",
    firstName: "Anna",
    lastName: "Anna",
    division: "Women",
    description: {
      es: "Anna es una estrella emergente en la moda editorial, combinando belleza clásica con una presencia moderna. Recientemente apareció en la portada de Vogue España.",
      en: "Anna is a rising star in editorial fashion, combining classic beauty with a modern presence. She recently appeared on the cover of Vogue España.",
    },
    measurements: {
      height: "5'11\" / 180cm",
      bust: '33" / 84cm',
      waist: '25" / 63cm',
      hips: '35" / 89cm',
      shoes: "US 8.5 / EU 39",
      hair: "Black",
      eyes: "Brown",
    },
    images: [
      { id: "anna-1", url: "/images/models/lucia-1.jpg", alt: "Anna Portrait", isCover: true },
      { id: "anna-2", url: "/images/models/lucia-2.jpg", alt: "Anna Editorial" },
    ],
    coverImage: "/images/models/annap.jpg",
    featured: false,
    campaigns: [2, 3],
  },
]

// ----------------------
// MEN MODELS
// ----------------------

export const menModels: Model[] = [
  {
    id: 201,
    slug: "hermes-bar",
    name: "Hermes Bär",
    firstName: "Hermes",
    lastName: "Bär",
    division: "Men",
    description: {
      es: "Hermes Bär es un modelo experimentado con una estética refinada, destacado en importantes editoriales y semanas de la moda internacionales.",
      en: "Hermes Bär is a seasoned model with a refined aesthetic, featured in major editorial spreads and international fashion weeks.",
    },
    measurements: {
      height: "6'2\" / 188cm",
      bust: '40" / 101cm',
      waist: '31" / 79cm',
      hips: '38" / 97cm',
      shoes: "US 11 / EU 44",
      hair: "Blonde",
      eyes: "Green",
    },
    images: [
      { id: "hermes-1", url: "/images/models/hermesp.jpeg", alt: "Hermes Portrait", isCover: true },
      { id: "hermes-2", url: "/images/models/hermesp.jpeg", alt: "Hermes Studio" },
    ],
    coverImage: "/images/models/hermesp.jpeg",
    featured: true,
    campaigns: [3],
  },
  {
    id: 202,
    slug: "martin-garcia",
    name: "Martín García",
    firstName: "Martín",
    lastName: "García",
    division: "Men",
    description: {
      es: "Martín García combina el encanto latino clásico con la intensidad de la alta moda. Ha desfilado para los mejores diseñadores en París y Milán.",
      en: "Martín García blends classic Latin charm with high fashion intensity. He has walked for top designers in Paris and Milan.",
    },
    measurements: {
      height: "6'1\" / 185cm",
      bust: '39" / 99cm',
      waist: '30" / 76cm',
      hips: '37" / 94cm',
      shoes: "US 10.5 / EU 43",
      hair: "Dark Brown",
      eyes: "Brown",
    },
    images: [
      { id: "martin-1", url: "/images/models/martin-1.jpg", alt: "Martín Lookbook", isCover: true },
      { id: "martin-2", url: "/images/models/martin-2.jpg", alt: "Martín Campaign" },
      { id: "martin-3", url: "/images/models/martin-3.jpg", alt: "Martín Close Up" },
      { id: "martin-4", url: "/images/models/martin-4.jpg", alt: "Martín Editorial" },
    ],
    coverImage: "/images/models/martin-cover.jpg",
    featured: false,
    campaigns: [3],
  },
]

// ----------------------
// HELPERS
// ----------------------

export function getModelBySlug(slug: string): Model | undefined {
  return [...womenModels, ...menModels].find((model) => model.slug === slug)
}

export function getModelById(id: number): Model | undefined {
  return [...womenModels, ...menModels].find((model) => model.id === id)
}

export function getModelsByDivision(division: "Women" | "Men"): Model[] {
  return division === "Women" ? womenModels : menModels
}

export function getFeaturedModels(division?: "Women" | "Men"): Model[] {
  const models = division ? getModelsByDivision(division) : [...womenModels, ...menModels]
  return models.filter((model) => model.featured)
}
