import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@ui/components/accordion";
import { cn } from "@ui/lib";
import { useTranslations } from "next-intl";

export function FaqSection({ className }: { className?: string }) {
	const t = useTranslations();

	const items = [
		{
			question: "What is the refund policy?",
			answer:
				"We offer a 30-day money-back guarantee if you're not happy with our product.",
		},
		{
			question: "How do I cancel my subscription?",
			answer: "You can cancel your subscription by visiting the billing page.",
		},
		{
			question: "Can I change my plan?",
			answer:
				"Yes, you can change your plan at any time by visiting the billing page.",
		},
		{
			question: "Do you offer a free trial?",
			answer: "Yes, we offer a 14-day free trial.",
		},
	];

	if (!items) {
		return null;
	}

	return (
		<section className={cn("border-t py-12 lg:py-16", className)} id="faq">
			<div className="container max-w-5xl">
				<div className="mb-12 text-center">
					<h1 className="mb-2 font-bold text-3xl lg:text-4xl">
						{t("faq.title")}
					</h1>
					<p className="text-lg opacity-50">{t("faq.description")}</p>
				</div>
				<Accordion type="single" collapsible className="flex flex-col gap-3">
					{items.map((item, i) => (
						<AccordionItem
							key={i}
							value={`faq-item-${i}`}
							className="rounded-xl border bg-card px-6 py-4"
						>
							<AccordionTrigger className="py-2 text-lg">
								{item.question}
							</AccordionTrigger>
							<AccordionContent className="">{item.answer}</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>
		</section>
	);
}
