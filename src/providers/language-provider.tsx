import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface LanguageParamProviderProps {
	children: ReactNode;
}

/**
 * Component that ensures the language parameter is always present in the URL
 */
export const LanguageParamProvider = ({
	children,
}: LanguageParamProviderProps) => {
	const router = useRouter();
	const { i18n } = useTranslation();

	useEffect(() => {
		const checkAndFixUrl = () => {
			const url = new URL(window.location.href);
			const searchParams = url.searchParams;
			const langParam = searchParams.get("lang");
			const currentLang = i18n.language.startsWith("en") ? "en" : "fr";

			if (!langParam || (langParam !== "fr" && langParam !== "en")) {
				const newUrl = new URL(window.location.href);
				const oldParams = Array.from(newUrl.searchParams.entries());

				newUrl.search = "";

				newUrl.searchParams.set("lang", currentLang);

				for (const [key, value] of oldParams) {
					if (key !== "lang") {
						newUrl.searchParams.append(key, value);
					}
				}

				window.history.replaceState({}, "", newUrl.toString());

				i18n.changeLanguage(currentLang);
			} else if (langParam !== currentLang) {
				i18n.changeLanguage(langParam);
			}

			const urlString = window.location.href;
			const queryStart = urlString.indexOf("?");

			if (queryStart !== -1) {
				const queryString = urlString.substring(queryStart + 1);
				if (!queryString.startsWith("lang=")) {
					const newUrl = new URL(window.location.href);
					const oldParams = Array.from(newUrl.searchParams.entries());

					newUrl.search = "";

					const safeLanguage = langParam || currentLang;
					newUrl.searchParams.set("lang", safeLanguage);

					for (const [key, value] of oldParams) {
						if (key !== "lang") {
							newUrl.searchParams.append(key, value);
						}
					}

					window.history.replaceState({}, "", newUrl.toString());
				}
			}
		};

		checkAndFixUrl();

		const handleUrlChange = () => {
			checkAndFixUrl();
		};

		window.addEventListener("popstate", handleUrlChange);

		const unsubscribe = router.subscribe("onBeforeLoad", () => {
			setTimeout(checkAndFixUrl, 0);
		});

		return () => {
			window.removeEventListener("popstate", handleUrlChange);
			unsubscribe();
		};
	}, [router, i18n]);

	return <>{children}</>;
};
