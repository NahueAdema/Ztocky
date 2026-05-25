import "dotenv/config";

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaNeon } = await import("@prisma/adapter-neon");

  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const result = await prisma.user.updateMany({
    where: { role: "SUPER_ADMIN" },
    data: { emailVerified: true },
  });

  console.log(`OK. ${result.count} SUPER_ADMIN usuario(s) verificado(s).`);

  const users = await prisma.user.findMany({
    where: { role: "SUPER_ADMIN" },
    select: { email: true, emailVerified: true, role: true },
  });

  console.log("Estado actual:", JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
