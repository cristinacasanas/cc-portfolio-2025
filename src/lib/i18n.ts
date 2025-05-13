import i18n from "i18next";

/**
 * Get localized content from Sanity
 *
 * @param documents Array of documents from Sanity with a language field
 * @param language Language code (e.g., 'en', 'fr')
 * @returns Array of documents filtered by language
 */
export const getLocalizedDocuments = <T extends { language?: string }>(
	documents: T[],
	language = i18n.language,
): T[] => {
	// Default to current i18n language if not provided
	const lang = language.substring(0, 2); // Extract base language code (e.g., 'en' from 'en-US')

	// Filter documents by language
	return documents.filter((doc) => doc.language === lang);
};

/**
 * Get a single localized document from Sanity
 *
 * @param documents Array of documents from Sanity with a language field
 * @param language Language code (e.g., 'en', 'fr')
 * @returns The first document matching the language or undefined
 */
export const getLocalizedDocument = <T extends { language?: string }>(
	documents: T[],
	language = i18n.language,
): T | undefined => {
	return getLocalizedDocuments(documents, language)[0];
};

/**
 * Choose between two content versions based on current language
 *
 * @param frContent Content in French
 * @param enContent Content in English
 * @returns The content in the current language
 */
export const getLocalizedContent = <T>(
	frContent: T,
	enContent: T,
	language = i18n.language,
): T => {
	return language.startsWith("fr") ? frContent : enContent;
};
