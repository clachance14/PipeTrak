import type { ReactNode } from "react";
import { cn } from "@ui/lib";

interface PrintLayoutProps {
	children: ReactNode;
	orientation?: "portrait" | "landscape";
	paperSize?: "a4" | "letter";
	includeHeader?: boolean;
	includeFooter?: boolean;
	title?: string;
	projectInfo?: {
		jobNumber: string;
		jobName: string;
		organization: string;
	};
	className?: string;
}

/**
 * Print-optimized wrapper component
 * Handles page layout, headers, footers, and print-specific styling
 */
export function PrintLayout({
	children,
	orientation = "landscape",
	paperSize = "a4",
	includeHeader = true,
	includeFooter = true,
	title,
	projectInfo,
	className,
}: PrintLayoutProps) {
	const printStyles = {
		portrait: {
			a4: "print:w-[210mm] print:h-[297mm]",
			letter: "print:w-[8.5in] print:h-[11in]",
		},
		landscape: {
			a4: "print:w-[297mm] print:h-[210mm]",
			letter: "print:w-[11in] print:h-[8.5in]",
		},
	};

	return (
		<>
			{/* Print Styles */}
			<style jsx global>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body {
            margin: 0;
            padding: 0;
            background: white !important;
            color: black !important;
            font-size: 12px;
            line-height: 1.4;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-only {
            display: block !important;
          }
          
          .print-break-before {
            page-break-before: always;
          }
          
          .print-break-after {
            page-break-after: always;
          }
          
          .print-break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .print-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 60px;
            padding: 10px 20px;
            background: white;
            border-bottom: 2px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
            font-weight: 600;
          }
          
          .print-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 40px;
            padding: 10px 20px;
            background: white;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            color: #6b7280;
          }
          
          .print-content {
            margin-top: ${includeHeader ? "70px" : "0"};
            margin-bottom: ${includeFooter ? "50px" : "0"};
            padding: 20px;
          }
          
          @page {
            size: ${paperSize} ${orientation};
            margin: 0.5in;
          }
          
          /* Chart and table optimizations for print */
          .recharts-wrapper {
            background: white !important;
          }
          
          .recharts-cartesian-grid line {
            stroke: #e5e7eb !important;
          }
          
          table {
            border-collapse: collapse;
            width: 100%;
            background: white !important;
          }
          
          th, td {
            border: 1px solid #d1d5db !important;
            padding: 8px !important;
            background: white !important;
            color: black !important;
          }
          
          th {
            background: #f3f4f6 !important;
            font-weight: 600 !important;
          }
          
          /* Hide interactive elements */
          button:not(.print-keep),
          .dropdown-menu,
          .tooltip,
          [role="tooltip"],
          .popover {
            display: none !important;
          }
          
          /* Ensure cards and components print well */
          .card {
            border: 1px solid #e5e7eb !important;
            box-shadow: none !important;
            background: white !important;
            break-inside: avoid;
          }
        }
        
        @media screen {
          .print-only {
            display: none;
          }
        }
      `}</style>

			<div
				className={cn(
					"print:bg-white",
					printStyles[orientation][paperSize],
					className,
				)}
			>
				{/* Print Header */}
				{includeHeader && (
					<div className="print-header hidden">
						<div>
							<div className="text-lg font-bold">
								{title || "PipeTrak Report"}
							</div>
							{projectInfo && (
								<div className="text-sm text-gray-600">
									{projectInfo.jobNumber} -{" "}
									{projectInfo.jobName}
								</div>
							)}
						</div>
						<div className="text-right text-sm">
							<div>{projectInfo?.organization}</div>
							<div suppressHydrationWarning>
								{new Date().toLocaleDateString()}
							</div>
						</div>
					</div>
				)}

				{/* Main Content */}
				<div className="print-content">{children}</div>

				{/* Print Footer */}
				{includeFooter && (
					<div className="print-footer hidden">
						<div suppressHydrationWarning>
							Generated by PipeTrak on{" "}
							{new Date().toLocaleDateString()} at{" "}
							{new Date().toLocaleTimeString()}
						</div>
						<div>
							Page <span className="page-number" /> of{" "}
							<span className="page-count" />
						</div>
					</div>
				)}
			</div>

			{/* Print-only page numbering script */}
			<script
				dangerouslySetInnerHTML={{
					__html: `
            if (typeof window !== 'undefined') {
              window.addEventListener('beforeprint', function() {
                // Add page numbers when printing
                const pageNumbers = document.querySelectorAll('.page-number');
                const pageCounts = document.querySelectorAll('.page-count');
                
                pageNumbers.forEach((el, index) => {
                  el.textContent = index + 1;
                });
                
                // Estimate page count (rough calculation)
                const contentHeight = document.querySelector('.print-content')?.scrollHeight || 0;
                const pageHeight = ${paperSize === "a4" ? (orientation === "portrait" ? "1056" : "743") : orientation === "portrait" ? "1056" : "816"};
                const estimatedPages = Math.ceil(contentHeight / pageHeight);
                
                pageCounts.forEach(el => {
                  el.textContent = estimatedPages;
                });
              });
            }
          `,
				}}
			/>
		</>
	);
}
