import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Html,
	Preview,
	Section,
	Text,
	Hr,
} from "@react-email/components";

interface EarlyAccessNotificationProps {
	name: string;
	email: string;
	company: string;
	projectSize: string;
	currentMethod: string;
	role: string;
	phone?: string;
	message?: string;
	leadScore: number;
	priority: "HIGH" | "MEDIUM" | "LOW";
	createdAt: string;
	insights: {
		isEnterprise: boolean;
		isCurrentCustomer: boolean;
		needsUrgentFollowup: boolean;
	};
}

const priorityConfig = {
	HIGH: { emoji: "🔥", color: "#dc2626", bgColor: "#fef2f2" },
	MEDIUM: { emoji: "🟡", color: "#d97706", bgColor: "#fffbeb" },
	LOW: { emoji: "🟢", color: "#16a34a", bgColor: "#f0fdf4" },
};

export default function EarlyAccessNotification({
	name,
	email,
	company,
	projectSize,
	currentMethod,
	role,
	phone,
	message,
	leadScore,
	priority,
	createdAt,
	insights,
}: EarlyAccessNotificationProps) {
	const priorityStyle = priorityConfig[priority];
	const callToEmail = `mailto:${email}?subject=Welcome to PipeTrak Early Access&body=Hi ${name},%0D%0A%0D%0AThanks for your interest in PipeTrak!`;
	const callToPhone = phone ? `tel:${phone}` : undefined;

	return (
		<Html>
			<Head />
			<Preview>
				{priority} Priority Lead: {company} - {name} signed up for early
				access
			</Preview>
			<Body style={main}>
				<Container style={container}>
					{/* Priority Header */}
					<Section
						style={{
							...priorityBanner,
							backgroundColor: priorityStyle.bgColor,
							borderLeft: `4px solid ${priorityStyle.color}`,
						}}
					>
						<Text
							style={{
								...priorityText,
								color: priorityStyle.color,
							}}
						>
							{priorityStyle.emoji} LEAD SCORE: {leadScore}/10 -{" "}
							{priority} PRIORITY
						</Text>
					</Section>

					<Heading style={h1}>New Early Access Signup!</Heading>

					{/* Contact Information */}
					<Section style={section}>
						<Heading style={h2}>CONTACT INFORMATION</Heading>
						<Hr style={hr} />
						<Text style={text}>
							<strong>Name:</strong> {name}
							<br />
							<strong>Email:</strong> {email}
							<br />
							<strong>Role:</strong> {role}
							<br />
							{phone && (
								<>
									<strong>Phone:</strong> {phone}
									<br />
								</>
							)}
						</Text>
					</Section>

					{/* Company Details */}
					<Section style={section}>
						<Heading style={h2}>COMPANY DETAILS</Heading>
						<Hr style={hr} />
						<Text style={text}>
							<strong>Company:</strong> {company}
							<br />
							<strong>Project Size:</strong> {projectSize}
							<br />
							<strong>Current Method:</strong> {currentMethod}
							<br />
						</Text>
					</Section>

					{/* Opportunity Insights */}
					{(insights.isEnterprise ||
						insights.isCurrentCustomer ||
						insights.needsUrgentFollowup) && (
						<Section style={section}>
							<Heading style={h2}>OPPORTUNITY INSIGHTS</Heading>
							<Hr style={hr} />
							<Text style={text}>
								{insights.isEnterprise &&
									"⚡ Enterprise-scale project (high revenue potential)\n"}
								{insights.isCurrentCustomer &&
									"🔄 Currently using competitor software (ready to switch)\n"}
								{insights.needsUrgentFollowup &&
									"🎯 High-priority lead - recommend immediate follow-up\n"}
							</Text>
						</Section>
					)}

					{/* Message */}
					{message && (
						<Section style={section}>
							<Heading style={h2}>THEIR CHALLENGE</Heading>
							<Hr style={hr} />
							<Text style={messageText}>"{message}"</Text>
						</Section>
					)}

					{/* Action Buttons */}
					<Section style={buttonSection}>
						<Button
							style={{
								...button,
								backgroundColor: "#16a34a",
							}}
							href={callToEmail}
						>
							📧 Send Welcome Email
						</Button>

						{callToPhone && (
							<Button
								style={{
									...button,
									backgroundColor: "#2563eb",
									marginLeft: "12px",
								}}
								href={callToPhone}
							>
								📞 Call Now
							</Button>
						)}
					</Section>

					{/* Footer */}
					<Section style={footer}>
						<Text style={footerText}>
							Signup Time: {new Date(createdAt).toLocaleString()}
							<br />
							Lead ID: #{leadScore}-{company.replace(/\s+/g, "")}-
							{Date.now().toString().slice(-4)}
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}

const main = {
	backgroundColor: "#ffffff",
	fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
};

const container = {
	margin: "0 auto",
	padding: "20px 0 48px",
	maxWidth: "600px",
};

const priorityBanner = {
	padding: "16px 20px",
	borderRadius: "8px",
	marginBottom: "24px",
	textAlign: "center" as const,
};

const priorityText = {
	margin: "0",
	fontSize: "16px",
	fontWeight: "bold",
	textTransform: "uppercase" as const,
	letterSpacing: "0.5px",
};

const h1 = {
	color: "#1a1a1a",
	fontSize: "24px",
	fontWeight: "bold",
	margin: "24px 0",
	textAlign: "center" as const,
};

const h2 = {
	color: "#374151",
	fontSize: "16px",
	fontWeight: "bold",
	margin: "0 0 8px 0",
	textTransform: "uppercase" as const,
	letterSpacing: "0.5px",
};

const section = {
	marginBottom: "24px",
};

const text = {
	color: "#374151",
	fontSize: "14px",
	lineHeight: "20px",
	margin: "12px 0 0 0",
	whiteSpace: "pre-line" as const,
};

const messageText = {
	color: "#1f2937",
	fontSize: "14px",
	lineHeight: "20px",
	margin: "12px 0 0 0",
	fontStyle: "italic",
	padding: "12px",
	backgroundColor: "#f9fafb",
	borderLeft: "3px solid #d1d5db",
	borderRadius: "4px",
};

const hr = {
	borderColor: "#e5e7eb",
	margin: "8px 0",
};

const buttonSection = {
	textAlign: "center" as const,
	margin: "32px 0",
};

const button = {
	color: "#ffffff",
	fontSize: "14px",
	fontWeight: "bold",
	textDecoration: "none",
	textAlign: "center" as const,
	display: "inline-block",
	padding: "12px 24px",
	borderRadius: "6px",
};

const footer = {
	borderTop: "1px solid #e5e7eb",
	paddingTop: "16px",
	marginTop: "32px",
};

const footerText = {
	color: "#6b7280",
	fontSize: "12px",
	lineHeight: "16px",
	margin: "0",
	textAlign: "center" as const,
};
