import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export const TransitionView = () => {
	const { t } = useTranslation("lab");
	const text1 = t("transition.text1");
	const text2 = t("transition.text2");

	const letterVariants = {
		hidden: {
			opacity: 0,
			y: 20,
		},
		visible: (i: number) => ({
			opacity: 1,
			y: 0,
			transition: {
				delay: i * 0.03,
				duration: 0.2,
				ease: "easeInOut",
			},
		}),
	};

	// Fonction pour diviser le texte en mots, puis en lettres
	const splitTextByWords = (text: string, startIndex = 0) => {
		const words = text.split(" ");
		let globalIndex = startIndex;

		return words.map((word, wordIndex) => {
			const letters = word.split("").map((char) => {
				const letterElement = (
					<motion.span
						key={`${text}-${globalIndex}`}
						custom={globalIndex}
						variants={letterVariants}
						initial="hidden"
						animate="visible"
						className="inline-block"
					>
						{char}
					</motion.span>
				);
				globalIndex++;
				return letterElement;
			});

			return (
				<span key={`word-${word}`} className="inline-block whitespace-nowrap">
					{letters}
					{wordIndex < words.length - 1 && (
						<motion.span
							key={`space-${globalIndex}`}
							custom={globalIndex++}
							variants={letterVariants}
							initial="hidden"
							animate="visible"
							className="inline-block"
						>
							&nbsp;
						</motion.span>
					)}
				</span>
			);
		});
	};

	return (
		<div className="w-full max-w-[1060px] flex-1 px-12 pt-12 text-center">
			<p className="mb-2 font-medium font-serif text-[32px] uppercase leading-[40px] md:text-[56px] md:leading-[70px]">
				{splitTextByWords(text1, 0)}
			</p>

			<p className="font-light font-serif text-[32px] uppercase leading-[40px] md:text-[56px] md:leading-[70px]">
				{splitTextByWords(text2, text1.length)}
			</p>
		</div>
	);
};
