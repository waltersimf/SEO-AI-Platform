import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🤖 Starting AI user seed for ALL organizations...\n');

  try {
    // Find all organizations
    const organizations = await prisma.organization.findMany();

    if (organizations.length === 0) {
      console.error('❌ No organizations found. Please create an organization first.');
      process.exit(1);
    }

    console.log(`📊 Found ${organizations.length} organization(s)\n`);

    // Hash the impossible password once
    const passwordHash = await bcrypt.hash('IMPOSSIBLE_TO_LOGIN', 10);

    let createdCount = 0;
    let skippedCount = 0;

    // Create AI user for each organization
    for (const organization of organizations) {
      console.log(`\n🔍 Processing organization: ${organization.name} (${organization.id})`);

      // Check if AI user already exists for this organization
      const existingAiUser = await prisma.user.findFirst({
        where: {
          organizationId: organization.id,
          isAI: true,
        }
      });

      if (existingAiUser) {
        console.log(`   ⏭️  AI user already exists in this organization`);
        console.log(`      Email: ${existingAiUser.email}`);
        console.log(`      ID: ${existingAiUser.id}`);
        skippedCount++;
        continue;
      }

      // Create AI user for this organization
      const aiUser = await prisma.user.create({
        data: {
          email: `ai-${organization.slug}@forgeline.ai`,
          name: 'AI Assistant',
          passwordHash,
          organizationId: organization.id,
          jobRole: 'ai_assistant',
          role: 'MEMBER',
          isAI: true,
          aiModel: 'claude-sonnet-4-20250514',
          avatar: '🤖',
          isOnline: true,
        }
      });

      console.log(`   ✅ AI user created successfully!`);
      console.log(`      Email: ${aiUser.email}`);
      console.log(`      ID: ${aiUser.id}`);
      console.log(`      Avatar: ${aiUser.avatar}`);
      createdCount++;
    }

    console.log(`\n\n📊 Summary:`);
    console.log(`   ✅ Created: ${createdCount} AI user(s)`);
    console.log(`   ⏭️  Skipped: ${skippedCount} (already existed)`);
    console.log(`   📝 Total organizations: ${organizations.length}`);

  } catch (error) {
    console.error('\n❌ Error creating AI users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
