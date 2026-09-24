/**
 * Permission catalogue and default role matrix.
 *
 * The database (role_permissions) is the source of truth at runtime; this file
 * mirrors the seed in supabase/AI_WITH_HAMAD_SETUP.sql for typing and UI.
 * tests/db/rls.test.ts fails if the two disagree.
 */
export const PERMISSIONS = [
  "cms.read",
  "projects.write",
  "projects.publish",
  "projects.delete",
  "services.write",
  "services.publish",
  "services.delete",
  "team.write",
  "team.publish",
  "team.delete",
  "content.write",
  "content.publish",
  "content.delete",
  "sponsorship.write",
  "sponsorship.publish",
  "sponsorship.delete",
  "sponsorship.rates",
  "inquiries.read",
  "inquiries.write",
  "inquiries.delete",
  "media.upload",
  "media.update",
  "media.delete",
  "settings.write",
  "navigation.write",
  "legal.write",
  "users.read",
  "users.manage",
  "audit.read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLES = ["owner", "admin", "manager", "editor", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_RANK: Record<Role, number> = { owner: 50, admin: 40, manager: 30, editor: 20, viewer: 10 };

const MANAGER: Permission[] = [
  "cms.read",
  "projects.write",
  "projects.publish",
  "projects.delete",
  "services.write",
  "services.publish",
  "services.delete",
  "team.write",
  "team.publish",
  "team.delete",
  "content.write",
  "content.publish",
  "content.delete",
  "sponsorship.write",
  "sponsorship.publish",
  "sponsorship.delete",
  "sponsorship.rates",
  "inquiries.read",
  "inquiries.write",
  "media.upload",
  "media.update",
  "media.delete",
  "audit.read",
];

export const DEFAULT_ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: PERMISSIONS,
  admin: PERMISSIONS,
  manager: MANAGER,
  editor: [
    "cms.read",
    "projects.write",
    "services.write",
    "team.write",
    "content.write",
    "sponsorship.write",
    "media.upload",
    "media.update",
  ],
  viewer: ["cms.read"],
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/**
 * Can `actor` assign `targetRole` to / modify a user currently holding `currentRole`?
 * Owners can do anything; admins cannot touch owners or grant owner.
 */
export function canManageRole(actor: Role, currentRole: Role, targetRole: Role): boolean {
  if (actor === "owner") return true;
  if (actor !== "admin") return false;
  return currentRole !== "owner" && targetRole !== "owner";
}
