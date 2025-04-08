import { createClient } from "next-sanity"
import imageUrlBuilder from "@sanity/image-url"

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2023-05-03", // Using a stable API version
  useCdn: process.env.NODE_ENV === "production",
})

// Helper function for generating image URLs with the Sanity Image pipeline
const builder = imageUrlBuilder(client)

export function urlFor(source: any) {
  if (!source) return null
  return builder.image(source)
}

// GROQ queries for fetching data
export const queries = {
  // Get all models, ordered by creation date
  getModels: `*[_type == "model"] | order(_createdAt desc) {
    _id,
    name,
    gender,
    profileImage,
    mainDescriptionES,
    mainDescriptionEN,
    additionalImages,
    height,
    measurements,
    "slug": slug.current,
    location
  }`,

  // Get models filtered by gender
  getModelsByGender: `*[_type == "model" && gender == $gender] | order(_createdAt desc) {
    _id,
    name,
    gender,
    profileImage,
    mainDescriptionES,
    mainDescriptionEN,
    additionalImages,
    height,
    measurements,
    "slug": slug.current,
    location
  }`,

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
}
