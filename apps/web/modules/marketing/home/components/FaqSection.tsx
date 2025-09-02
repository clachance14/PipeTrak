import { cn } from "@ui/lib";
import { useTranslations } from "next-intl";

export function FaqSection({ className }: { className?: string }) {
	const t = useTranslations();

	const items = [
		{
			question: "Does PipeTrak work offline?",
			answer: "Yes. Crews can log installs and inspections without connectivity. Changes sync automatically when back online.",
		},
		{
			question: "Can I import my existing Excel files?",
			answer: "Absolutely. Drag-and-drop your spreadsheets, map columns, validate issues, and import in minutes.",
		},
		{
			question: "What does early access include?",
			answer: "Early access includes a 30‑day free trial at launch and the chance to shape features with direct feedback.",
		},
		{
			question: "When is PipeTrak launching?",
			answer: "We're aiming for early 2025. Join the early access list to get updates.",
		},
	];

	if (!items) {
		return null;
	}

	return (
		<section
			className={cn("scroll-mt-20 border-t py-12 lg:py-16", className)}
			id="faq"
		>
			<div className="container max-w-5xl">
				<div className="mb-12 lg:text-center">
					<h1 className="mb-2 font-bold text-4xl lg:text-5xl">
						{t("faq.title")}
					</h1>
					<p className="text-lg opacity-50">{t("faq.description")}</p>
				</div>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{items.map((item, i) => (
						<div
							key={`faq-item-${i}`}
							className="rounded-lg bg-card border p-4 lg:p-6"
						>
							<h4 className="mb-2 font-semibold text-lg">
								{item.question}
							</h4>
							<p className="text-foreground/60">{item.answer}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
