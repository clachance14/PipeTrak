import { atom, useAtom } from "jotai";
import Cookies from "js-cookie";

export const consentAtom = atom(Cookies.get("consent") === "true");

export function useCookieConsent() {
	const [userHasConsented, setUserHasConsented] = useAtom(consentAtom);

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
