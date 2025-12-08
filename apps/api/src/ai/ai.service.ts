import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { AiContext } from './ai-context.service';
import { AhrefsService } from '../integrations/ahrefs.service';
import { SerpstatService } from '../integrations/serpstat.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { GscService } from '../gsc/gsc.service';
import { ProjectsService } from '../projects/projects.service';
import { AnalyticsService } from '../analytics/analytics.service';

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

// SEO Tools definitions for Claude
const SEO_TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_domain_metrics',
    description: 'Get SEO metrics for a domain using Ahrefs API. Returns Domain Rating, URL Rating, backlinks count, referring domains, organic keywords and traffic estimates.',
    input_schema: {
      type: 'object' as const,
      properties: {
        domain: {
          type: 'string',
          description: 'The domain to analyze (e.g., "example.com" or "https://example.com")',
        },
      },
      required: ['domain'],
    },
  },
  {
    name: 'get_organic_keywords',
    description: 'Get organic keywords that a domain ranks for using Ahrefs API. Returns keywords with search volume, difficulty, CPC, position and traffic.',
    input_schema: {
      type: 'object' as const,
      properties: {
        domain: {
          type: 'string',
          description: 'The domain to analyze',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of keywords to return (default: 20, max: 100)',
        },
        country: {
          type: 'string',
          description: 'Country code for search results (default: "us")',
        },
      },
      required: ['domain'],
    },
  },
  {
    name: 'get_serpstat_overview',
    description: 'Get domain overview from Serpstat API. Returns visibility index, organic traffic, keywords count, ad data and Serpstat rank.',
    input_schema: {
      type: 'object' as const,
      properties: {
        domain: {
          type: 'string',
          description: 'The domain to analyze',
        },
        search_engine: {
          type: 'string',
          description: 'Search engine code (e.g., "g_us" for Google US, "g_ua" for Google Ukraine)',
        },
      },
      required: ['domain'],
    },
  },
  {
    name: 'get_serpstat_keywords',
    description: 'Get keywords that a domain ranks for using Serpstat API. Returns keywords with position, volume, CPC and competition.',
    input_schema: {
      type: 'object' as const,
      properties: {
        domain: {
          type: 'string',
          description: 'The domain to analyze',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of keywords to return (default: 20)',
        },
        search_engine: {
          type: 'string',
          description: 'Search engine code (default: "g_us")',
        },
      },
      required: ['domain'],
    },
  },
  // Google Search Console tools
  {
    name: 'get_gsc_performance',
    description: 'Get overall search performance metrics from Google Search Console for a domain. Returns total clicks, impressions, CTR percentage, and average position for the specified date range.',
    input_schema: {
      type: 'object' as const,
      properties: {
        domain: {
          type: 'string',
          description: 'The domain/site URL (e.g., "https://example.com" or "sc-domain:example.com")',
        },
        start_date: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format (default: 28 days ago)',
        },
        end_date: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format (default: today)',
        },
      },
      required: ['domain'],
    },
  },
  {
    name: 'get_gsc_top_queries',
    description: 'Get top search queries from Google Search Console. Shows which search terms bring traffic to the site, with clicks, impressions, CTR and average position for each query.',
    input_schema: {
      type: 'object' as const,
      properties: {
        domain: {
          type: 'string',
          description: 'The domain/site URL (e.g., "https://example.com" or "sc-domain:example.com")',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of queries to return (default: 20, max: 100)',
        },
        start_date: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format (default: 28 days ago)',
        },
        end_date: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format (default: today)',
        },
      },
      required: ['domain'],
    },
  },
  {
    name: 'get_gsc_top_pages',
    description: 'Get top pages from Google Search Console. Shows which pages get the most search traffic, with clicks, impressions, CTR and average position for each page.',
    input_schema: {
      type: 'object' as const,
      properties: {
        domain: {
          type: 'string',
          description: 'The domain/site URL (e.g., "https://example.com" or "sc-domain:example.com")',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of pages to return (default: 20, max: 100)',
        },
        start_date: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format (default: 28 days ago)',
        },
        end_date: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format (default: today)',
        },
      },
      required: ['domain'],
    },
  },
  // Google Analytics 4 tools
  {
    name: 'get_ga4_overview',
    description: 'Get Google Analytics 4 overview metrics including total users, new users, sessions, pageviews, average session duration, and engagement rate for the specified date range. If property_id is not provided, the system will auto-detect it from the project settings.',
    input_schema: {
      type: 'object' as const,
      properties: {
        property_id: {
          type: 'string',
          description: 'The GA4 property ID (e.g., "properties/123456789"). Optional - will be auto-detected from project if not provided.',
        },
        domain: {
          type: 'string',
          description: 'The domain to look up GA4 property for (e.g., "example.com"). Used for auto-detection when property_id is not provided.',
        },
        start_date: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format (default: 28 days ago)',
        },
        end_date: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format (default: today)',
        },
      },
      required: [],
    },
  },
  // Analytics tool
  {
    name: 'analyze_project_changes',
    description: 'Аналізує зміни метрик проекту за останній тиждень. Порівнює поточний тиждень з минулим та виявляє значні зміни (>=10%). Використовуй коли користувач питає про зміни, тренди, аналіз метрик, "що змінилось", "як справи з метриками".',
    input_schema: {
      type: 'object' as const,
      properties: {
        projectDomain: {
          type: 'string',
          description: 'Домен проекту для аналізу (наприклад: example.com)',
        },
      },
      required: ['projectDomain'],
    },
  },
];

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly anthropic: Anthropic | null;

  constructor(
    private readonly configService: ConfigService,
    private readonly ahrefsService: AhrefsService,
    private readonly serpstatService: SerpstatService,
    private readonly integrationsService: IntegrationsService,
    private readonly gscService: GscService,
    private readonly projectsService: ProjectsService,
    private readonly analyticsService: AnalyticsService,
  ) {
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
   * Get available SEO tools based on connected integrations
   */
  private async getAvailableTools(organizationId: string): Promise<Anthropic.Tool[]> {
    const availableTools: Anthropic.Tool[] = [];

    // Analytics tool is always available (uses internal data)
    availableTools.push(SEO_TOOLS.find(t => t.name === 'analyze_project_changes')!);

    // Check Ahrefs integration
    const ahrefsIntegration = await this.integrationsService.findOne(organizationId, 'ahrefs');
    if (ahrefsIntegration) {
      availableTools.push(
        SEO_TOOLS.find(t => t.name === 'get_domain_metrics')!,
        SEO_TOOLS.find(t => t.name === 'get_organic_keywords')!,
      );
    }

    // Check Serpstat integration
    const serpstatIntegration = await this.integrationsService.findOne(organizationId, 'serpstat');
    if (serpstatIntegration) {
      availableTools.push(
        SEO_TOOLS.find(t => t.name === 'get_serpstat_overview')!,
        SEO_TOOLS.find(t => t.name === 'get_serpstat_keywords')!,
      );
    }

    // Check Google integration (for GSC and GA4 tools)
    const googleIntegration = await this.integrationsService.findOne(organizationId, 'google');
    if (googleIntegration) {
      availableTools.push(
        SEO_TOOLS.find(t => t.name === 'get_gsc_performance')!,
        SEO_TOOLS.find(t => t.name === 'get_gsc_top_queries')!,
        SEO_TOOLS.find(t => t.name === 'get_gsc_top_pages')!,
        SEO_TOOLS.find(t => t.name === 'get_ga4_overview')!,
      );
    }

    return availableTools;
  }

  /**
   * Execute a tool call and return the result
   */
  private async executeTool(
    organizationId: string,
    toolName: string,
    toolInput: Record<string, unknown>,
  ): Promise<string> {
    try {
      switch (toolName) {
        case 'get_domain_metrics': {
          const result = await this.ahrefsService.getDomainMetrics(
            organizationId,
            toolInput.domain as string,
          );
          return JSON.stringify(result, null, 2);
        }

        case 'get_organic_keywords': {
          const result = await this.ahrefsService.getOrganicKeywords(
            organizationId,
            toolInput.domain as string,
            {
              limit: (toolInput.limit as number) || 20,
              country: (toolInput.country as string) || 'us',
            },
          );
          return JSON.stringify(result, null, 2);
        }

        case 'get_serpstat_overview': {
          const result = await this.serpstatService.getDomainOverview(
            organizationId,
            toolInput.domain as string,
            {
              searchEngine: toolInput.search_engine as string,
            },
          );
          return JSON.stringify(result, null, 2);
        }

        case 'get_serpstat_keywords': {
          const result = await this.serpstatService.getKeywords(
            organizationId,
            toolInput.domain as string,
            {
              limit: (toolInput.limit as number) || 20,
              searchEngine: toolInput.search_engine as string,
            },
          );
          return JSON.stringify(result, null, 2);
        }

        // Google Search Console tools
        case 'get_gsc_performance': {
          const endDate = (toolInput.end_date as string) || new Date().toISOString().split('T')[0];
          const startDate = (toolInput.start_date as string) || new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const result = await this.gscService.getPerformance(
            organizationId,
            toolInput.domain as string,
            startDate,
            endDate,
          );
          return JSON.stringify(result, null, 2);
        }

        case 'get_gsc_top_queries': {
          const result = await this.gscService.getTopQueries(
            organizationId,
            toolInput.domain as string,
            {
              limit: (toolInput.limit as number) || 20,
              startDate: toolInput.start_date as string,
              endDate: toolInput.end_date as string,
            },
          );
          return JSON.stringify(result, null, 2);
        }

        case 'get_gsc_top_pages': {
          const result = await this.gscService.getTopPages(
            organizationId,
            toolInput.domain as string,
            {
              limit: (toolInput.limit as number) || 20,
              startDate: toolInput.start_date as string,
              endDate: toolInput.end_date as string,
            },
          );
          return JSON.stringify(result, null, 2);
        }

        // Google Analytics 4 tools
        case 'get_ga4_overview': {
          let propertyId = toolInput.property_id as string | undefined;

          // Auto-detect property_id if not provided
          if (!propertyId) {
            this.logger.debug('GA4: property_id not provided, attempting auto-detection');

            // Try to find project by domain if provided
            const domain = toolInput.domain as string | undefined;
            if (domain) {
              const projects = await this.projectsService.findAll(organizationId);
              const matchingProject = projects.find(p =>
                p.domain && (
                  p.domain.includes(domain) ||
                  domain.includes(p.domain.replace(/^https?:\/\//, '').replace(/\/$/, ''))
                )
              );
              if (matchingProject?.gaPropertyId) {
                propertyId = matchingProject.gaPropertyId;
                this.logger.debug(`GA4: Auto-detected property_id ${propertyId} from project ${matchingProject.name}`);
              }
            }

            // If still no property_id, try to find any project with gaPropertyId
            if (!propertyId) {
              const projects = await this.projectsService.findAll(organizationId);
              const projectWithGa = projects.find(p => p.gaPropertyId);
              if (projectWithGa?.gaPropertyId) {
                propertyId = projectWithGa.gaPropertyId;
                this.logger.debug(`GA4: Using property_id ${propertyId} from first configured project ${projectWithGa.name}`);
              }
            }

            if (!propertyId) {
              return JSON.stringify({
                error: 'No GA4 Property ID found. Please configure GA4 Property ID in your project settings or provide it directly.',
              });
            }
          }

          const result = await this.gscService.getGa4Overview(
            organizationId,
            propertyId,
          );
          return JSON.stringify(result, null, 2);
        }

        // Analytics tool
        case 'analyze_project_changes': {
          const domain = toolInput.projectDomain as string;

          // Find project by domain
          const projects = await this.projectsService.findAll(organizationId);
          const project = projects.find(p =>
            p.domain && (
              p.domain.includes(domain) ||
              domain.includes(p.domain.replace(/^https?:\/\//, '').replace(/\/$/, ''))
            )
          );

          if (!project) {
            return JSON.stringify({
              error: `Проект з доменом "${domain}" не знайдено. Перевірте правильність домену.`,
            });
          }

          const analysis = await this.analyticsService.getDetailedAnalysis(project.id);

          return JSON.stringify({
            projectName: project.name,
            domain: project.domain,
            integrations: analysis.integrations,
            insights: analysis.insights,
            latestMetrics: analysis.latestMetrics,
            previousMetrics: analysis.previousMetrics,
            recommendations: analysis.recommendations,
          }, null, 2);
        }

        default:
          return JSON.stringify({ error: `Unknown tool: ${toolName}` });
      }
    } catch (error) {
      this.logger.error(`Error executing tool ${toolName}:`, error);
      return JSON.stringify({
        error: error instanceof Error ? error.message : 'Tool execution failed',
      });
    }
  }

  /**
   * Generate a response using Claude AI with conversation history and tool calling
   */
  async generateResponse(
    currentMessage: string,
    context: AiContext,
    organizationId?: string,
  ): Promise<string> {
    if (!this.anthropic) {
      this.logger.warn('AI service not configured, returning fallback message');
      return 'AI assistant is currently unavailable. Please configure ANTHROPIC_API_KEY.';
    }

    try {
      const model = this.configService.get<string>('AI_MODEL') || 'claude-sonnet-4-20250514';
      const maxTokens = this.configService.get<number>('AI_MAX_TOKENS') || 4096;
      const temperature = this.configService.get<number>('AI_TEMPERATURE') || 0.7;

      // Get available SEO tools based on connected integrations
      const availableTools = organizationId
        ? await this.getAvailableTools(organizationId)
        : [];

      const systemPrompt = this.buildSystemPrompt(context, availableTools.length > 0);

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
        `Generating AI response with model: ${model}, history: ${context.conversationHistory.length} messages, tools: ${availableTools.length}`,
      );

      // Initial API call (with tools if available)
      const requestParams: Anthropic.MessageCreateParams = {
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages,
      };

      if (availableTools.length > 0) {
        requestParams.tools = availableTools;
      }

      let response = await this.anthropic.messages.create(requestParams);

      // Handle tool use - loop until we get a final response
      while (response.stop_reason === 'tool_use' && organizationId) {
        const toolUseBlocks = response.content.filter(
          (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
        );

        if (toolUseBlocks.length === 0) break;

        // Add assistant's response with tool calls to messages
        messages.push({
          role: 'assistant',
          content: response.content,
        });

        // Execute all tools and collect results
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          this.logger.debug(`Executing tool: ${toolUse.name} with input: ${JSON.stringify(toolUse.input)}`);

          const result = await this.executeTool(
            organizationId,
            toolUse.name,
            toolUse.input as Record<string, unknown>,
          );

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: result,
          });
        }

        // Add tool results to messages
        messages.push({
          role: 'user',
          content: toolResults,
        });

        // Get next response from Claude
        response = await this.anthropic.messages.create({
          model,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages,
          tools: availableTools,
        });
      }

      // Extract text content from the final response
      const textContent = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
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
  private buildSystemPrompt(context: AiContext, hasTools: boolean = false): string {
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

    // Add SEO tools information if available
    if (hasTools) {
      prompt += `

You have access to SEO analysis tools. Depending on what integrations the user has connected, you may have:

**Аналітичний інструмент** (завжди доступний):
- analyze_project_changes: аналізує зміни метрик за тиждень, виявляє тренди та проблеми
- Коли користувач питає "проаналізуй", "що змінилось", "покажи тренди", "як справи з метриками" - використовуй цей інструмент

**Ahrefs/Serpstat tools** (for competitive analysis):
- Domain metrics, Domain Rating (DR), backlinks, referring domains
- Organic keywords a site ranks for
- SEO visibility, traffic estimates
- Competitor analysis

**Google Search Console tools** (for actual site performance data):
- Search performance metrics (clicks, impressions, CTR, average position)
- Top search queries that bring traffic to the site
- Top pages by search traffic

**Google Analytics 4 tools** (for website traffic and user behavior):
- Total users, new users, sessions
- Pageviews and average session duration
- Engagement rate and user behavior metrics

When a user asks about their site's performance, search traffic, or ranking queries - prefer using Google Search Console tools as they provide actual data from Google.

When a user asks about website traffic, user behavior, sessions, or general analytics - use Google Analytics 4 tools.

When a user asks about competitor analysis, domain authority, or third-party metrics - use Ahrefs or Serpstat tools.

When a user asks about changes, trends, or weekly analysis - use analyze_project_changes tool.

After getting the data:
- Present key metrics in a clear, structured format
- Highlight important insights and trends
- Compare to industry benchmarks when relevant
- Provide actionable recommendations based on the data

If a tool returns an error, inform the user and suggest they check their integration settings.`;
    }

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
