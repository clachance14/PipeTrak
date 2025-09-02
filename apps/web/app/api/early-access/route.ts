import { db } from "@repo/database";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@repo/mail";
import { config } from "@repo/config";

// Validation schema for early access form
const earlyAccessSchema = z.object({
	name: z.string().min(1, "Name is required").max(100, "Name too long"),
	email: z.string().email("Invalid email address").max(255, "Email too long"),
	company: z
		.string()
		.min(1, "Company is required")
		.max(100, "Company name too long"),
	projectSize: z.enum(["small", "medium", "large", "enterprise"], {
		errorMap: () => ({ message: "Please select a valid project size" }),
	}),
	currentMethod: z.enum(["excel", "paper", "other_software", "none"], {
		errorMap: () => ({
			message: "Please select your current tracking method",
		}),
	}),
	role: z.string().min(1, "Role is required").max(100, "Role too long"),
	phone: z.string().max(20, "Phone number too long").optional(),
	message: z.string().max(1000, "Message too long").optional(),
	// UTM parameters for tracking
	utmSource: z.string().optional(),
	utmMedium: z.string().optional(),
	utmCampaign: z.string().optional(),
});

// Lead scoring logic
function calculateLeadScore(data: {
	projectSize: string;
	currentMethod: string;
	role: string;
}) {
	let score = 0;

	// Project size scoring (0-4 points)
	if (data.projectSize === "enterprise") score += 4;
	else if (data.projectSize === "large") score += 3;
	else if (data.projectSize === "medium") score += 2;
	else if (data.projectSize === "small") score += 1;

	// Current method scoring - competitors score higher (0-3 points)
	if (data.currentMethod === "other_software") score += 3;
	else if (data.currentMethod === "excel") score += 2;
	else if (data.currentMethod === "paper") score += 1;
	else if (data.currentMethod === "none") score += 1;

	// Role scoring - decision makers score higher (0-3 points)
	const roleString = data.role.toLowerCase();
	if (
		roleString.includes("director") ||
		roleString.includes("vp") ||
		roleString.includes("ceo")
	)
		score += 3;
	else if (
		roleString.includes("manager") ||
		roleString.includes("lead") ||
		roleString.includes("supervisor")
	)
		score += 2;
	else if (
		roleString.includes("engineer") ||
		roleString.includes("coordinator")
	)
		score += 1;

	// Determine priority level
	let priority: "HIGH" | "MEDIUM" | "LOW";
	if (score >= 7) priority = "HIGH";
	else if (score >= 4) priority = "MEDIUM";
	else priority = "LOW";

	return {
		score,
		priority,
		insights: {
			isEnterprise: data.projectSize === "enterprise",
			isCurrentCustomer: data.currentMethod === "other_software",
			needsUrgentFollowup: score >= 7,
		},
	};
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		// Validate the request body
		const validatedData = earlyAccessSchema.parse(body);

		// Check if email already exists
		const existingLead = await db.earlyAccessLead.findUnique({
			where: { email: validatedData.email },
		});

		if (existingLead) {
			return NextResponse.json(
				{ error: "This email is already registered for early access" },
				{ status: 409 }, // Conflict
			);
		}

		// Create new early access lead
		const newLead = await db.earlyAccessLead.create({
			data: {
				name: validatedData.name,
				email: validatedData.email,
				company: validatedData.company,
				projectSize: validatedData.projectSize,
				currentMethod: validatedData.currentMethod,
				role: validatedData.role,
				phone: validatedData.phone || null,
				message: validatedData.message || null,
				source: "landing_page",
				utmSource: validatedData.utmSource || null,
				utmMedium: validatedData.utmMedium || null,
				utmCampaign: validatedData.utmCampaign || null,
			},
			select: {
				id: true,
				name: true,
				email: true,
				company: true,
				createdAt: true,
			},
		});

		// TODO: Send welcome email via Resend
		// TODO: Add to email automation sequence
		// TODO: Track analytics event

		console.log(
			`New early access lead: ${newLead.email} from ${newLead.company}`,
		);

		// Send notification email with lead scoring
		if (config.earlyAccess?.enableNotifications) {
			try {
				const leadScoring = calculateLeadScore({
					projectSize: validatedData.projectSize,
					currentMethod: validatedData.currentMethod,
					role: validatedData.role,
				});

				// Log high-priority leads
				if (leadScoring.priority === "HIGH") {
					console.log(
						`🔥 HIGH PRIORITY LEAD: ${validatedData.company} (Score: ${leadScoring.score}/10)`,
					);
				}

				await sendEmail({
					to: config.earlyAccess.notificationEmail,
					templateId: "earlyAccessNotification",
					context: {
						name: validatedData.name,
						email: validatedData.email,
						company: validatedData.company,
						projectSize: validatedData.projectSize,
						currentMethod: validatedData.currentMethod,
						role: validatedData.role,
						phone: validatedData.phone || undefined,
						message: validatedData.message || undefined,
						leadScore: leadScoring.score,
						priority: leadScoring.priority,
						insights: leadScoring.insights,
						createdAt: newLead.createdAt.toISOString(),
					},
				});

				console.log(
					`📧 Notification sent for lead: ${validatedData.email} (Priority: ${leadScoring.priority})`,
				);
			} catch (emailError) {
				// Don't fail the signup if email fails
				console.error("Failed to send notification email:", emailError);
			}
		}

		return NextResponse.json(
			{
				success: true,
				message: "Successfully registered for early access",
				lead: newLead,
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("Early access registration error:", error);

		// Handle Zod validation errors
		if (error instanceof z.ZodError) {
			const fieldErrors = error.errors.reduce(
				(acc, err) => {
					const field = err.path.join(".");
					acc[field] = err.message;
					return acc;
				},
				{} as Record<string, string>,
			);

			return NextResponse.json(
				{ error: "Validation failed", fields: fieldErrors },
				{ status: 400 },
			);
		}

		// Handle Prisma/Database errors
		if (
			error instanceof Error &&
			error.message.includes("Unique constraint")
		) {
			return NextResponse.json(
				{ error: "This email is already registered" },
				{ status: 409 },
			);
		}

		// Generic server error
		return NextResponse.json(
			{ error: "Failed to register for early access. Please try again." },
			{ status: 500 },
		);
	}
}

// Handle GET requests to fetch early access stats (optional, for admin use)
export async function GET(request: NextRequest) {
	try {
		// Only return basic stats, not individual lead data
		const stats = await db.earlyAccessLead.groupBy({
			by: ["projectSize", "currentMethod"],
			_count: {
				id: true,
			},
		});

		const totalLeads = await db.earlyAccessLead.count();

		return NextResponse.json({
			totalLeads,
			breakdown: stats,
		});
	} catch (error) {
		console.error("Error fetching early access stats:", error);
		return NextResponse.json(
			{ error: "Failed to fetch stats" },
			{ status: 500 },
		);
	}
}
