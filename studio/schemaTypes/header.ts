export default {
  name: "header",
  title: "Header",
  type: "document",
  fields: [
    {
      name: "logo",
      title: "Logo Text",
      type: "string",
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "navigation",
      title: "Navigation",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "title",
              title: "Title",
              type: "object",
              fields: [
                {
                  name: "en",
                  title: "English",
                  type: "string",
                  validation: (Rule: any) => Rule.required(),
                },
                {
                  name: "fr",
                  title: "French",
                  type: "string",
                  validation: (Rule: any) => Rule.required(),
                },
              ],
            },
            {
              name: "slug",
              title: "Slug",
              type: "slug",
              options: {
                source: "title.en",
              },
              validation: (Rule: any) => Rule.required(),
            },
          ],
        },
      ],
    },
  ],
};
