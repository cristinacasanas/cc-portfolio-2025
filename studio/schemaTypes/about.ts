import { defineField, defineType } from "sanity";

export default defineType({
  name: "about",
  title: "About",
  type: "document",
  fields: [
    defineField({
      name: "description",
      title: "Description",
      type: "array",
      of: [{ type: "block" }],
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
});