import { redirect } from "next/navigation";

// Root page that redirects to locale-based home page
export default function RootPage() {
	// Redirect to English locale home page
	redirect("/en");
}
