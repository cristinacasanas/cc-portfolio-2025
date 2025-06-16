import { orderRankField } from "@sanity/orderable-document-list";
import { defineField, defineType } from "sanity";

export default defineType({
  name: "projects",
  title: "Projects",
  type: "document",
  fields: [
    orderRankField({ type: "projects" }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: "thumbnail",
      title: "Thumbnail",
      type: "array",
      of: [
        {
          name: "image",
          title: "Image",
          type: "image",
          options: {
            hotspot: true,
          },
        },
        {
          name: "video",
          title: "Video",
          type: "file",
          options: {
            accept: "video/*",
          },
        },
      ],
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      of: [{ type: "reference", to: { type: "categories" } }],
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "object",
      fields: [
        {
          name: "fr",
          title: "Français",
          type: "text",
          validation: (Rule: any) => Rule.required(),
        },
        {
          name: "en",
          title: "English",
          type: "text",
        },
      ],
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
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
              type: "string",
              title: "Alternative text",
            },
          ],
        },
        {
          name: "video",
          title: "Video",
          type: "file",
          options: {
            accept: "video/*",
          },
        },
      ],
      options: {
        layout: "grid",
      },
    }),
  ],
  preview: {
    select: {
      title: "title",
      description: "description.fr",
      media: "thumbnail",
    },
    prepare({ title, description, media }) {
      return {
        title,
        subtitle: description,
        media,
      };
    },
  },
});
