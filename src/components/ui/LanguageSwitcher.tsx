import { useNavigate, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const LanguageSwitcher = () => {
	const { i18n } = useTranslation();
	const router = useRouter();
	const navigate = useNavigate();
	const currentLang = i18n.language;

	const changeLanguage = (lng: string) => {
		i18n.changeLanguage(lng);

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

	return (
		<button
			type="button"
			onClick={() => changeLanguage(currentLang === "fr" ? "en" : "fr")}
			className="cursor-pointer justify-start font-mono text-xs md:justify-start md:text-sm"
		>
			{currentLang === "fr" ? "[FR]" : "[EN]"}
		</button>
	);
};
