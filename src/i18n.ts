import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

// Initialize i18next
i18n
	// Detect user language
	.use(LanguageDetector)
	// Pass the i18n instance to react-i18next
	.use(initReactI18next)
	// Initialize i18next
	.init({
		// Default language
		fallbackLng: "fr",
		// Supported languages
		supportedLngs: ["fr", "en"],
		// Don't use a key if a translation is missing
		saveMissing: false,
		// Debug mode
		debug: import.meta.env.DEV,
		// Namespace
		defaultNS: "common",
		// Interpolation configuration
		interpolation: {
			escapeValue: false, // React already escapes values
		},
		// Detection options
		detection: {
			order: ["path", "navigator", "htmlTag"],
			lookupFromPathIndex: 0,
			// Convert all detected languages to lowercase
			convertDetectedLanguage: (lng) => lng.toLowerCase(),
		},
		// Resources - we'll load them dynamically
		resources: {
			fr: {
				common: {
					about: "À Propos",
					close: "X Fermer",
					lab: "LAB",
					language: "Langue",
					projects: "Projets",
					aboutModal: {
						title: "À Propos",
						awards: "Prix",
					},
				},
				lab: {
					transition: {
						text1: "C'est mon terrain de jeu",
						text2: "là où je teste, je cherche, je rate et je recommence.",
					},
				},
			},
			en: {
				common: {
					about: "About",
					close: "X Close",
					lab: "LAB",
					language: "Language",
					projects: "Projects",
					aboutModal: {
						title: "About",
						awards: "Awards",
					},
				},
				lab: {
					transition: {
						text1: "This is my playground",
						text2: "where I test, explore, fail, and try again.",
					},
				},
			},
		},
	});

export default i18n;
