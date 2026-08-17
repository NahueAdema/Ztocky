import { getPrisma } from "@/lib/prisma";

export const PAGE_SIZE = 15;

export type AdminWorkspaceMember = {
  id: string;
  role: string;
  createdAt: Date;
  user: { id: string; name: string; email: string; status: string };
};

export type AdminWorkspace = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    alerts: number;
    members: number;
    orders: number;
    products: number;
    suppliers: number;
  };
  members: AdminWorkspaceMember[];
};

export type AdminUserMembership = {
  id: string;
  role: string;
  createdAt: Date;
  workspace: { id: string; name: string; slug: string };
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  cuitCuil: string | null;
  supportNotes: string | null;
  _count: { sessions: number; memberships: number };
  memberships: AdminUserMembership[];
};

export type AdminSession = {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  user: { id: string; name: string; email: string };
};

export type UserDetailSession = {
  id: string;
  expiresAt: Date;
  createdAt: Date;
};

export type UserDetail = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  cuitCuil: string | null;
  supportNotes: string | null;
  emailVerified: boolean;
  _count: { sessions: number; memberships: number; sales: number; returns: number };
  memberships: AdminUserMembership[];
  sessions: UserDetailSession[];
};

export type WorkspaceDetailProduct = {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  category: string | null;
};

export type WorkspaceDetailAlert = {
  id: string;
  type: string;
  message: string;
  createdAt: Date;
};

export type WorkspaceDetail = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    alerts: number;
    members: number;
    orders: number;
    products: number;
    suppliers: number;
    sales: number;
    customers: number;
  };
  members: AdminWorkspaceMember[];
  products: WorkspaceDetailProduct[];
  alerts: WorkspaceDetailAlert[];
};

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (params.search) {
    const q = params.search;
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  if (params.role && ["USER", "SUPER_ADMIN"].includes(params.role)) {
    where.role = params.role;
  }

  if (params.status && ["ACTIVE", "SUSPENDED"].includes(params.status)) {
    where.status = params.status;
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        _count: { select: { sessions: true, memberships: true } },
        memberships: {
          include: { workspace: true },
          orderBy: { createdAt: "asc" as const },
        },
      },
      orderBy: { createdAt: "desc" as const },
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

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
          orderBy: { createdAt: "asc" as const },
          take: 3,
        },
      },
      orderBy: { createdAt: "desc" as const },
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

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
      orderBy: { createdAt: "desc" as const },
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
      sessions: { orderBy: { createdAt: "desc" as const }, take: 20 },
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
      products: { orderBy: { createdAt: "desc" as const }, take: 20 },
      alerts: { where: { isResolved: false }, orderBy: { createdAt: "desc" as const }, take: 20 },
    },
  });
  return workspace as WorkspaceDetail | null;
}
