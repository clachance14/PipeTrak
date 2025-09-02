"use client";

import { useSession } from "@saas/auth/hooks/use-session";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Alert, AlertDescription, AlertTitle } from "@ui/components/alert";
import { Badge } from "@ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { AlertCircle, CheckCircle2, Users } from "lucide-react";

/**
 * Development-only component to display organization membership status
 * Helps diagnose authorization issues during development
 */
export function OrganizationCheck() {
	// Only show in development
	if (process.env.NODE_ENV === "production") {
		return null;
	}

	const { session, user } = useSession();
	const { activeOrganization, activeOrganizationUserRole, loaded } =
		useActiveOrganization();

	if (!loaded) {
		return (
			<Card className="border-dashed">
				<CardContent className="pt-6">
					<p className="text-sm text-muted-foreground">
						Loading organization info...
					</p>
				</CardContent>
			</Card>
		);
	}

	const hasOrganization = !!activeOrganization;
	const hasMembership = !!activeOrganizationUserRole;

	return (
		<Card
			className={`border-dashed ${!hasOrganization ? "border-red-500" : "border-green-500"}`}
		>
			<CardHeader className="pb-3">
				<CardTitle className="text-sm font-medium flex items-center gap-2">
					<Users className="h-4 w-4" />
					Organization Status (Dev Only)
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{/* User Info */}
				<div className="text-sm">
					<span className="text-muted-foreground">User: </span>
					<span className="font-medium">
						{user?.email || "Not logged in"}
					</span>
					{user?.role && (
						<Badge status="info" className="ml-2 text-xs">
							{user.role}
						</Badge>
					)}
				</div>

				{/* Organization Info */}
				{hasOrganization ? (
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<CheckCircle2 className="h-4 w-4 text-green-500" />
							<span className="text-sm font-medium">
								Active Organization
							</span>
						</div>
						<div className="pl-6 space-y-1">
							<div className="text-sm">
								<span className="text-muted-foreground">
									Name:{" "}
								</span>
								<span className="font-medium">
									{activeOrganization.name}
								</span>
							</div>
							<div className="text-sm">
								<span className="text-muted-foreground">
									Slug:{" "}
								</span>
								<code className="px-1 py-0.5 bg-muted rounded text-xs">
									{activeOrganization.slug}
								</code>
							</div>
							{activeOrganizationUserRole && (
								<div className="text-sm">
									<span className="text-muted-foreground">
										Your Role:{" "}
									</span>
									<Badge status="info" className="text-xs">
										{activeOrganizationUserRole}
									</Badge>
								</div>
							)}
						</div>
					</div>
				) : (
					<Alert variant="error" className="py-2">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle className="text-sm">
							No Active Organization
						</AlertTitle>
						<AlertDescription className="text-xs mt-1">
							You are not a member of any organization. Contact an
							administrator to be added.
						</AlertDescription>
					</Alert>
				)}

				{/* Membership Warning */}
				{hasOrganization && !hasMembership && (
					<Alert variant="error" className="py-2">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle className="text-sm">
							Not a Member
						</AlertTitle>
						<AlertDescription className="text-xs mt-1">
							You can see this organization but are not a member.
							You won't be able to access resources.
						</AlertDescription>
					</Alert>
				)}

				{/* SQL Helper */}
				{!hasOrganization && user?.id && (
					<div className="pt-2 border-t">
						<p className="text-xs text-muted-foreground mb-1">
							Quick Fix SQL:
						</p>
						<pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
							{`INSERT INTO public.member (
  id, "organizationId", "userId", 
  role, "createdAt"
) VALUES (
  gen_random_uuid()::text,
  'ORG_ID_HERE',
  '${user.id}',
  'member',
  NOW()
);`}
						</pre>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
