import { env } from "../config/env";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const adminEmails = new Set(
  env.ADMIN_USERS.split(",")
    .map(normalizeEmail)
    .filter((email) => Boolean(email))
);

export const isAdminEmail = (email?: string | null) => {
  if (!email) {
    return false;
  }

  return adminEmails.has(normalizeEmail(email));
};


