import { prisma } from "../lib/prisma";

const result = await prisma.session.deleteMany({
  where: { expiresAt: { lt: new Date() } },
});
console.log(`[${new Date().toISOString()}] Usunięto ${result.count} wygasłych sesji`);
await prisma.$disconnect();
