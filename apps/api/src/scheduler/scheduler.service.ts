import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { TaskService } from '../task/task.service';
import { ChatService } from '../chat/chat.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    private taskService: TaskService,
    private chatService: ChatService,
    private eventsGateway: EventsGateway,
  ) {}

  /**
   * Run every minute to check for scheduled auto-planning
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledAutoPlan() {
    try {
      const orgsToAutoPlan =
        await this.settingsService.getOrganizationsToAutoPlan();

      if (orgsToAutoPlan.length === 0) {
        return;
      }

      this.logger.log(
        `Found ${orgsToAutoPlan.length} organization(s) with scheduled auto-plan`,
      );

      for (const org of orgsToAutoPlan) {
        await this.runAutoPlanForOrganization(org);
      }
    } catch (error) {
      this.logger.error('Error in scheduled auto-plan:', error);
    }
  }

  /**
   * Run auto-plan for a specific organization
   */
  private async runAutoPlanForOrganization(org: {
    organizationId: string;
    notifyBeforeApply: boolean;
    autoApply: boolean;
  }) {
    try {
      this.logger.log(`Running auto-plan for organization ${org.organizationId}`);

      // Get all users in the organization (excluding AI)
      const users = await this.prisma.user.findMany({
        where: {
          organizationId: org.organizationId,
          isAI: false,
        },
        select: {
          id: true,
          name: true,
        },
      });

      // Find the AI user for this organization
      const aiUser = await this.prisma.user.findFirst({
        where: {
          organizationId: org.organizationId,
          isAI: true,
        },
      });

      if (!aiUser) {
        this.logger.warn(
          `No AI user found for organization ${org.organizationId}, skipping auto-plan`,
        );
        return;
      }

      // Process each user
      for (const user of users) {
        await this.runAutoPlanForUser(
          org.organizationId,
          user.id,
          user.name,
          aiUser.id,
          org.notifyBeforeApply,
          org.autoApply,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error running auto-plan for org ${org.organizationId}:`,
        error,
      );
    }
  }

  /**
   * Run auto-plan for a specific user
   */
  private async runAutoPlanForUser(
    organizationId: string,
    userId: string,
    userName: string,
    aiUserId: string,
    notifyBeforeApply: boolean,
    autoApply: boolean,
  ) {
    try {
      this.logger.log(
        `Generating auto-plan for user ${userName} (${userId})`,
      );

      // Generate the plan
      const planResult = await this.taskService.generateAutoPlan(
        organizationId,
        userId,
      );

      if (planResult.totalTasksPlanned === 0) {
        this.logger.log(`No tasks to plan for user ${userName}`);
        return;
      }

      this.logger.log(
        `Generated plan: ${planResult.totalTasksPlanned} tasks for user ${userName}`,
      );

      // Find or create direct chat between user and AI
      let chat = await this.prisma.chat.findFirst({
        where: {
          organizationId,
          type: 'direct',
          members: {
            every: {
              userId: {
                in: [userId, aiUserId],
              },
            },
          },
        },
        include: {
          members: true,
        },
      });

      // If no direct chat exists, create one
      if (!chat || chat.members.length !== 2) {
        chat = await this.prisma.chat.create({
          data: {
            organizationId,
            type: 'direct',
            members: {
              create: [{ userId }, { userId: aiUserId }],
            },
          },
          include: {
            members: true,
          },
        });
        this.logger.log(`Created new direct chat for auto-plan notification`);
      }

      if (autoApply && !notifyBeforeApply) {
        // Apply automatically without preview
        await this.taskService.applyAutoPlan(organizationId, planResult.plan);

        // Send confirmation message
        const confirmMessage = `✅ **Автоматичне планування виконано!**\n\n📋 Заплановано **${planResult.totalTasksPlanned}** задач на найближчі ${planResult.weeks?.length || 0} тижні.\n\nПерегляньте календар задач, щоб побачити розклад.`;

        await this.chatService.createAIMessage(
          chat.id,
          aiUserId,
          confirmMessage,
          'system',
          {},
        );

        // Emit event to refresh tasks
        this.eventsGateway.emitTasksUpdated(organizationId);

        this.logger.log(
          `Auto-plan applied automatically for user ${userName}`,
        );
      } else {
        // Send preview message with action buttons
        const totalHours = Object.values(planResult.summaryByDate || {}).reduce(
          (sum: number, h) => sum + (h as number),
          0,
        );

        const previewMessage = `📅 **Запланований авто-план**\n\n📋 Заплановано: **${planResult.totalTasksPlanned}** з ${planResult.totalTasksInBacklog} задач\n⏱️ Загальний час: **${totalHours}** годин\n📆 Період: ${planResult.weeks?.length || 0} тижні\n\n${
          planResult.unscheduledTasks && planResult.unscheduledTasks.length > 0
            ? `⚠️ ${planResult.unscheduledTasks.length} задач не вдалося запланувати\n\n`
            : ''
        }Натисніть "Apply Plan" щоб застосувати план.`;

        // Create auto-plan preview
        const autoPlanPreview = {
          type: 'auto_plan_preview',
          plan: planResult.plan,
          weeks: planResult.weeks,
          summaryByDate: planResult.summaryByDate,
          planStart: planResult.planStart,
          planEnd: planResult.planEnd,
          totalTasksPlanned: planResult.totalTasksPlanned,
          totalTasksInBacklog: planResult.totalTasksInBacklog,
          unscheduledTasks: planResult.unscheduledTasks || [],
          status: 'pending',
          isScheduled: true, // Mark as scheduled auto-plan
        };

        await this.chatService.createAIMessage(
          chat.id,
          aiUserId,
          previewMessage,
          'system',
          { autoPlanPreview },
        );

        this.logger.log(
          `Auto-plan preview sent to user ${userName} in chat ${chat.id}`,
        );
      }

      // Emit refresh_chat_list event
      this.eventsGateway.emitChatListRefresh(chat.id);
    } catch (error) {
      this.logger.error(
        `Error running auto-plan for user ${userId}:`,
        error,
      );
    }
  }
}
