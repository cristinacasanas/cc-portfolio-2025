import { Image } from "@/components/ui/image";
import { client, urlForOriginal } from "@/lib/sanity";
import { aboutStore } from "@/stores/about.store";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

// Constants
const CACHE_DURATION_ONE_HOUR = 60 * 60 * 1000;
const CACHE_DURATION_EIGHT_HOURS = 8 * 60 * 60 * 1000;

// Types
interface SanityImageAsset {
	_ref: string;
	_type: string;
}

interface SanityImage {
	asset: SanityImageAsset;
	_type: string;
}

interface PortableTextBlock {
	_key: string;
	_type: string;
	children: unknown[];
	markDefs: unknown[];
	style: string;
}

interface AboutData {
	_id: string;
	description: {
		fr: PortableTextBlock[];
		en: PortableTextBlock[];
	};
	image: SanityImage;
	awards: {
		url: string;
		placeholder: string;
	}[];
}

interface NetworkLink {
	title: string;
	url: string;
}

interface NetworkData {
	_id: string;
	links: NetworkLink[];
}

// Styles
const textStyles = {
	monoSmall: "font-mono text-[10px] leading-[15px]",
	monoSmallSecondary:
		"font-mono text-[10px] text-text-secondary uppercase leading-[15px]",
	monoSmallSecondaryUnderline:
		"font-mono text-[10px] text-text-secondary uppercase leading-none underline",
	serifSmall: "font-serif text-[12px] leading-tight",
	serifMedium: "font-serif text-[11px] leading-tight",
	serifNormal: "font-normal font-serif leading-none",
} as const;

// Portable Text Components
const createPortableTextComponents = (): Partial<PortableTextComponents> => ({
	block: {
		normal: ({ children }) => (
			<p className={`mb-2 ${textStyles.monoSmall}`}>{children}</p>
		),
		h1: ({ children }) => (
			<h1 className={`mb-2 ${textStyles.serifSmall}`}>{children}</h1>
		),
		h2: ({ children }) => (
			<h2 className={`mb-2 ${textStyles.serifMedium}`}>{children}</h2>
		),
	},
	marks: {
		em: ({ children }) => (
			<em className={`${textStyles.monoSmallSecondary} italic`}>{children}</em>
		),
		link: ({ value, children }) => {
			const isExternalLink = (value?.href || "").startsWith("http");
			return (
				<a
					href={value?.href}
					target={isExternalLink ? "_blank" : undefined}
					rel={isExternalLink ? "noindex nofollow" : undefined}
					className={`${textStyles.monoSmallSecondary} underline`}
				>
					{children}
				</a>
			);
		},
	},
});

// Queries
const useAboutData = () => {
	return useQuery({
		queryKey: ["about"],
		queryFn: (): Promise<AboutData[]> =>
			client.fetch(`*[_type == "about"] {
			_id,
			description,
			image,
			awards[] {
				url,
				placeholder
			}
		}`),
		staleTime: CACHE_DURATION_ONE_HOUR,
		gcTime: CACHE_DURATION_EIGHT_HOURS,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});
};

const useNetworkData = () => {
	return useQuery({
		queryKey: ["network"],
		queryFn: (): Promise<NetworkData> =>
			client.fetch(`*[_type == "network"][0] {
			_id,
			links[] {
				title,
				url
			}
		}`),
		staleTime: CACHE_DURATION_ONE_HOUR,
		gcTime: CACHE_DURATION_EIGHT_HOURS,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});
};

// Components
const PortraitSection = ({ aboutData }: { aboutData: AboutData[] }) => (
	<div className="flex w-full justify-end">
		<Image
			className="w-[80px] object-cover p-0.5 md:w-[100px]"
			src={
				aboutData?.[0]?.image
					? urlForOriginal(aboutData[0].image)
					: "/assets/image.png"
			}
			alt="Portrait de Cristina"
		/>
	</div>
);

const DescriptionSection = ({
	aboutData,
	currentLanguage,
	title,
}: {
	aboutData: AboutData[];
	currentLanguage: string;
	title: string;
}) => {
	const portableTextComponents = createPortableTextComponents();

	return (
		<div className="flex min-w-auto flex-1 flex-col items-start justify-start gap-2 md:min-w-96">
			<h2 className={textStyles.serifNormal}>{title}</h2>
			<div className="flex flex-col items-start justify-start gap-6 self-stretch pl-4">
				<div>
					{aboutData?.[0]?.description && (
						<PortableText
							value={
								aboutData[0].description[
									currentLanguage === "fr" ? "fr" : "en"
								] || aboutData[0].description.fr
							}
							components={portableTextComponents}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

const AwardsSection = ({
	aboutData,
	pressTitle,
}: {
	aboutData: AboutData[];
	pressTitle: string;
}) => (
	<div className="flex flex-col items-start justify-start gap-2">
		<h2 className={textStyles.serifNormal}>{pressTitle}</h2>
		<div className="flex flex-col gap-2 pl-4">
			<div className="justify-start">
				<Link
					className={textStyles.monoSmallSecondaryUnderline}
					to={aboutData?.[0]?.awards?.[0]?.url}
				>
					{aboutData?.[0]?.awards?.[0]?.placeholder ||
						aboutData?.[0]?.awards?.[0]?.url}
				</Link>
			</div>
		</div>
	</div>
);

const NetworkSection = ({ networkData }: { networkData: NetworkData }) => {
	const isExternalLink = (url: string) => url.startsWith("http");

	return (
		<div className="flex flex-col gap-3">
			{networkData?.links?.map((link: NetworkLink) => (
				<a
					key={link.url}
					href={link.url}
					className={textStyles.serifNormal}
					target={isExternalLink(link.url) ? "_blank" : undefined}
					rel={isExternalLink(link.url) ? "noopener noreferrer" : undefined}
				>
					↗ {link.title}
				</a>
			))}
		</div>
	);
};

export const AboutModal = () => {
	const { isOpen } = useStore(aboutStore, (state) => state);
	const { data: aboutData } = useAboutData();
	const { data: networkData } = useNetworkData();
	const { t, i18n } = useTranslation();

	const currentLanguage = i18n.language || "fr";

	// Detect old iOS devices for performance optimization
	const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
	const isOldDevice = isIOS && window.devicePixelRatio <= 2;

	// Disable body scroll when modal is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}

		// Cleanup function to restore scroll when component unmounts
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isOpen]);

	if (!isOpen) return null;

	// Simplified animations for old devices
	const animationProps = isOldDevice
		? {
				initial: { opacity: 0 },
				animate: { opacity: 1 },
				exit: { opacity: 0 },
				transition: { duration: 0.2 },
			}
		: {
				initial: { x: -100, opacity: 0 },
				animate: { x: 0, opacity: 1 },
				exit: { x: -100, opacity: 0 },
				transition: { duration: 0.3 },
			};

	return (
		<AnimatePresence>
			<motion.div
				{...animationProps}
				className="absolute top-[var(--header-height)] left-0 z-50 flex h-[calc(100dvh-var(--header-height))] w-screen flex-col overflow-y-hidden border-black bg-background-primary backdrop-blur-sm md:w-[455px] md:border-r"
			>
				<div className="flex h-full flex-col overflow-hidden">
					<div className="flex-shrink-0 px-4 pt-4 md:px-9 md:pt-14">
						<PortraitSection aboutData={aboutData || []} />
					</div>

					<div className="flex flex-1 flex-col overflow-hidden px-4 md:px-9">
						<div className="flex flex-col gap-4 py-4 md:gap-12 md:py-6">
							<DescriptionSection
								aboutData={aboutData || []}
								currentLanguage={currentLanguage}
								title={t("aboutModal.title")}
							/>

							<AwardsSection
								aboutData={aboutData || []}
								pressTitle={t("aboutModal.price")}
							/>
						</div>
					</div>

					{networkData && (
						<div className="flex-shrink-0 px-4 py-4 md:px-9 md:py-6">
							<NetworkSection networkData={networkData} />
						</div>
					)}
				</div>
			</motion.div>
		</AnimatePresence>
	);
};
