import { getLabImagesQuery } from "@/lib/queries/lab";
import { client } from "@/lib/sanity";
import { useQuery } from "@tanstack/react-query";

interface LabImage {
	asset: {
		_id: string;
		url: string;
		metadata: {
			dimensions: {
				width: number;
				height: number;
				aspectRatio: number;
			};
		};
	};
}

interface LabImagesResponse {
	images: LabImage[];
}

export const useLabImages = () => {
	return useQuery({
		queryKey: ["lab-images"],
		queryFn: async () => {
			const data = await client.fetch<LabImagesResponse>(getLabImagesQuery);
			return data?.images || [];
		},
	});
};
