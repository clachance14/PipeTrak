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

export function Hero() {
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
							disabled
							size="lg"
							className="bg-gray-400 text-white font-semibold px-8 py-4 text-lg h-auto cursor-not-allowed"
						>
							Coming Early 2025
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

		</>
	);
}