import { defineField, defineType } from "sanity";

export default defineType({
  name: "design",
  title: "Design System",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule: any) => Rule.required(),
      initialValue: "Default Theme",
    }),
    defineField({
      name: "isActive",
      title: "Active Theme",
      type: "boolean",
      description: "Only one theme can be active at a time",
      initialValue: false,
    }),
    defineField({
      name: "colors",
      title: "Colors",
      type: "object",
      fields: [
        defineField({
          name: "primary",
          title: "Primary",
          type: "string",
        }),
        defineField({
          name: "secondary",
          title: "Secondary",
          type: "string",
        }),
        defineField({
          name: "background",
          title: "Background",
          type: "object",
          fields: [
            defineField({
              name: "light",
              title: "Light",
              type: "string",
            }),
            defineField({
              name: "dark",
              title: "Dark",
              type: "string",
            }),
          ],
        }),
        defineField({
          name: "text",
          title: "Text",
          type: "object",
          fields: [
            defineField({
              name: "light",
              title: "Light",
              type: "string",
            }),
            defineField({
              name: "dark",
              title: "Dark",
              type: "string",
            }),
          ],
        }),
        defineField({
          name: "hover",
          title: "Hover Color",
          type: "object",
          fields: [
            defineField({
              name: "light",
              title: "Light",
              type: "string",
            }),
            defineField({
              name: "dark",
              title: "Dark",
              type: "string",
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: "typography",
      title: "Typography",
      type: "object",
      fields: [
        // Heading Font
        defineField({
          name: "headings",
          title: "Headings Font",
          type: "object",
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
                list: [
                  { title: "Thin (100)", value: 100 },
                  { title: "Extra Light (200)", value: 200 },
                  { title: "Light (300)", value: 300 },
                  { title: "Regular (400)", value: 400 },
                  { title: "Medium (500)", value: 500 },
                  { title: "Semi Bold (600)", value: 600 },
                  { title: "Bold (700)", value: 700 },
                  { title: "Extra Bold (800)", value: 800 },
                  { title: "Black (900)", value: 900 },
                ],
              },
              initialValue: 700,
            }),
            defineField({
              name: "fontStyle",
              title: "Font Style",
              type: "string",
              options: {
                list: [
                  { title: "Normal", value: "normal" },
                  { title: "Italic", value: "italic" },
                ],
              },
              initialValue: "normal",
            }),
          ],
        }),
        // Body Font
        defineField({
          name: "body",
          title: "Body Font",
          type: "object",
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
                list: [
                  { title: "Thin (100)", value: 100 },
                  { title: "Extra Light (200)", value: 200 },
                  { title: "Light (300)", value: 300 },
                  { title: "Regular (400)", value: 400 },
                  { title: "Medium (500)", value: 500 },
                  { title: "Semi Bold (600)", value: 600 },
                  { title: "Bold (700)", value: 700 },
                  { title: "Extra Bold (800)", value: 800 },
                  { title: "Black (900)", value: 900 },
                ],
              },
              initialValue: 400,
            }),
            defineField({
              name: "fontStyle",
              title: "Font Style",
              type: "string",
              options: {
                list: [
                  { title: "Normal", value: "normal" },
                  { title: "Italic", value: "italic" },
                ],
              },
              initialValue: "normal",
            }),
          ],
        }),
        // Mono Font
        defineField({
          name: "mono",
          title: "Monospace Font",
          type: "object",
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
                list: [
                  { title: "Thin (100)", value: 100 },
                  { title: "Extra Light (200)", value: 200 },
                  { title: "Light (300)", value: 300 },
                  { title: "Regular (400)", value: 400 },
                  { title: "Medium (500)", value: 500 },
                  { title: "Semi Bold (600)", value: 600 },
                  { title: "Bold (700)", value: 700 },
                  { title: "Extra Bold (800)", value: 800 },
                  { title: "Black (900)", value: 900 },
                ],
              },
              initialValue: 400,
            }),
            defineField({
              name: "fontStyle",
              title: "Font Style",
              type: "string",
              options: {
                list: [
                  { title: "Normal", value: "normal" },
                  { title: "Italic", value: "italic" },
                ],
              },
              initialValue: "normal",
            }),
          ],
        }),
        defineField({
          name: "baseSize",
          title: "Base Font Size (px)",
          type: "number",
          initialValue: 16,
          validation: (Rule: any) => Rule.required().min(12).max(24),
        }),
        defineField({
          name: "scaleRatio",
          title: "Type Scale Ratio",
          type: "string",
          options: {
            list: [
              { title: "Minor Second (1.067)", value: "1.067" },
              { title: "Major Second (1.125)", value: "1.125" },
              { title: "Minor Third (1.2)", value: "1.2" },
              { title: "Major Third (1.25)", value: "1.25" },
              { title: "Perfect Fourth (1.333)", value: "1.333" },
              { title: "Augmented Fourth (1.414)", value: "1.414" },
              { title: "Perfect Fifth (1.5)", value: "1.5" },
              { title: "Golden Ratio (1.618)", value: "1.618" },
            ],
          },
          initialValue: "1.25",
        }),
      ],
    }),
    defineField({
      name: "spacing",
      title: "Spacing",
      type: "object",
      fields: [
        defineField({
          name: "baseUnit",
          title: "Base Spacing Unit (px)",
          type: "number",
          initialValue: 4,
          validation: (Rule: any) => Rule.required().min(2).max(8),
        }),
        defineField({
          name: "scale",
          title: "Spacing Scale",
          type: "string",
          options: {
            list: [
              { title: "Linear (1, 2, 3, 4)", value: "linear" },
              { title: "Geometric (2, 4, 8, 16)", value: "geometric" },
            ],
          },
          initialValue: "geometric",
        }),
      ],
    }),
    defineField({
      name: "borderRadius",
      title: "Border Radius",
      type: "object",
      fields: [
        defineField({
          name: "small",
          title: "Small (px)",
          type: "number",
          initialValue: 4,
        }),
        defineField({
          name: "medium",
          title: "Medium (px)",
          type: "number",
          initialValue: 8,
        }),
        defineField({
          name: "large",
          title: "Large (px)",
          type: "number",
          initialValue: 16,
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "name",
      isActive: "isActive",
    },
    prepare({ title, isActive }) {
      return {
        title,
        subtitle: isActive ? "✅ Active Theme" : "Inactive Theme",
      };
    },
  },
});
