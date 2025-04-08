export default {
  name: "settings",
  title: "Settings",
  type: "document",
  fields: [
    {
      name: "heroImage",
      title: "Hero Image",
      type: "image",
      options: {
        hotspot: true,
      },
    },
    {
      name: "logo",
      title: "Logo",
      type: "image",
    },
    {
      name: "footerText",
      title: "Footer Text",
      type: "text",
    },
  ],
  preview: {
    prepare() {
      return {
        title: "Global Settings",
      }
    },
  },
}
