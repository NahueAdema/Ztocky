import { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";

export const PAGE_SIZE = 15;

export type AdminWorkspace = Prisma.WorkspaceGetPayload<{
  include: {
    _count: {
      select: {
        alerts: true;
        members: true;
        orders: true;
        products: true;
        suppliers: true;
      };
    };
    members: { include: { user: true } };
  };
}>;

export type AdminUser = Prisma.UserGetPayload<{
  include: {
    _count: { select: { sessions: true; memberships: true } };
    memberships: { include: { workspace: true } };
  };
}>;

export type AdminSession = Prisma.SessionGetPayload<{
  include: { user: true };
}>;

export type UserDetail = Prisma.UserGetPayload<{
  include: {
    _count: { select: { sessions: true; memberships: true; sales: true; returns: true } };
    memberships: { include: { workspace: true } };
    sessions: { orderBy: { createdAt: "desc" }; take: 20 };
  };
}>;

export type WorkspaceDetail = Prisma.WorkspaceGetPayload<{
  include: {
    _count: {
      select: {
        alerts: true;
        members: true;
        orders: true;
        products: true;
        suppliers: true;
        sales: true;
        customers: true;
      };
    };
    members: { include: { user: true } };
    products: { orderBy: { createdAt: "desc" }; take: 20 };
    alerts: { where: { isResolved: false }; orderBy: { createdAt: "desc" }; take: 20 };
  };
}>;

export async function getAdminOverview() {
  const prisma = getPrisma();
  const now = new Date();

  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    superAdmins,
    totalWorkspaces,
    activeSessions,
    products,
    suppliers,
    purchaseOrders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { status: "SUSPENDED" } }),
    prisma.user.count({ where: { role: "SUPER_ADMIN" } }),
    prisma.workspace.count(),
    prisma.session.count({ where: { expiresAt: { gt: now } } }),
    prisma.product.count(),
    prisma.supplier.count(),
    prisma.purchaseOrder.count(),
  ]);

  return {
    totalUsers,
    activeUsers,
    suspendedUsers,
    superAdmins,
    totalWorkspaces,
    activeSessions,
    products,
    suppliers,
    purchaseOrders,
  };
}

type UsersParams = {
  page?: number;
  search?: string;
  role?: string;
  status?: string;
};

export async function getAdminUsers(params: UsersParams = {}) {
  const prisma = getPrisma();
  const page = Math.max(1, params.page || 1);
  const where: Prisma.UserWhereInput = {};

  if (params.search) {
    const q = params.search;
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  if (params.role && ["USER", "SUPER_ADMIN"].includes(params.role)) {
    where.role = params.role as "USER" | "SUPER_ADMIN";
  }

  if (params.status && ["ACTIVE", "SUSPENDED"].includes(params.status)) {
    where.status = params.status as "ACTIVE" | "SUSPENDED";
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        _count: { select: { sessions: true, memberships: true } },
        memberships: {
          include: { workspace: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);

  return { items: items as AdminUser[], total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
}

type WorkspacesParams = {
  page?: number;
  search?: string;
};

export async function getAdminWorkspaces(params: WorkspacesParams = {}) {
  const prisma = getPrisma();
  const page = Math.max(1, params.page || 1);
  const where: Prisma.WorkspaceWhereInput = {};

  if (params.search) {
    const q = params.search;
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.workspace.findMany({
      where,
      include: {
        _count: {
          select: {
            alerts: true,
            members: true,
            orders: true,
            products: true,
            suppliers: true,
          },
        },
        members: {
          include: { user: true },
          orderBy: { createdAt: "asc" },
          take: 3,
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.workspace.count({ where }),
  ]);

  return { items: items as AdminWorkspace[], total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
}

type SessionsParams = {
  page?: number;
  search?: string;
  status?: string;
};

export async function getAdminSessions(params: SessionsParams = {}) {
  const prisma = getPrisma();
  const page = Math.max(1, params.page || 1);
  const now = new Date();
  const where: Prisma.SessionWhereInput = {};

  if (params.search) {
    const q = params.search;
    where.user = {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    };
  }

  if (params.status === "active") {
    where.expiresAt = { gt: now };
  } else if (params.status === "expired") {
    where.expiresAt = { lte: now };
  }

  const [items, total] = await Promise.all([
    prisma.session.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.session.count({ where }),
  ]);

  return { items: items as AdminSession[], total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getUserDetail(id: string): Promise<UserDetail | null> {
  const user = await getPrisma().user.findUnique({
    where: { id },
    include: {
      _count: { select: { sessions: true, memberships: true, sales: true, returns: true } },
      memberships: { include: { workspace: true } },
      sessions: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  return user as UserDetail | null;
}

export async function getWorkspaceDetail(id: string): Promise<WorkspaceDetail | null> {
  const workspace = await getPrisma().workspace.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          alerts: true,
          members: true,
          orders: true,
          products: true,
          suppliers: true,
          sales: true,
          customers: true,
        },
      },
      members: { include: { user: true } },
      products: { orderBy: { createdAt: "desc" }, take: 20 },
      alerts: { where: { isResolved: false }, orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  return workspace as WorkspaceDetail | null;
}
