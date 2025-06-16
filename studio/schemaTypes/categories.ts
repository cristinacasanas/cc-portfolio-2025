import { orderRankField } from "@sanity/orderable-document-list";
import { defineField, defineType } from "sanity";

export default defineType({
  name: "categories",
  title: "Categories",
  type: "document",
  fields: [
    orderRankField({ type: "categories" }),
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
        source: (doc: any) => doc.title?.en || "",
        maxLength: 96,
      },
      validation: (Rule: any) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "title.en",
      titleFr: "title.fr",
    },
    prepare({ title, titleFr }) {
      return {
        title: title || titleFr || "No title",
      };
    },
  },
});
