import { defineField, defineType } from "sanity";

export default defineType({
  name: "about",
  title: "About",
  type: "document",
  fields: [
    defineField({
      name: "description",
      title: "Description",
      type: "object",
      fields: [
        {
          name: "fr",
          title: "Français",
          type: "array",
          of: [{ type: "block" }],
          validation: (Rule: any) => Rule.required(),
        },
        {
          name: "en",
          title: "English",
          type: "array",
          of: [{ type: "block" }],
        },
      ],
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
    }),
    defineField({
      name: "awards",
      title: "Awards",
      type: "array",
      of: [
        defineField({
          name: "award",
          title: "Award",
          type: "object",
          fields: [
            defineField({
              name: "placeholder",
              title: "Placeholder",
              type: "string",
            }),
            defineField({
              name: "url",
              title: "URL",
              type: "url",
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "description",
    },
    prepare() {
      return {
        title: "About",
      };
    },
  },
});