import { cache } from 'react'
import { client, queries, urlFor } from './sanity'

// Funciones cacheadas para evitar consultas duplicadas
export const getModels = cache(async (gender?: string) => {
  if (gender) {
    return client.fetch(queries.getModelsByGender, { gender })
  }
  return client.fetch(queries.getModels)
})

export const getCampaigns = cache(async () => {
  return client.fetch(queries.getCampaigns)
})

export const getAboutContent = cache(async () => {
  return client.fetch(queries.getAbout)
})

export const getUSContent = cache(async () => {
  return client.fetch(queries.getUSSection)
})

export const getCampaignBySlug = cache(async (slug: string) => {
  return client.fetch(queries.getCampaignBySlug, { slug })
})

export const getModelBySlug = cache(async (slug: string) => {
  return client.fetch(queries.getModelBySlug, { slug })
})

// Helper para getImageUrl
export const getImageUrl = (image: any, fallback = '/placeholder.svg') => {
  if (!image) return fallback
  const imageObj = urlFor(image)
  return imageObj ? imageObj.url() || fallback : fallback
} 