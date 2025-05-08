import { useTranslation } from "react-i18next";

export const useLanguage = () => {
	const { i18n } = useTranslation();

	// Get the current language
	const currentLanguage = i18n.language;

	// Function to get content based on current language
	const getLocalizedContent = <T>(frContent: T, enContent: T): T => {
		return currentLanguage.startsWith("fr") ? frContent : enContent;
	};

	return {
		currentLanguage,
		getLocalizedContent,
		isEnglish: currentLanguage.startsWith("en"),
		isFrench: currentLanguage.startsWith("fr"),
	};
};
