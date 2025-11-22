import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // ID твоєї TestOrg організації
  const orgId = 'cmi5xqiy2000d8wcask8qb9i2';

  const users = [
    { email: 'frank@test.com', name: 'Frank Wilson', password: 'password123' }, // ← ДОДАТИ ЦЕЙ РЯДОК
 ];

  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        passwordHash: hashedPassword,
        organizationId: orgId,
        role: 'admin',
      },
    });
    
    console.log(`✅ Created user: ${user.name} (${user.email})`);
  }

  console.log('\n🎉 Done! Created 4 users in TestOrg');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });