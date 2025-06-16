import { useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export const LanguageSwitcher = () => {
	const { i18n } = useTranslation();
	const router = useRouter();
	const navigate = useNavigate();
	const currentLang = i18n.language;

	// Ensure URL query param is in sync with current language on component mount
	useEffect(() => {
		const queryLang = router.state.location.search.lang;
		if (
			queryLang !== currentLang &&
			(currentLang === "en" || currentLang === "fr")
		) {
			updateUrlQueryParam(currentLang);
		}
	}, []);

	const updateUrlQueryParam = (lng: string) => {
		const currentPath = router.state.location.pathname;
		const currentSearch = { ...router.state.location.search };

		const newSearch: Record<string, string> = { lang: lng };

		for (const [key, value] of Object.entries(currentSearch)) {
			if (key !== "lang" && value !== undefined) {
				newSearch[key] = value;
			}
		}

		navigate({
			to: currentPath,
			search: newSearch,
			replace: true,
		});
	};

	const changeLanguage = (lng: string) => {
		// Change the language in i18next (this will persist in localStorage/cookie)
		i18n.changeLanguage(lng);

		// Update URL query param to reflect language change
		updateUrlQueryParam(lng);
	};

	return (
		<button
			type="button"
			onClick={() => changeLanguage(currentLang === "fr" ? "en" : "fr")}
			className="cursor-pointer justify-start font-mono text-[10px] md:justify-start"
		>
			{currentLang === "fr" ? "[FR]" : "[EN]"}
		</button>
	);
};
