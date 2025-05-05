import { defineField, defineType } from "sanity";

export default defineType({
  name: "font",
  title: "Fonts",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Font Name",
      type: "string",
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: "fontFile",
      title: "Font File",
      type: "file",
      options: {
        accept: ".ttf,.otf,.woff,.woff2",
      },
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: "fontWeight",
      title: "Font Weight",
      type: "number",
      options: {
        list: [100, 200, 300, 400, 500, 600, 700, 800, 900],
      },
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: "isDefault",
      title: "Use as Default Font",
      type: "boolean",
      initialValue: false,
    }),
  ],
});
