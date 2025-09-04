import { db } from "@repo/database";

async function addUserToOrganization() {
	try {
		// First, let's see what users exist
		const users = await db.user.findMany({
			select: {
				id: true,
				email: true,
				name: true,
			},
		});

		console.log("=== EXISTING USERS ===");
		users.forEach((user) => {
			console.log(`- ${user.email} (${user.name}) - ID: ${user.id}`);
		});

		// Check what organizations exist
		const organizations = await db.organization.findMany({
			select: {
				id: true,
				name: true,
				slug: true,
			},
		});

		console.log("\n=== EXISTING ORGANIZATIONS ===");
		organizations.forEach((org) => {
			console.log(`- ${org.name} (${org.slug}) - ID: ${org.id}`);
		});

		// Check existing memberships
		const memberships = await db.member.findMany({
			include: {
				user: {
					select: {
						email: true,
						name: true,
					},
				},
				organization: {
					select: {
						name: true,
						slug: true,
					},
				},
			},
		});

		console.log("\n=== EXISTING MEMBERSHIPS ===");
		memberships.forEach((member) => {
			console.log(
				`- ${member.user.email} is ${member.role} in ${member.organization.name}`,
			);
		});

		// Check if we need to add any memberships
		if (users.length > 0 && organizations.length > 0) {
			// Find users not in any organization
			const usersWithoutOrg = users.filter(
				(user) => !memberships.some((m) => m.userId === user.id),
			);

			if (usersWithoutOrg.length > 0) {
				console.log("\n=== USERS WITHOUT ORGANIZATION ===");
				usersWithoutOrg.forEach((user) => {
					console.log(`- ${user.email} (${user.name})`);
				});

				// Add first user without org to first organization as owner
				const userToAdd = usersWithoutOrg[0];
				const targetOrg = organizations[0];

				console.log(
					`\n>>> Adding ${userToAdd.email} to ${targetOrg.name} as owner...`,
				);

				const newMembership = await db.member.create({
					data: {
						userId: userToAdd.id,
						organizationId: targetOrg.id,
						role: "owner",
						createdAt: new Date(),
					},
					include: {
						user: {
							select: {
								email: true,
								name: true,
							},
						},
						organization: {
							select: {
								name: true,
								slug: true,
							},
						},
					},
				});

				console.log(
					`✅ Successfully added ${newMembership.user.email} as ${newMembership.role} to ${newMembership.organization.name}`,
				);
			} else {
				console.log(
					"\n✅ All users are already members of organizations!",
				);
			}
		} else {
			if (users.length === 0) {
				console.log("\n⚠️  No users found in database!");
			}
			if (organizations.length === 0) {
				console.log("\n⚠️  No organizations found in database!");

				// Create a default organization
				if (users.length > 0) {
					console.log("\n>>> Creating default organization...");
					const newOrg = await db.organization.create({
						data: {
							name: "Default Organization",
							slug: "default-org",
							createdAt: new Date(),
							metadata: JSON.stringify({}),
						},
					});

					console.log(
						`✅ Created organization: ${newOrg.name} (${newOrg.slug})`,
					);

					// Add first user as owner
					const firstUser = users[0];
					const membership = await db.member.create({
						data: {
							userId: firstUser.id,
							organizationId: newOrg.id,
							role: "owner",
							createdAt: new Date(),
						},
					});

					console.log(
						`✅ Added ${firstUser.email} as owner of ${newOrg.name}`,
					);
				}
			}
		}

		// Check projects and their organizations
		const projects = await db.project.findMany({
			include: {
				organization: {
					select: {
						name: true,
						slug: true,
					},
				},
			},
		});

		console.log("\n=== PROJECTS ===");
		projects.forEach((project) => {
			console.log(
				`- ${project.jobName} (${project.jobNumber}) - Org: ${project.organization.name}`,
			);
		});
	} catch (error) {
		console.error("Error:", error);
	} finally {
		await db.$disconnect();
	}
}

addUserToOrganization();
