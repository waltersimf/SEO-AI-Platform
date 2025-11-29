import { PrismaClient, TaskStatus, TaskPriority } from '@prisma/client';

const prisma = new PrismaClient();

// SEO domain task titles
const taskTitles = [
  'Fix 404 errors',
  'Update meta descriptions',
  'Keyword research for Q1',
  'Technical SEO audit',
  'Content optimization',
  'Backlink outreach campaign',
  'Core Web Vitals fix',
  'Add schema markup',
  'Improve internal linking',
  'Competitor analysis',
  'Fix duplicate content issues',
  'Optimize page load speed',
  'Mobile usability audit',
  'Create XML sitemap',
  'Fix broken links',
  'Optimize images for SEO',
  'Write blog post for target keyword',
  'Review Google Search Console data',
  'Disavow toxic backlinks',
  'Implement canonical tags',
  'Fix crawl errors',
  'Optimize title tags',
  'Add alt text to images',
  'Analyze organic traffic drop',
  'Set up rank tracking',
];

// Task descriptions mapped to titles
const taskDescriptions: Record<string, string> = {
  'Fix 404 errors': 'Identify and fix all 404 error pages reported in GSC. Implement proper redirects where needed.',
  'Update meta descriptions': 'Review and update meta descriptions for top 50 pages to improve CTR.',
  'Keyword research for Q1': 'Conduct comprehensive keyword research for Q1 content calendar.',
  'Technical SEO audit': 'Full technical audit including crawlability, indexation, and site structure.',
  'Content optimization': 'Optimize existing content based on keyword gap analysis.',
  'Backlink outreach campaign': 'Execute link building campaign targeting high DA sites in our niche.',
  'Core Web Vitals fix': 'Address LCP, FID, and CLS issues identified in PageSpeed Insights.',
  'Add schema markup': 'Implement structured data for products, FAQs, and organization.',
  'Improve internal linking': 'Audit and improve internal linking structure for better PageRank flow.',
  'Competitor analysis': 'Deep dive analysis of top 5 competitors SEO strategies.',
  'Fix duplicate content issues': 'Resolve duplicate content problems using canonical tags or redirects.',
  'Optimize page load speed': 'Improve page speed scores by optimizing assets and server response.',
  'Mobile usability audit': 'Ensure all pages pass mobile-friendly tests.',
  'Create XML sitemap': 'Generate and submit updated XML sitemap to search engines.',
  'Fix broken links': 'Find and fix all internal and external broken links.',
  'Optimize images for SEO': 'Compress images and add proper alt attributes.',
  'Write blog post for target keyword': 'Create SEO-optimized content targeting primary keyword.',
  'Review Google Search Console data': 'Analyze GSC data for opportunities and issues.',
  'Disavow toxic backlinks': 'Identify and disavow harmful backlinks affecting domain authority.',
  'Implement canonical tags': 'Add canonical tags to prevent duplicate content issues.',
  'Fix crawl errors': 'Resolve crawl errors reported by search engine bots.',
  'Optimize title tags': 'Review and optimize title tags for better rankings and CTR.',
  'Add alt text to images': 'Add descriptive alt text to all images for accessibility and SEO.',
  'Analyze organic traffic drop': 'Investigate recent organic traffic decline and create action plan.',
  'Set up rank tracking': 'Configure rank tracking for target keywords across search engines.',
};

// Estimated times in hours
const estimatedTimes = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8];

// Tags
const tagOptions = [
  ['technical-seo'],
  ['content'],
  ['link-building'],
  ['analytics'],
  ['on-page'],
  ['off-page'],
  ['technical-seo', 'urgent'],
  ['content', 'blog'],
  ['link-building', 'outreach'],
  ['analytics', 'reporting'],
];

// Helper function to get random item from array
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper function to get random date in range (Nov 25-29, 2025)
function randomScheduledDate(): Date {
  const startDate = new Date('2025-11-25');
  const dayOffset = Math.floor(Math.random() * 5); // 0-4 days
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayOffset);
  // Set random hour between 9 AM and 5 PM
  date.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);
  return date;
}

async function main() {
  console.log('Starting task seed...\n');

  // 1. Find first organization
  const organization = await prisma.organization.findFirst();

  if (!organization) {
    console.error('No organization found. Please create an organization first.');
    process.exit(1);
  }

  console.log(`Found organization: ${organization.name} (${organization.id})`);

  // 2. Find users in that organization
  const users = await prisma.user.findMany({
    where: { organizationId: organization.id },
  });

  if (users.length === 0) {
    console.error('No users found in the organization. Please create users first.');
    process.exit(1);
  }

  console.log(`Found ${users.length} users in organization`);

  // 3. Find projects in that organization
  const projects = await prisma.project.findMany({
    where: {
      organizationId: organization.id,
      isDeleted: false,
    },
  });

  console.log(`Found ${projects.length} projects in organization`);

  // 4. Create 20 tasks with random combinations
  const tasksToCreate = 20;
  const createdTasks: string[] = [];

  // Shuffle titles to get unique ones
  const shuffledTitles = [...taskTitles].sort(() => Math.random() - 0.5).slice(0, tasksToCreate);

  for (let i = 0; i < tasksToCreate; i++) {
    const title = shuffledTitles[i];
    const description = taskDescriptions[title] || `Task description for: ${title}`;

    // Random status: 60% backlog, 40% scheduled
    const isScheduled = Math.random() < 0.4;
    const status: TaskStatus = isScheduled ? 'scheduled' : 'backlog';

    // Random priority with weighted distribution
    const priorityRoll = Math.random();
    let priority: TaskPriority;
    if (priorityRoll < 0.3) priority = 'low';
    else if (priorityRoll < 0.6) priority = 'medium';
    else if (priorityRoll < 0.85) priority = 'high';
    else priority = 'critical';

    // Random user assignment (80% assigned, 20% unassigned)
    const assignedTo = Math.random() < 0.8 ? randomItem(users) : null;

    // Random project assignment (70% assigned to project, 30% org-level)
    const project = projects.length > 0 && Math.random() < 0.7 ? randomItem(projects) : null;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        estimatedTime: randomItem(estimatedTimes),
        scheduledDate: isScheduled ? randomScheduledDate() : null,
        tags: randomItem(tagOptions),
        assignedToId: assignedTo?.id,
        createdById: randomItem(users).id,
        projectId: project?.id,
        organizationId: organization.id,
      },
    });

    createdTasks.push(task.id);

    const assigneeInfo = assignedTo ? assignedTo.name : 'Unassigned';
    const projectInfo = project ? project.name : 'No project';
    const scheduleInfo = isScheduled ? `Scheduled` : 'Backlog';

    console.log(`  [${i + 1}/${tasksToCreate}] ${title}`);
    console.log(`      Priority: ${priority} | Status: ${scheduleInfo} | Assignee: ${assigneeInfo} | Project: ${projectInfo}`);
  }

  console.log(`\nSuccessfully created ${createdTasks.length} tasks!`);

  // Summary
  const summary = await prisma.task.groupBy({
    by: ['status'],
    where: { id: { in: createdTasks } },
    _count: true,
  });

  console.log('\nTask summary by status:');
  summary.forEach((s) => {
    console.log(`  ${s.status}: ${s._count}`);
  });

  const prioritySummary = await prisma.task.groupBy({
    by: ['priority'],
    where: { id: { in: createdTasks } },
    _count: true,
  });

  console.log('\nTask summary by priority:');
  prioritySummary.forEach((p) => {
    console.log(`  ${p.priority}: ${p._count}`);
  });
}

main()
  .catch((e) => {
    console.error('Error seeding tasks:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
