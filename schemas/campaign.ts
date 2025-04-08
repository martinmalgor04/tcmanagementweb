export default {
  name: "campaign",
  title: "Campaign",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "client",
      title: "Client",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: "coverImage",
      title: "Cover Image",
      type: "image",
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: "descriptionES",
      title: "Description (Spanish)",
      type: "text",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "descriptionEN",
      title: "Description (English)",
      type: "text",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "UGC", value: "UGC" },
          { title: "Parade", value: "Parade" },
          { title: "Production", value: "Production" },
        ],
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: "season",
      title: "Season",
      type: "string",
    },
    {
      name: "year",
      title: "Year",
      type: "number",
    },
    {
      name: "gallery",
      title: "Gallery",
      type: "array",
      of: [
        {
          type: "image",
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: "alt",
              title: "Alt Text",
              type: "string",
            },
          ],
        },
      ],
    },
    {
      name: "models",
      title: "Models",
      type: "array",
      of: [
        {
          type: "reference",
          to: [{ type: "model" }],
        },
      ],
    },
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "client",
      media: "coverImage",
    },
  },
}
