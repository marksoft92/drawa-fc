import { PrismaClient } from '../lib/generated/prisma/index.js';

const prisma = new PrismaClient();

const players = await prisma.player.findMany({ include: { user: true } });
const sezony = await prisma.sezon.findMany();

console.log('=== PLAYERS ===');
players.forEach(p => console.log(`  ${p.imieNazwisko} | login: ${p.user.login} | id: ${p.id}`));

console.log('\n=== SEZONY ===');
sezony.forEach(s => console.log(`  ${s.nazwa} | aktywny: ${s.aktywny} | id: ${s.id}`));

await prisma.$disconnect();
