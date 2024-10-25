"use client";

import { config } from "@repo/config";
import { useOrganization } from "@saas/organizations/hooks/use-organization";
import { usePurchasesQuery } from "@saas/payments/lib/api";
import { ActionBlock } from "@saas/shared/components/ActionBlock";
import { useProductInformation } from "@shared/hooks/product-information";
import { CheckIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { CancelSubscriptionButton } from "./CancelSubscriptionButton";
import { CustomerPortalButton } from "./CustomerPortalButton";
import { SubscriptionStatusBadge } from "./SubscriptionStatusBadge";

export function PurchasesOverview({
	className,
}: {
	className?: string;
}) {
	const format = useFormatter();
	const t = useTranslations();
	const productInformation = useProductInformation();
	const { activeOrganization, loaded } = useOrganization();

	const { data: purchases } = usePurchasesQuery(activeOrganization?.id, {
		enabled: loaded,
	});

	const subscriptions = purchases?.filter(
		(purchase) => purchase.type === "SUBSCRIPTION",
	);
	const oneTimePurchases = purchases?.filter(
		(purchase) => purchase.type === "ONE_TIME",
	);

	return (
		<div className="grid grid-cols-1">
			{[
				{
					title: "Your subscriptions",
					purchases: subscriptions,
				},
				{
					title: "Purchases",
					purchases: oneTimePurchases,
				},
			].map(({ title, purchases }) => {
				if (!purchases?.length) {
					return null;
				}

				return (
					<ActionBlock key={title} title={title} className={className}>
						{purchases?.map((purchase) => {
							const purchaseProduct = config.payments.products.find(
								(product) => product.productId === purchase.productId,
							);

							if (!purchaseProduct) {
								return null;
							}

							const purchaseProductInformation =
								productInformation[purchaseProduct.referenceId];

							return (
								<div key={purchase.id} className="rounded-lg border p-4">
									<div className="">
										<div className="flex items-center gap-2">
											<h4 className="font-bold text-lg text-primary">
												<span>{purchaseProductInformation.title} </span>
												<small className="font-normal">
													(
													{format.number(purchaseProduct.price, {
														style: "currency",
														currency: purchaseProduct.currency,
													})}
													{"interval" in purchaseProduct
														? ` / ${t(
																`settings.billing.subscription.${purchaseProduct.interval}` as never,
															)}`
														: ""}
													)
												</small>
											</h4>
											{purchase.status && (
												<SubscriptionStatusBadge status={purchase.status} />
											)}
										</div>

										{!!purchaseProductInformation.features?.length && (
											<ul className="mt-2 grid list-none gap-2 text-sm">
												{purchaseProductInformation.features.map(
													(feature, key) => (
														<li
															key={key}
															className="flex items-center justify-start"
														>
															<CheckIcon className="mr-2 size-4 text-primary" />
															<span>{feature}</span>
														</li>
													),
												)}
											</ul>
										)}
									</div>

									{purchaseProduct.type === "subscription" && (
										<div className="mt-4 flex justify-end">
											<div className="flex w-full flex-col gap-3 md:flex-row">
												<CustomerPortalButton purchaseId={purchase.id} />
												<CancelSubscriptionButton
													purchaseId={purchase.id}
													label={t("settings.billing.subscription.cancel")}
												/>
											</div>
										</div>
									)}
								</div>
							);
						})}
					</ActionBlock>
				);
			})}
		</div>
	);
}
