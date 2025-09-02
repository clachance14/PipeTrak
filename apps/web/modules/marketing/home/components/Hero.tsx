"use client";

import { Button } from "@ui/components/button";
import {
	ArrowRightIcon,
	HardHat,
	WifiOff,
	FileUp,
	Clock,
	ChevronDown,
} from "lucide-react";
import { useState } from "react";

interface ProofPointProps {
	icon: React.ComponentType<{ className?: string }>;
	text: string;
}

function ProofPoint({ icon: Icon, text }: ProofPointProps) {
	return (
		<div className="flex items-center justify-center gap-2 text-gray-700">
			<Icon className="h-5 w-5 text-gray-400 flex-shrink-0" />
			<span className="text-base">{text}</span>
		</div>
	);
}

interface EarlyAccessModalProps {
	isOpen: boolean;
	onClose: () => void;
}

function EarlyAccessModal({ isOpen, onClose }: EarlyAccessModalProps) {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		company: "",
		projectSize: "",
		currentMethod: "",
		role: "",
		phone: "",
		message: "",
	});

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			// Get UTM parameters from URL if available
			const urlParams = new URLSearchParams(window.location.search);
			const utmData = {
				utmSource: urlParams.get("utm_source") || undefined,
				utmMedium: urlParams.get("utm_medium") || undefined,
				utmCampaign: urlParams.get("utm_campaign") || undefined,
			};

			const response = await fetch("/api/early-access", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...formData,
					...utmData,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.error || "Failed to register for early access",
				);
			}

			const result = await response.json();
			console.log("Early access registration successful:", result);

			// Track success event (TODO: implement analytics)
			// analytics.track('Early Access Signup', { company: formData.company, projectSize: formData.projectSize });

			setSubmitted(true);

			// Auto close after success message
			setTimeout(() => {
				onClose();
				setSubmitted(false);
				// Reset form data
				setFormData({
					name: "",
					email: "",
					company: "",
					projectSize: "",
					currentMethod: "",
					role: "",
					phone: "",
					message: "",
				});
			}, 2000);
		} catch (error) {
			console.error("Early access registration error:", error);
			alert(
				error instanceof Error
					? error.message
					: "Failed to register. Please try again.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
			<div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
				{submitted ? (
					<div className="p-8 text-center">
						<div className="mb-4 mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
							<HardHat className="w-8 h-8 text-green-600" />
						</div>
						<h3 className="text-2xl font-bold text-gray-900 mb-2">
							You're On The List!
						</h3>
						<p className="text-gray-600">
							Thanks for your interest in PipeTrak. We'll be in
							touch soon with updates.
						</p>
					</div>
				) : (
					<div className="p-6">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-2xl font-bold text-gray-900">
								Join the Early Access List
							</h3>
							<button
								onClick={onClose}
								className="text-gray-400 hover:text-gray-600 text-2xl"
								aria-label="Close modal"
							>
								×
							</button>
						</div>

						<p className="text-gray-600 mb-6">
							Be among the first to simplify your piping project
							tracking
						</p>

						<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
							<h4 className="font-semibold text-yellow-900 mb-2">
								Early Access Benefits:
							</h4>
							<ul className="text-sm text-yellow-800 space-y-1">
								<li>• 30-day free trial when we launch</li>
								<li>
									• Direct input on features that matter to
									you
								</li>
								<li>• Priority onboarding support</li>
							</ul>
						</div>

						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Name *
									</label>
									<input
										type="text"
										required
										value={formData.name}
										onChange={(e) =>
											setFormData({
												...formData,
												name: e.target.value,
											})
										}
										className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Email *
									</label>
									<input
										type="email"
										required
										value={formData.email}
										onChange={(e) =>
											setFormData({
												...formData,
												email: e.target.value,
											})
										}
										className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Company *
								</label>
								<input
									type="text"
									required
									value={formData.company}
									onChange={(e) =>
										setFormData({
											...formData,
											company: e.target.value,
										})
									}
									className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Project Size *
									</label>
									<select
										required
										value={formData.projectSize}
										onChange={(e) =>
											setFormData({
												...formData,
												projectSize: e.target.value,
											})
										}
										className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
									>
										<option value="">Select...</option>
										<option value="small">
											Small (&lt;50 drawings)
										</option>
										<option value="medium">
											Medium (50-200 drawings)
										</option>
										<option value="large">
											Large (200-500 drawings)
										</option>
										<option value="enterprise">
											Enterprise (&gt;500 drawings)
										</option>
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Current Method *
									</label>
									<select
										required
										value={formData.currentMethod}
										onChange={(e) =>
											setFormData({
												...formData,
												currentMethod: e.target.value,
											})
										}
										className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
									>
										<option value="">Select...</option>
										<option value="excel">
											Excel/Spreadsheets
										</option>
										<option value="paper">
											Paper/Manual
										</option>
										<option value="other_software">
											Other Software
										</option>
										<option value="none">No System</option>
									</select>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Your Role *
								</label>
								<input
									type="text"
									required
									placeholder="e.g., Construction Manager, QC Inspector, Foreman"
									value={formData.role}
									onChange={(e) =>
										setFormData({
											...formData,
											role: e.target.value,
										})
									}
									className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Phone (Optional)
								</label>
								<input
									type="tel"
									value={formData.phone}
									onChange={(e) =>
										setFormData({
											...formData,
											phone: e.target.value,
										})
									}
									className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Biggest Tracking Challenge (Optional)
								</label>
								<textarea
									rows={3}
									value={formData.message}
									onChange={(e) =>
										setFormData({
											...formData,
											message: e.target.value,
										})
									}
									placeholder="Tell us about your current pain points..."
									className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
								/>
							</div>

							<button
								type="submit"
								disabled={isSubmitting}
								className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
							>
								{isSubmitting ? (
									<>
										<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
										Reserving...
									</>
								) : (
									<>
										<HardHat className="w-5 h-5" />
										Reserve My Spot
									</>
								)}
							</button>
						</form>

						<p className="text-xs text-gray-500 text-center mt-4">
							We'll never spam you. Unsubscribe anytime.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

export function Hero() {
	const [showEarlyAccessModal, setShowEarlyAccessModal] = useState(false);

	const scrollToFeatures = () => {
		const featuresSection = document.getElementById("features");
		if (featuresSection) {
			featuresSection.scrollIntoView({ behavior: "smooth" });
		}
	};

	return (
		<>
			<div className="relative max-w-full overflow-x-hidden bg-gradient-to-b from-white to-gray-50">
				{/* Background decoration */}
				<div className="absolute left-1/2 top-0 z-0 ml-[-500px] h-[500px] w-[1000px] rounded-full bg-gradient-to-r from-green-100 to-blue-100 opacity-30 blur-[150px]" />

				<div className="container relative z-20 px-4 pt-32 pb-16 text-center lg:pt-44 lg:pb-24">
					{/* Trust Badge */}
					<div className="mb-8 flex justify-center">
						<div className="inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-4 py-2">
							<HardHat className="h-4 w-4 text-yellow-600" />
							<span className="text-sm font-semibold text-yellow-900">
								Built by 15+ Years Field Experience
							</span>
						</div>
					</div>

					{/* Headline */}
					<h1 className="mx-auto max-w-4xl text-balance font-bold text-gray-900 text-4xl lg:text-6xl mb-6">
						Track Piping Installation, Field Welds, and More in a
						Single System
					</h1>

					{/* Subheadline */}
					<p className="mx-auto max-w-3xl text-balance text-gray-600 text-lg lg:text-xl mb-8">
						Built for the field, PipeTrak combines progress tracking
						and QC weld logs into one simple system—no more double
						spreadsheets, lost updates, or version control issues.
					</p>

					{/* CTAs */}
					<div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
						<Button
							onClick={() => setShowEarlyAccessModal(true)}
							size="lg"
							className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4 text-lg h-auto"
						>
							Get Early Access
							<ArrowRightIcon className="ml-2 h-5 w-5" />
						</Button>
						<Button
							onClick={scrollToFeatures}
							variant="outline"
							size="lg"
							className="border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-8 py-4 text-lg h-auto"
						>
							Learn More
							<ChevronDown className="ml-2 h-5 w-5" />
						</Button>
					</div>

					{/* Proof Points */}
					<div className="flex flex-col md:flex-row gap-8 justify-center items-center mb-8">
						<ProofPoint
							icon={WifiOff}
							text="Works offline in the field"
						/>
						<ProofPoint
							icon={FileUp}
							text="Import your Excel files instantly"
						/>
						<ProofPoint icon={Clock} text="Set up in 5 minutes" />
					</div>

					{/* Problem Statement */}
					<div className="mb-16">
						<p className="text-gray-600 italic max-w-2xl mx-auto text-lg">
							Two spreadsheets for progress and weld logs?
							PipeTrak combines both so you stop chasing updates
							and save time.
						</p>
					</div>

					{/* Coming Soon Badge */}
					<div className="mb-8">
						<span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-900">
							Launching Early 2025
						</span>
					</div>

					{/* Visual Element - Placeholder for now */}
					<div className="mx-auto mt-12 max-w-4xl">
						<div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-8 py-16">
							<div className="mx-auto max-w-md text-center">
								<div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
									<HardHat className="h-10 w-10 text-green-600" />
								</div>
								<h3 className="mb-2 text-lg font-semibold text-gray-900">
									Built for Construction Professionals
								</h3>
								<p className="text-gray-600">
									Visual mockups and demo coming soon. Built
									by field professionals who understand the
									challenges of managing piping projects.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Early Access Modal */}
			<EarlyAccessModal
				isOpen={showEarlyAccessModal}
				onClose={() => setShowEarlyAccessModal(false)}
			/>
		</>
	);
}
