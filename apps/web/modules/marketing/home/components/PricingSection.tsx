"use client";
import { config } from "@repo/config";
import { useCreateCheckoutLinkMutation } from "@saas/payments/lib/api";
import { useProductInformation } from "@shared/hooks/product-information";
import { Button } from "@ui/components/button";
import { Tabs, TabsList, TabsTrigger } from "@ui/components/tabs";
import { cn } from "@ui/lib";
import { CheckIcon, StarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

const { products } = config.payments;

export function PricingSection({
	className,
	activeOrganizationId,
}: {
	className?: string;
	activeOrganizationId?: string;
}) {
	const t = useTranslations();
	const [interval, setInterval] = useState<"month" | "year">("month");
	const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

	const createCheckoutLinkMutation = useCreateCheckoutLinkMutation();

	const productInformation = useProductInformation();

	const sortedProducts = config.payments.products.sort((a, b) => {
		return a.price - b.price;
	});

	const hasSubscriptions = sortedProducts.some(
		(product) => product.type === "subscription",
	);

	const filteredProducts = sortedProducts.filter(
		(product) => !("interval" in product) || product.interval === interval,
	);

	const onSelectPlan = async (productId: string) => {
		try {
			const { checkoutLink } = await createCheckoutLinkMutation.mutateAsync({
				type:
					products.find((product) => product.productId === productId)?.type ===
					"one-time"
						? "one-time"
						: "subscription",
				productId,
				organizationId: activeOrganizationId,
				redirectUrl: window.location.href,
			});

			window.location.href = checkoutLink;
		} catch {}
	};

	return (
		<section id="pricing" className="scroll-mt-16 py-12 lg:py-16">
			<div className="container">
				<div className="mb-6 text-center">
					<h1 className="font-bold text-4xl lg:text-5xl">
						{t("pricing.title")}
					</h1>
					<p className="mt-3 text-lg opacity-50">{t("pricing.description")}</p>
				</div>

				<div className="mx-auto max-w-5xl">
					<div className={cn("@container", className)}>
						{hasSubscriptions && (
							<div className="mb-6 flex justify-center">
								<Tabs
									value={interval}
									onValueChange={(value) =>
										setInterval(value as typeof interval)
									}
									data-test="price-table-interval-tabs"
								>
									<TabsList className="border-foreground/10">
										<TabsTrigger value="month">
											{t("pricing.monthly")}
										</TabsTrigger>
										<TabsTrigger value="year">
											{t("pricing.yearly")}
										</TabsTrigger>
									</TabsList>
								</Tabs>
							</div>
						)}

						<div className="grid @xl:grid-cols-3 gap-4">
							{filteredProducts.map((product) => {
								const { title, description, features, recommended } =
									productInformation[product.referenceId];

								return (
									<div
										key={product.referenceId}
										className={cn("rounded-xl border bg-card p-6", {
											"border-2 border-primary": recommended,
										})}
										data-test="price-table-plan"
									>
										<div className="flex h-full flex-col justify-between gap-4">
											<div>
												{recommended && (
													<div className="-mt-9 flex justify-center">
														<div className="mb-2 flex h-6 w-auto items-center gap-1.5 rounded-full bg-primary px-2 py-1 font-semibold text-primary-foreground text-xs">
															<StarIcon className="size-3" />
															{t("pricing.recommended")}
														</div>
													</div>
												)}
												<h3
													className={cn("mb-4 font-semibold text-2xl", {
														"font-bold text-primary": recommended,
													})}
												>
													{title}
												</h3>
												{description && (
													<div className="prose mb-2 text-foreground/60 text-sm">
														{description}
													</div>
												)}

												{!!features?.length && (
													<ul className="mt-4 grid list-none gap-2 text-sm">
														{features.map((feature, key) => (
															<li
																key={key}
																className="flex items-center justify-start"
															>
																<CheckIcon className="mr-2 size-4 text-primary" />
																<span>{feature}</span>
															</li>
														))}
													</ul>
												)}
											</div>

											<div>
												<strong
													className="block font-semibold text-xl"
													data-test="price-table-plan-price"
												>
													{Intl.NumberFormat("en-US", {
														style: "currency",
														currency: product.currency,
													}).format(product.price)}
													{"interval" in product && (
														<span className="font-normal text-xs opacity-60">
															{" / "}
															{interval === "month"
																? t("pricing.monthly")
																: t("pricing.yearly")}
														</span>
													)}
												</strong>

												<Button
													loading={selectedPlan === product.referenceId}
													className="mt-4 w-full"
													variant={recommended ? "primary" : "secondary"}
													onClick={async () => {
														setSelectedPlan(product.referenceId);
														await onSelectPlan(product.productId);
														setSelectedPlan(null);
													}}
												>
													{product.type === "one-time"
														? t("pricing.purchase")
														: t("pricing.subscribe")}
												</Button>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
