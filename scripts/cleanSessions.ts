import { prisma } from "../lib/prisma";

async function main() {
  const result = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  console.log(`[${new Date().toISOString()}] Usunięto ${result.count} wygasłych sesji`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
