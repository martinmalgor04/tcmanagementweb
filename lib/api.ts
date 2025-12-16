import { cache } from 'react'
import { client, queries, urlFor } from './sanity'

// Funciones cacheadas para evitar consultas duplicadas
export const getModels = cache(async (gender?: string) => {
  try {
    if (gender) {
      console.log(`[API] Fetching models with gender: ${gender}`)
      const result = await client.fetch(queries.getModelsByGender, { gender })
      console.log(`[API] Found ${result?.length || 0} models`)
      return result
    }
    const result = await client.fetch(queries.getModels)
    console.log(`[API] Found ${result?.length || 0} models (all)`)
    return result
  } catch (error) {
    console.error('[API] Error fetching models:', error)
    return []
  }
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
  if (!image) {
    console.log('[API] getImageUrl: no image provided, using fallback')
    return fallback
  }
  const imageObj = urlFor(image)
  const url = imageObj ? imageObj.url() || fallback : fallback
  console.log('[API] getImageUrl result:', url?.substring(0, 80))
  return url
} 