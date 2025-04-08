export default {
  name: "model",
  title: "Model",
  type: "document",
  fields: [
    {
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "gender",
      title: "Gender",
      type: "string",
      options: {
        list: [
          { title: "Women", value: "Women" },
          { title: "Men", value: "Men" },
        ],
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: "profileImage",
      title: "Profile Image",
      type: "image",
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: "mainDescriptionES",
      title: "Main Description (Spanish)",
      type: "text",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "mainDescriptionEN",
      title: "Main Description (English)",
      type: "text",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "additionalImages",
      title: "Additional Images",
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
      name: "height",
      title: "Height",
      type: "string",
    },
    {
      name: "measurements",
      title: "Measurements",
      type: "object",
      fields: [
        { name: "bust", title: "Bust", type: "string" },
        { name: "waist", title: "Waist", type: "string" },
        { name: "hips", title: "Hips", type: "string" },
        { name: "shoes", title: "Shoes", type: "string" },
        { name: "hair", title: "Hair", type: "string" },
        { name: "eyes", title: "Eyes", type: "string" },
      ],
    },
    {
      name: "location",
      title: "Location",
      type: "string",
    },
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "gender",
      media: "profileImage",
    },
  },
}
