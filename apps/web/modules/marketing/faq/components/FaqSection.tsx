import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@ui/components/accordion";
import type { FAQ } from "../types";

export function FaqSection({
  items,
  className,
}: {
  items: FAQ[];
  className?: string;
}) {
  if (!items) {
    return null;
  }

  return (
    <section className={className} id="faq">
      <Accordion type="single" collapsible className="flex flex-col gap-3">
        {items.map((item, i) => (
          <AccordionItem
            key={i}
            value={`faq-item-${i}`}
            className="rounded-lg border px-6 py-4"
          >
            <AccordionTrigger className="py-2 text-lg">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="">{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
