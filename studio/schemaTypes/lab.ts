import { defineType, defineField } from "sanity";

export default defineType({
	name: "lab",
	type: "document", 
	title: "Lab",
	fields: [
		defineField({
			name: "images",
			type: "array",
			title: "Images",
			of: [
				{
					type: "image",
					options: {
						hotspot: true
					}
				}
			]
		}),
	],
});
