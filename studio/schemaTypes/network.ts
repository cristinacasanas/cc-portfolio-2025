import { defineField, defineType } from "sanity";

export default defineType({
  name: "network",
  title: "Network",
  type: "document",
  fields: [
    defineField({
      name: "links",
      title: "Links",
      type: "array",
      of: [
        defineField({
          name: "link",
          title: "Link",
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "Title",
              type: "string",
            }),
            defineField({
              name: "url",
              title: "URL",
              type: "url",
              validation: (Rule: any) => 
                Rule.uri({
                  scheme: ["http", "https", "mailto", "tel"]
                }),
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "links",
    },
  },
});