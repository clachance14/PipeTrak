import { joinURL } from "ufo";

export function getAdminPath(path: string) {
	return joinURL("/app/admin", path);
}
