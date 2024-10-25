import type { config } from "@repo/config";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

type ProductReferenceId =
	(typeof config)["payments"]["products"][number]["referenceId"];

export function useProductInformation() {
	const t = useTranslations();
	const productInformation: Record<
		ProductReferenceId,
		{
			title: string;
			description: ReactNode;
			features: ReactNode[];
			recommended?: boolean;
		}
	> = {
		basic: {
			title: t("pricing.products.basic.title"),
			description: t("pricing.products.basic.description"),
			features: [
				t("pricing.products.basic.features.oneMember"),
				t("pricing.products.basic.features.anotherFeature"),
				t("pricing.products.basic.features.limitedSupport"),
			],
		},
		pro: {
			title: t("pricing.products.pro.title"),
			description: t("pricing.products.pro.description"),
			features: [
				t("pricing.products.pro.features.fiveMembers"),
				t("pricing.products.pro.features.anotherFeature"),
				t("pricing.products.pro.features.fullSupport"),
			],
			recommended: true,
		},
		lifetime: {
			title: t("pricing.products.lifetime.title"),
			description: t("pricing.products.lifetime.description"),
			features: [
				t("pricing.products.lifetime.features.unlimitedMembers"),
				t("pricing.products.lifetime.features.noRecurringCosts"),
				t("pricing.products.lifetime.features.extendSupport"),
			],
		},
	};

	return productInformation;
}
