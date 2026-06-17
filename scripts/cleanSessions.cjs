const { PrismaClient } = require("../lib/generated/prisma");

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  console.log(`Usunięto ${result.count} wygasłych sesji`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
