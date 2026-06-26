import { cookies } from "next/headers";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { getPrisma } from "@/lib/prisma";

const SESSION_COOKIE = "ztocky_session";
const SESSION_DAYS = 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function slugify(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug || "workspace";
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, key] = storedHash.split(":");

  if (!salt || !key) {
    return false;
  }

  const hash = scryptSync(password, salt, 64);
  const stored = Buffer.from(key, "hex");

  return stored.length === hash.length && timingSafeEqual(stored, hash);
}

export async function createSession(userId: string) {
  const prisma = getPrisma();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    try {
      await getPrisma().session.deleteMany({
        where: { tokenHash: hashToken(token) },
      });
    } catch {
      // Logging out should still clear the local cookie if the DB is unavailable.
    }
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const session = await getPrisma().session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: {
        user: {
          include: {
            memberships: {
              include: { workspace: true },
              orderBy: { createdAt: "asc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      await clearSession();
      return null;
    }

    const membership = session.user.memberships[0];

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      globalRole: session.user.role,
      status: session.user.status,
      workspaceId: membership?.workspaceId ?? null,
      workspaceName: membership?.workspace.name ?? "Mi comercio",
      role: membership?.role ?? "OWNER",
    };
  } catch {
    return null;
  }
}

export async function getRequiredSuperAdmin() {
  const user = await getCurrentUser();

  if (!user || user.globalRole !== "SUPER_ADMIN" || user.status !== "ACTIVE") {
    return null;
  }

  return user;
}

export async function registerUser(input: {
  name: string;
  email: string;
  cuitCuil?: string;
  password: string;
}) {
  const prisma = getPrisma();
  const email = normalizeEmail(input.email);
  const workspaceName = input.name.trim() || email.split("@")[0] || "Mi comercio";
  const slugBase = slugify(workspaceName);
  const workspaceSlug = `${slugBase}-${randomBytes(3).toString("hex")}`;
  const superAdminCount = await prisma.user.count({
    where: { role: "SUPER_ADMIN" },
  });

  return prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      cuitCuil: input.cuitCuil?.trim() || null,
      passwordHash: hashPassword(input.password),
      role: superAdminCount === 0 ? "SUPER_ADMIN" : "USER",
      memberships: {
        create: {
          role: "OWNER",
          workspace: {
            create: {
              name: workspaceName,
              slug: workspaceSlug,
            },
          },
        },
      },
    },
  });
}

export async function authenticateUser(emailInput: string, password: string) {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(emailInput) },
  });

  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  if (!user.passwordHash) {
    return null;
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return user;
}

export const authCookieName = SESSION_COOKIE;
