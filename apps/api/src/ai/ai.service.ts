import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { AiContext } from './ai-context.service';

export interface TaskParseResult {
  isTaskRequest: boolean;
  task?: {
    title: string;
    description?: string;
    assigneeName?: string;
    projectName?: string;
    dueDate?: string;
    scheduledTime?: string; // Time in HH:MM format (e.g., "11:00", "14:30")
    priority?: 'low' | 'medium' | 'high' | 'critical';
    estimatedTime?: number;
    recurrenceRule?: 'daily' | 'weekly' | 'monthly'; // Recurring task pattern
  };
  message?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly anthropic: Anthropic | null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');

    if (!apiKey || apiKey === 'sk-ant-your-key-here') {
      this.logger.warn(
        '⚠️  ANTHROPIC_API_KEY not configured. AI features will be disabled.',
      );
      this.anthropic = null;
    } else {
      this.anthropic = new Anthropic({
        apiKey,
      });
      this.logger.log('✅ Claude API initialized');
    }
  }

  /**
   * Generate a response using Claude AI with conversation history
   */
  async generateResponse(currentMessage: string, context: AiContext): Promise<string> {
    if (!this.anthropic) {
      this.logger.warn('AI service not configured, returning fallback message');
      return 'AI assistant is currently unavailable. Please configure ANTHROPIC_API_KEY.';
    }

    try {
      const model = this.configService.get<string>('AI_MODEL') || 'claude-sonnet-4-20250514';
      const maxTokens = this.configService.get<number>('AI_MAX_TOKENS') || 4096;
      const temperature = this.configService.get<number>('AI_TEMPERATURE') || 0.7;

      const systemPrompt = this.buildSystemPrompt(context);

      // Build messages array from conversation history
      const messages: Anthropic.MessageParam[] = [];

      // Add conversation history (excluding the current message which we'll add separately)
      for (const msg of context.conversationHistory) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }

      // Add the current user message
      messages.push({
        role: 'user',
        content: currentMessage,
      });

      this.logger.debug(
        `Generating AI response with model: ${model}, history: ${context.conversationHistory.length} messages`,
      );

      const response = await this.anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages,
      });

      // Extract text content from the response
      const textContent = response.content
        .filter((block) => block.type === 'text')
        .map((block) => ('text' in block ? block.text : ''))
        .join('\n');

      return textContent || 'I apologize, but I was unable to generate a response.';
    } catch (error) {
      this.logger.error('Error generating AI response:', error);
      return 'I apologize, but I encountered an error while processing your request. Please try again.';
    }
  }

  /**
   * Build system prompt for the AI assistant
   */
  private buildSystemPrompt(context: AiContext): string {
    let prompt = `You are an AI assistant for Forgeline, an SEO platform that helps teams collaborate on SEO projects.

Your role is to:
- Help with SEO-related questions and analysis
- Provide insights on search engine optimization strategies
- Assist with understanding Google Search Console data
- Guide users on best practices for website optimization
- Answer questions about SEO metrics and performance

Be concise, professional, and helpful. When discussing SEO topics:
- Provide actionable recommendations
- Explain technical concepts in an accessible way
- Reference data and metrics when relevant
- Stay up-to-date with current SEO best practices

Always maintain a friendly and supportive tone.`;

    // Add participants information if available
    if (context.participants && context.participants.length > 0) {
      const participantNames = context.participants
        .filter((p) => !p.isAI)
        .map((p) => p.name)
        .join(', ');

      if (participantNames) {
        prompt += `\n\nYou are chatting with: ${participantNames}`;
      }
    }

    return prompt;
  }

  /**
   * Check if the AI service is properly configured
   */
  isConfigured(): boolean {
    return this.anthropic !== null;
  }

  /**
   * Detect if the user message contains a task creation intent
   */
  hasTaskCreationIntent(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const taskKeywords = [
      // English
      'create task', 'assign task', 'add task', 'new task', 'make a task',
      'schedule task', 'set up task', 'create a ticket', 'add to backlog',
      // Ukrainian
      'постав задачу', 'створи таск', 'створи задачу', 'додай задачу',
      'запиши задачу', 'створи завдання', 'додай завдання',
      // Russian
      'создай задачу', 'поставь задачу', 'добавь задачу',
    ];

    return taskKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Detect if the user message contains an auto-plan intent
   */
  hasAutoPlanIntent(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const autoPlanKeywords = [
      // Ukrainian
      'розплануй', 'розпланувати', 'заплануй', 'запланувати',
      'розподіли задачі', 'розкидай задачі', 'сплануй мої задачі',
      'сплануй задачі', 'сплануй тиждень', 'розплануй тиждень',
      // Russian
      'распланируй', 'распланировать', 'запланируй', 'запланировать',
      'распредели задачи', 'раскидай задачи', 'спланируй задачи',
      'спланируй неделю', 'распланируй неделю',
      // English
      'auto-plan', 'autoplan', 'auto plan',
      'schedule my tasks', 'plan my week', 'plan my backlog',
      'plan my tasks', 'schedule backlog', 'schedule my week',
      'auto schedule', 'autoschedule', 'auto-schedule',
    ];

    return autoPlanKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Parse a message to extract task data using Claude AI
   */
  async parseTaskFromMessage(
    message: string,
    _context: AiContext,
    participants: Array<{ id: string; name: string; isAI: boolean }>,
    projects: Array<{ id: string; name: string }>,
  ): Promise<TaskParseResult> {
    if (!this.anthropic) {
      this.logger.warn('AI service not configured, cannot parse task');
      return { isTaskRequest: false };
    }

    // Check for task creation intent first
    if (!this.hasTaskCreationIntent(message)) {
      return { isTaskRequest: false };
    }

    try {
      const model = this.configService.get<string>('AI_MODEL') || 'claude-sonnet-4-20250514';

      // Build list of available assignees and projects
      const availableAssignees = participants
        .filter(p => !p.isAI)
        .map(p => p.name)
        .join(', ');

      const availableProjects = projects.map(p => p.name).join(', ');

      const taskParsingPrompt = `You are a task extraction assistant. The user wants to create a task from their message.

Available team members: ${availableAssignees || 'None specified'}
Available projects: ${availableProjects || 'None specified'}

Today's date is ${new Date().toISOString().split('T')[0]}.

Extract the following from the user's message:
- title: A concise task name (required, generate one if not explicit)
- description: Additional details about the task (optional)
- assigneeName: Person's name from available team members, or "me" if user refers to themselves (optional)
- projectName: Project name from available projects if mentioned (optional)
- dueDate: Deadline in ISO format YYYY-MM-DD. Parse relative dates like "friday", "next week", "tomorrow", "in 3 days" (optional)
- scheduledTime: Time in HH:MM 24-hour format. Parse from phrases like "о 11:00", "at 2pm", "в 14:30", "at noon" (optional)
- priority: One of "low", "medium", "high", "critical" based on urgency words (optional, default to "medium")
- estimatedTime: Hours as a number if mentioned (optional)
- recurrenceRule: Extract recurring pattern if mentioned. MUST be one of: "daily", "weekly", "monthly" or omit if not recurring.
  Patterns to detect:
  - Daily: "щодня", "кожен день", "каждый день", "daily", "every day", "ежедневно"
  - Weekly: "щотижня", "кожен тиждень", "каждую неделю", "weekly", "every week", "еженедельно"
  - Monthly: "щомісяця", "кожен місяць", "каждый месяц", "monthly", "every month", "ежемесячно"

IMPORTANT:
- Return ONLY valid JSON, no markdown code blocks
- If it's not a clear task creation request, return {"isTaskRequest": false}
- For assigneeName, match to available team members if possible
- For scheduledTime, convert 12-hour format to 24-hour (e.g., "2pm" → "14:00", "noon" → "12:00")

User message: "${message}"

Response format:
{"isTaskRequest": true, "task": {"title": "...", "description": "...", "assigneeName": "...", "projectName": "...", "dueDate": "...", "scheduledTime": "...", "priority": "...", "estimatedTime": ..., "recurrenceRule": "..."}}`;

      const response = await this.anthropic.messages.create({
        model,
        max_tokens: 1000,
        temperature: 0.1, // Low temperature for consistent extraction
        messages: [
          {
            role: 'user',
            content: taskParsingPrompt,
          },
        ],
      });

      // Extract text content
      const textContent = response.content
        .filter(block => block.type === 'text')
        .map(block => ('text' in block ? block.text : ''))
        .join('');

      // Parse JSON response
      try {
        const result = JSON.parse(textContent.trim()) as TaskParseResult;
        this.logger.log(`Parsed task: ${JSON.stringify(result)}`);
        return result;
      } catch (parseError) {
        this.logger.error('Failed to parse task JSON:', parseError);
        return { isTaskRequest: false };
      }
    } catch (error) {
      this.logger.error('Error parsing task from message:', error);
      return { isTaskRequest: false };
    }
  }

  /**
   * Generate a task preview message for the user
   */
  generateTaskPreviewMessage(task: TaskParseResult['task'], language: 'en' | 'uk' = 'en'): string {
    if (!task) return '';

    const messages = {
      en: {
        preview: "Here's the task I'll create:",
        title: 'Title',
        assignee: 'Assignee',
        project: 'Project',
        dueDate: 'Due Date',
        scheduledTime: 'Scheduled Time',
        priority: 'Priority',
        estimatedTime: 'Estimated Time',
        hours: 'hours',
        description: 'Description',
        recurrence: 'Repeats',
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
      },
      uk: {
        preview: 'Ось задача яку я створю:',
        title: 'Назва',
        assignee: 'Виконавець',
        project: 'Проект',
        dueDate: 'Термін',
        scheduledTime: 'Запланований час',
        priority: 'Пріоритет',
        estimatedTime: 'Оцінка часу',
        hours: 'годин',
        description: 'Опис',
        recurrence: 'Повторення',
        daily: 'Щодня',
        weekly: 'Щотижня',
        monthly: 'Щомісяця',
      },
    };

    const t = messages[language];
    let preview = `${t.preview}\n\n`;
    preview += `**${t.title}:** ${task.title}\n`;

    if (task.assigneeName) preview += `**${t.assignee}:** ${task.assigneeName}\n`;
    if (task.projectName) preview += `**${t.project}:** ${task.projectName}\n`;
    if (task.dueDate) preview += `**${t.dueDate}:** ${task.dueDate}\n`;
    if (task.scheduledTime) preview += `**${t.scheduledTime}:** ${task.scheduledTime}\n`;
    if (task.priority) preview += `**${t.priority}:** ${task.priority}\n`;
    if (task.estimatedTime) preview += `**${t.estimatedTime}:** ${task.estimatedTime} ${t.hours}\n`;
    if (task.recurrenceRule) {
      const recurrenceLabel = t[task.recurrenceRule] || task.recurrenceRule;
      preview += `**${t.recurrence}:** ${recurrenceLabel}\n`;
    }
    if (task.description) preview += `\n**${t.description}:** ${task.description}\n`;

    return preview;
  }
}
