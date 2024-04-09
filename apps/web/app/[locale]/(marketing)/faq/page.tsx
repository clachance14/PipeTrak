import { FaqSection } from "@marketing/faq/components/FaqSection";
import { getTranslations } from "next-intl/server";

export default async function FAQPage() {
  const t = await getTranslations();

  return (
    <div className="container max-w-3xl">
      <div className="mb-12 pt-8 text-center">
        <h1 className="mb-2 text-5xl font-bold">{t("faq.title")}</h1>
        <p className="text-lg opacity-50">{t("faq.description")}</p>
      </div>
      <FaqSection
        items={[
          {
            question: "What is the refund policy?",
            answer:
              "We offer a 30-day money-back guarantee if you're not happy with our product.",
          },
          {
            question: "How do I cancel my subscription?",
            answer:
              "You can cancel your subscription by visiting the billing page.",
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
        ]}
      />
    </div>
  );
}
