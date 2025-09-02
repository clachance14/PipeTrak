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
            color-adjust: exact !important;
          }
          
          html {
            font-size: 12px;
          }
          
          body {
            margin: 0;
            padding: 0;
            background: white !important;
            color: black !important;
            font-family: 'Times New Roman', serif !important;
            font-size: 11px;
            line-height: 1.4;
            -webkit-font-smoothing: antialiased;
          }
          
          /* Typography hierarchy for print */
          h1 {
            font-family: 'Arial', sans-serif !important;
            font-size: 18px !important;
            font-weight: bold !important;
            margin: 0 0 12px 0 !important;
            color: #000 !important;
          }
          
          h2 {
            font-family: 'Arial', sans-serif !important;
            font-size: 14px !important;
            font-weight: bold !important;
            margin: 16px 0 8px 0 !important;
            color: #000 !important;
          }
          
          h3 {
            font-family: 'Arial', sans-serif !important;
            font-size: 12px !important;
            font-weight: bold !important;
            margin: 12px 0 6px 0 !important;
            color: #000 !important;
          }
          
          p {
            margin: 4px 0 !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-only {
            display: block !important;
          }
          
          .print-break-before {
            page-break-before: always;
            break-before: always;
          }
          
          .print-break-after {
            page-break-after: always;
            break-after: always;
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
            height: 65px;
            padding: 12px 20px;
            background: white !important;
            border-bottom: 2px solid #000 !important;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-family: 'Arial', sans-serif !important;
            font-size: 12px;
            font-weight: 600;
            z-index: 1000;
          }
          
          .print-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 40px;
            padding: 8px 20px;
            background: white !important;
            border-top: 1px solid #666 !important;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-family: 'Arial', sans-serif !important;
            font-size: 9px;
            color: #666 !important;
            z-index: 1000;
          }
          
          .print-content {
            margin-top: ${includeHeader ? "75px" : "0"};
            margin-bottom: ${includeFooter ? "50px" : "0"};
            padding: 15px;
            font-family: 'Times New Roman', serif !important;
          }
          
          @page {
            size: ${paperSize} ${orientation};
            margin: 0.6in 0.5in;
          }
          
          /* Enhanced table styling for reports */
          table {
            border-collapse: collapse !important;
            width: 100% !important;
            background: white !important;
            font-family: 'Arial', sans-serif !important;
            margin: 8px 0 16px 0 !important;
          }
          
          th {
            border: 2px solid #000 !important;
            padding: 6px 4px !important;
            background: #f0f0f0 !important;
            color: #000 !important;
            font-weight: bold !important;
            font-size: 10px !important;
            text-align: center !important;
            vertical-align: middle !important;
          }
          
          td {
            border: 1px solid #666 !important;
            padding: 4px !important;
            background: white !important;
            color: #000 !important;
            font-size: 10px !important;
            vertical-align: middle !important;
          }
          
          /* Alternating row colors for better readability */
          tbody tr:nth-child(even) td {
            background: #fafafa !important;
          }
          
          /* Badge and status indicators */
          .badge {
            border: 1px solid #000 !important;
            padding: 2px 6px !important;
            background: white !important;
            color: #000 !important;
            font-weight: bold !important;
            font-size: 9px !important;
          }
          
          /* Progress indicators and colors */
          .text-green-600, .text-green-700, .text-green-800 {
            color: #000 !important;
            font-weight: bold !important;
          }
          
          .text-red-600, .text-red-700, .text-red-800 {
            color: #000 !important;
            font-weight: bold !important;
          }
          
          .text-blue-600, .text-purple-600 {
            color: #000 !important;
            font-weight: bold !important;
          }
          
          .text-yellow-600, .text-yellow-700, .text-yellow-800 {
            color: #000 !important;
            font-weight: bold !important;
          }
          
          .text-gray-600, .text-gray-700, .text-gray-800 {
            color: #666 !important;
          }
          
          /* Background colors for print */
          .bg-gray-50, .bg-gray-100 {
            background: #fafafa !important;
            border: 1px solid #e0e0e0 !important;
          }
          
          .bg-gray-200 {
            background: #f0f0f0 !important;
          }
          
          .bg-green-50 {
            background: #f8f8f8 !important;
            border: 1px solid #ccc !important;
          }
          
          .bg-yellow-50 {
            background: #f8f8f8 !important;
            border: 1px solid #ccc !important;
          }
          
          /* Charts and visualizations */
          .recharts-wrapper {
            background: white !important;
            border: 1px solid #ccc !important;
          }
          
          .recharts-cartesian-grid line {
            stroke: #ccc !important;
            stroke-width: 0.5px !important;
          }
          
          /* Hide interactive elements */
          button:not(.print-keep),
          .dropdown-menu,
          .tooltip,
          [role="tooltip"],
          .popover,
          .animate-spin,
          [data-state="open"],
          .cursor-pointer {
            display: none !important;
          }
          
          /* Card containers */
          .card {
            border: 1px solid #ccc !important;
            box-shadow: none !important;
            background: white !important;
            break-inside: avoid;
            margin: 8px 0 !important;
          }
          
          /* Executive summary boxes */
          .grid {
            display: grid !important;
            gap: 12px !important;
          }
          
          /* Rounded corners removal for clean print */
          .rounded, .rounded-lg, .rounded-md {
            border-radius: 0 !important;
          }
          
          /* Professional spacing */
          .space-y-6 > * + * {
            margin-top: 16px !important;
          }
          
          .space-y-4 > * + * {
            margin-top: 12px !important;
          }
          
          .space-y-2 > * + * {
            margin-top: 6px !important;
          }
          
          /* Icons - convert to text or hide */
          svg {
            display: none !important;
          }
          
          /* Print-friendly borders and dividers */
          .border-t {
            border-top: 1px solid #999 !important;
          }
          
          .border-b {
            border-bottom: 1px solid #999 !important;
          }
          
          .border {
            border: 1px solid #999 !important;
          }
          
          /* Ensure proper page margins */
          .print-content > *:first-child {
            margin-top: 0 !important;
          }
          
          .print-content > *:last-child {
            margin-bottom: 0 !important;
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
