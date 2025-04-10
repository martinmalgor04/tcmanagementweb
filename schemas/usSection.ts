export default {
  name: "usSection",
  title: "US Section",
  type: "document",
  fields: [
    {
      name: "sectionTitle",
      title: "Section Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "teamMembers",
      title: "Team Members",
      type: "array",
      of: [
        {
          type: "object",
          title: "Team Member",
          fields: [
            {
              name: "name",
              title: "Name",
              type: "string",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "role",
              title: "Role",
              type: "string",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "bioES",
              title: "Bio (Spanish)",
              type: "array",
              of: [
                {
                  type: "block",
                  styles: [
                    { title: "Normal", value: "normal" },
                    { title: "H1", value: "h1" },
                    { title: "H2", value: "h2" },
                    { title: "H3", value: "h3" },
                    { title: "H4", value: "h4" },
                    { title: "Quote", value: "blockquote" },
                  ],
                  marks: {
                    decorators: [
                      { title: "Strong", value: "strong" },
                      { title: "Emphasis", value: "em" },
                      { title: "Underline", value: "underline" },
                    ],
                  },
                },
              ],
              validation: (Rule) => Rule.required(),
            },
            {
              name: "bioEN",
              title: "Bio (English)",
              type: "array",
              of: [
                {
                  type: "block",
                  styles: [
                    { title: "Normal", value: "normal" },
                    { title: "H1", value: "h1" },
                    { title: "H2", value: "h2" },
                    { title: "H3", value: "h3" },
                    { title: "H4", value: "h4" },
                    { title: "Quote", value: "blockquote" },
                  ],
                  marks: {
                    decorators: [
                      { title: "Strong", value: "strong" },
                      { title: "Emphasis", value: "em" },
                      { title: "Underline", value: "underline" },
                    ],
                  },
                },
              ],
              validation: (Rule) => Rule.required(),
            },
            {
              name: "photo",
              title: "Photo",
              type: "image",
              options: {
                hotspot: true,
              },
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: {
            select: {
              title: "name",
              subtitle: "role",
              media: "photo",
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    },
  ],
  preview: {
    select: {
      title: "sectionTitle",
      subtitle: "teamMembers.0.name",
      media: "teamMembers.0.photo",
    },
    prepare(selection) {
      const { title, subtitle, media } = selection;
      return {
        title: title || "US Section",
        subtitle: subtitle ? `Team includes: ${subtitle}...` : "No team members yet",
        media: media,
      };
    },
  },
} 