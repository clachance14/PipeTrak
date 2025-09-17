import { redirect } from "next/navigation";

export default function AccountSettingsIndex() {
	redirect("/app/settings/general");
}
