import { getPrisma } from "@/lib/prisma";

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

export async function getAdminUsers() {
  return getPrisma().user.findMany({
    include: {
      _count: { select: { sessions: true, memberships: true } },
      memberships: {
        include: { workspace: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getAdminWorkspaces() {
  return getPrisma().workspace.findMany({
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
    take: 100,
  });
}

export async function getAdminSessions() {
  return getPrisma().session.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
