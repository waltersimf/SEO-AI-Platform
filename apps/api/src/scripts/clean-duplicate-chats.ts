import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ChatWithMembers {
  id: string;
  organizationId: string;
  createdAt: Date;
  members: Array<{ userId: string }>;
}

async function cleanDuplicateChats() {
  console.log('🔍 Searching for duplicate direct chats...\n');

  try {
    // Get all direct chats with their members
    const directChats = await prisma.chat.findMany({
      where: {
        type: 'direct',
      },
      include: {
        members: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Found ${directChats.length} direct chats total\n`);

    // Group chats by organizationId and member pair
    const chatGroups = new Map<string, ChatWithMembers[]>();

    for (const chat of directChats) {
      // Skip if not exactly 2 members (should be direct chat)
      if (chat.members.length !== 2) {
        console.log(`⚠️  Skipping chat ${chat.id} - has ${chat.members.length} members (expected 2)`);
        continue;
      }

      // Create a unique key: organizationId + sorted user IDs
      const userIds = chat.members.map(m => m.userId).sort();
      const key = `${chat.organizationId}:${userIds.join(':')}`;

      if (!chatGroups.has(key)) {
        chatGroups.set(key, []);
      }

      chatGroups.get(key)!.push(chat);
    }

    // Find and delete duplicates
    let totalDeleted = 0;
    let duplicateGroups = 0;

    for (const [key, chats] of chatGroups.entries()) {
      if (chats.length > 1) {
        duplicateGroups++;
        console.log(`\n📊 Found ${chats.length} duplicate chats for ${key}`);

        // Sort by createdAt desc (newest first) - already sorted from query
        // Keep the first one (newest), delete the rest
        const [newestChat, ...oldChats] = chats;

        console.log(`   ✅ Keeping chat ${newestChat.id} (created: ${newestChat.createdAt.toISOString()})`);

        for (const oldChat of oldChats) {
          console.log(`   🗑️  Deleting chat ${oldChat.id} (created: ${oldChat.createdAt.toISOString()})`);

          // Delete the chat (cascade will delete members and messages)
          await prisma.chat.delete({
            where: { id: oldChat.id },
          });

          totalDeleted++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✨ Cleanup complete!`);
    console.log(`   Duplicate groups found: ${duplicateGroups}`);
    console.log(`   Chats deleted: ${totalDeleted}`);
    console.log(`   Chats remaining: ${directChats.length - totalDeleted}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error cleaning duplicate chats:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
cleanDuplicateChats()
  .then(() => {
    console.log('\n✅ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
