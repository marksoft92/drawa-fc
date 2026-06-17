const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  console.log(`[${new Date().toISOString()}] Usunięto ${result.count} wygasłych sesji`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
