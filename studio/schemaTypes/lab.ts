import { defineType, defineField } from "sanity";
import { orderRankField } from "@sanity/orderable-document-list";

export default defineType({
	name: "lab",
	type: "document", 
	title: "Lab",
	fields: [
		orderRankField({ type: "lab" }),
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
