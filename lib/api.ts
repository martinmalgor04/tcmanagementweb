import { cache } from 'react'
import { client, queries, urlFor } from './sanity'

// Constantes de paginación
export const MODELS_PER_PAGE = 8

// Funciones cacheadas para evitar consultas duplicadas
export const getModels = cache(async (gender?: string) => {
  try {
    if (gender) {
      const result = await client.fetch(queries.getModelsByGender, { gender })
      return result
    }
    return await client.fetch(queries.getModels)
  } catch (error) {
    console.error('[API] Error fetching models:', error)
    return []
  }
})

// Función para obtener modelos paginados
export const getModelsPaginated = cache(async (gender: string, page: number = 1) => {
  try {
    const start = (page - 1) * MODELS_PER_PAGE
    const end = start + MODELS_PER_PAGE
    
    // Ejecutar ambas queries en paralelo
    const [models, totalCount] = await Promise.all([
      client.fetch(queries.getModelsByGenderPaginated, { gender, start, end }),
      client.fetch(queries.countModelsByGender, { gender })
    ])
    
    const totalPages = Math.ceil(totalCount / MODELS_PER_PAGE)
    
    return {
      models: models || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  } catch (error) {
    console.error('[API] Error fetching paginated models:', error)
    return {
      models: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    }
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
  if (!image) return fallback
  const imageObj = urlFor(image)
  return imageObj ? imageObj.url() || fallback : fallback
} 