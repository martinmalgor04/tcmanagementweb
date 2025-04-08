"use client"

import { urlFor } from "@/lib/sanity"
import Image from "next/image"

interface PortableTextProps {
  value: any
  language?: "es" | "en"
}

export function PortableText({ value, language = "es" }: PortableTextProps) {
  if (!value) {
    return null
  }

  // Handle arrays (blocks)
  if (Array.isArray(value)) {
    return (
      <div className="space-y-4">
        {value.map((block, index) => (
          <PortableText key={index} value={block} language={language} />
        ))}
      </div>
    )
  }

  // Handle block types
  if (value._type === "block") {
    const style = value.style || "normal"

    // Extract text from spans
    const text = value.children
      ?.filter((child: any) => child._type === "span")
      .map((span: any) => span.text)
      .join("")

    // Render different block types
    switch (style) {
      case "h1":
        return <h1 className="text-3xl font-bold mt-6 mb-4">{text}</h1>
      case "h2":
        return <h2 className="text-2xl font-bold mt-5 mb-3">{text}</h2>
      case "h3":
        return <h3 className="text-xl font-bold mt-4 mb-2">{text}</h3>
      case "h4":
        return <h4 className="text-lg font-bold mt-3 mb-2">{text}</h4>
      case "blockquote":
        return <blockquote className="pl-4 border-l-4 border-gray-300 italic">{text}</blockquote>
      default:
        return <p className="mb-4">{text}</p>
    }
  }

  // Handle image type
  if (value._type === "image" && value.asset) {
    return (
      <div className="my-6 relative aspect-video w-full">
        <Image
          src={urlFor(value).url() || "/placeholder.svg"}
          alt={value.alt || "Image"}
          fill
          className="object-cover rounded-md"
        />
      </div>
    )
  }

  // For any other types or if nothing matches
  return null
}
