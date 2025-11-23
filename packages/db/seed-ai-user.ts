import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🤖 Starting AI user seed...\n');

  try {
    // Find the first organization
    const organization = await prisma.organization.findFirst();

    if (!organization) {
      console.error('❌ No organization found. Please create an organization first.');
      process.exit(1);
    }

    console.log(`📊 Found organization: ${organization.name} (${organization.id})`);

    // Check if AI user already exists
    const existingAiUser = await prisma.user.findUnique({
      where: { email: 'ai@forgeline.ai' }
    });

    if (existingAiUser) {
      console.log('✅ AI user already exists:', existingAiUser.email);
      console.log(`   ID: ${existingAiUser.id}`);
      console.log(`   Name: ${existingAiUser.name}`);
      console.log(`   Model: ${existingAiUser.aiModel}`);
      return;
    }

    // Hash the impossible password
    const passwordHash = await bcrypt.hash('IMPOSSIBLE_TO_LOGIN', 10);

    // Create AI user
    const aiUser = await prisma.user.create({
      data: {
        email: 'ai@forgeline.ai',
        name: 'AI Assistant',
        passwordHash,
        organizationId: organization.id,
        role: 'ai_assistant',
        isAI: true,
        aiModel: 'claude-sonnet-4-20250514',
        avatar: '🤖',
        isOnline: true,
      }
    });

    console.log('\n✅ AI user created successfully!');
    console.log(`   Email: ${aiUser.email}`);
    console.log(`   Name: ${aiUser.name}`);
    console.log(`   ID: ${aiUser.id}`);
    console.log(`   Model: ${aiUser.aiModel}`);
    console.log(`   Avatar: ${aiUser.avatar}`);
    console.log(`   Role: ${aiUser.role}`);
    console.log(`   Online: ${aiUser.isOnline}`);

  } catch (error) {
    console.error('\n❌ Error creating AI user:', error);
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
