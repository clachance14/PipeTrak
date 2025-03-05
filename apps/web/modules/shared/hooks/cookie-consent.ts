import Cookies from "js-cookie";
import { useState } from "react";

export function useCookieConsent() {
	console.log("useCookieConsent");
	const [userHasConsented, setUserHasConsented] = useState(
		() => Cookies.get("consent") === "true",
	);

	const allowCookies = () => {
		console.log("allowCookies");
		Cookies.set("consent", "true", { expires: 30 });
		setUserHasConsented(true);
	};

	const declineCookies = () => {
		console.log("declineCookies");
		Cookies.set("consent", "false", { expires: 30 });
		setUserHasConsented(false);
	};

	return { userHasConsented, allowCookies, declineCookies };
}
