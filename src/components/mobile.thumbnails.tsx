import { collection } from "@/mock/collection";
import { Thumbnail } from "./ui/thumbnail";

export const MobileThumbnails = () => {
	return (
		<div className="sticky mt-2 inline-flex w-screen items-start gap-1.5 self-stretch pr-3 md:hidden">
			{collection.slice(0, 8).map((item) => (
				<Thumbnail className="min-h-[50px] w-full" key={item.id} item={item} />
			))}
		</div>
	);
};
