import { createClient } from "next-sanity"
import { createImageUrlBuilder } from "@sanity/image-url"

const isProd = process.env.NODE_ENV === "production"

const projectId = isProd ? "be45cp0a" : process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "be45cp0a"
const dataset = isProd ? "production" : process.env.NEXT_PUBLIC_SANITY_DATASET || "production"

export const client = createClient({
  projectId,
  dataset,
  apiVersion: "2023-05-03", // Using a stable API version
  // Desactivamos CDN para obtener datos frescos cuando el webhook revalida
  useCdn: false,
})

// Helper function for generating image URLs with the Sanity Image pipeline
// Pasando el cliente directamente a createImageUrlBuilder
const builder = createImageUrlBuilder(client)

export function urlFor(source: any) {
  if (!source) return null
  return builder.image(source)
}

// GROQ queries for fetching data
export const queries = {
  // Get all models for listing (optimized - only essential fields)
  getModels: `*[_type == "model"] | order(_createdAt desc) {
    _id,
    name,
    gender,
    profileImage,
    "slug": slug.current
  }`,

  // Get models filtered by gender for listing (optimized - only essential fields)
  getModelsByGender: `*[_type == "model" && gender == $gender] | order(_createdAt desc) {
    _id,
    name,
    gender,
    profileImage,
    "slug": slug.current
  }`,

  // Get models with pagination
  getModelsByGenderPaginated: `*[_type == "model" && gender == $gender] | order(_createdAt desc) [$start...$end] {
    _id,
    name,
    gender,
    profileImage,
    "slug": slug.current
  }`,

  // Count total models by gender
  countModelsByGender: `count(*[_type == "model" && gender == $gender])`,

  // Get a single model by slug
  getModelBySlug: `*[_type == "model" && slug.current == $slug][0] {
    _id,
    name,
    gender,
    slug,
    profileImage,
    mainDescriptionES,
    mainDescriptionEN,
    additionalImages,
    height,
    measurements,
    location,
    "campaigns": *[_type == "campaign" && references(^._id)]{
      _id,
      title,
      client,
      "slug": slug.current,
      coverImage
    }
  }`,

  // Get all campaigns
  getCampaigns: `*[_type == "campaign"] | order(_createdAt desc) {
    _id,
    title,
    client,
    coverImage,
    descriptionES,
    descriptionEN,
    category,
    season,
    year,
    "slug": slug.current,
    gallery
  }`,

  // Get a single campaign by slug
  getCampaignBySlug: `*[_type == "campaign" && slug.current == $slug][0] {
    _id,
    title,
    client,
    coverImage,
    descriptionES,
    descriptionEN,
    category,
    season,
    year,
    slug,
    gallery,
    "models": *[_type == "model" && references(^._id)]{
      _id,
      name,
      gender,
      "slug": slug.current,
      profileImage
    }
  }`,

  // Get about page content
  getAbout: `*[_type == "about"][0] {
    textES,
    textEN,
    aboutImages
  }`,

  // Get global settings
  getSettings: `*[_type == "settings"][0] {
    heroImage,
    logo,
    footerText
  }`,

  // Get US section content
  getUSSection: `*[_type == "usSection"][0] {
    sectionTitle,
    teamMembers[] {
      name,
      role,
      bioES,
      bioEN,
      photo
    }
  }`,
}
