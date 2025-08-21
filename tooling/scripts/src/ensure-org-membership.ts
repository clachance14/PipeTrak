#!/usr/bin/env tsx
/**
 * Ensure Organization Membership Script
 * 
 * This script checks that all users are members of at least one organization
 * and can optionally fix missing memberships.
 * 
 * Usage:
 *   pnpm --filter scripts tsx src/ensure-org-membership.ts [--fix]
 */

import { db } from "@repo/database";
import { parseArgs } from "util";

// Parse command line arguments
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    fix: {
      type: "boolean",
      default: false,
    },
    help: {
      type: "boolean", 
      short: "h",
      default: false,
    },
  },
});

if (values.help) {
  console.log(`
Usage: pnpm --filter scripts tsx src/ensure-org-membership.ts [options]

Options:
  --fix    Automatically add users without organizations to a default org
  --help   Show this help message

This script checks that all users are members of at least one organization.
  `);
  process.exit(0);
}

async function ensureOrganizationMembership() {
  try {
    console.log("🔍 Checking organization memberships...\n");

    // Get all users
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`Found ${users.length} users`);

    // Get all organizations
    const organizations = await db.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`Found ${organizations.length} organizations\n`);

    if (organizations.length === 0) {
      console.log("❌ No organizations found!");
      
      if (values.fix) {
        console.log("\n📝 Creating default organization...");
        const newOrg = await db.organization.create({
          data: {
            name: "Default Organization",
            slug: "default-org",
            createdAt: new Date(),
            metadata: {},
          },
        });
        console.log(`✅ Created organization: ${newOrg.name} (${newOrg.slug})`);
        organizations.push(newOrg);
      } else {
        console.log("💡 Run with --fix to create a default organization");
        process.exit(1);
      }
    }

    // Get all memberships
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

    console.log("Current Memberships:");
    console.log("===================");
    if (memberships.length === 0) {
      console.log("  (none)");
    } else {
      memberships.forEach((m) => {
        console.log(`  • ${m.user.email} → ${m.role} in ${m.organization.name}`);
      });
    }
    console.log();

    // Find users without any organization membership
    const usersWithoutOrg = users.filter(
      (user) => !memberships.some((m) => m.userId === user.id)
    );

    if (usersWithoutOrg.length === 0) {
      console.log("✅ All users are members of at least one organization!");
      return;
    }

    console.log(`⚠️  Found ${usersWithoutOrg.length} users without organization membership:`);
    usersWithoutOrg.forEach((user) => {
      console.log(`  • ${user.email} (${user.name || "No name"}) - Role: ${user.role || "user"}`);
    });

    if (!values.fix) {
      console.log("\n💡 Run with --fix to add these users to an organization");
      process.exit(1);
    }

    // Fix: Add users to the first (or default) organization
    const targetOrg = organizations[0];
    console.log(`\n📝 Adding users to ${targetOrg.name}...`);

    for (const user of usersWithoutOrg) {
      // Determine role based on user.role
      let memberRole = "member";
      if (user.role === "admin") {
        memberRole = "owner"; // System admins become org owners
      }

      const membership = await db.member.create({
        data: {
          userId: user.id,
          organizationId: targetOrg.id,
          role: memberRole,
          createdAt: new Date(),
        },
      });

      console.log(`  ✅ Added ${user.email} as ${memberRole}`);
    }

    console.log("\n✨ All users now have organization membership!");

    // Show final state
    const finalMemberships = await db.member.findMany({
      include: {
        user: {
          select: {
            email: true,
          },
        },
        organization: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("\nFinal Memberships:");
    console.log("==================");
    finalMemberships.forEach((m) => {
      console.log(`  • ${m.user.email} → ${m.role} in ${m.organization.name}`);
    });

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Run the script
ensureOrganizationMembership();