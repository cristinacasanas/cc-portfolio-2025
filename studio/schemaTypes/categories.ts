import { defineField, defineType } from "sanity";

export default defineType({
  name: "categories",
  title: "Categories",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "object",
      fields: [
        {
          name: "fr",
          title: "Français",
          type: "string",
          validation: (Rule: any) => Rule.required(),
        },
        {
          name: "en",
          title: "English",
          type: "string",
        },
      ],
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: (doc: any) => doc.title?.fr || "",
        maxLength: 96,
      },
      validation: (Rule: any) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "title.fr",
      titleEn: "title.en",
    },
    prepare({ title, titleEn }) {
      return {
        title: title || titleEn || "No title",
      };
    },
  },
});
