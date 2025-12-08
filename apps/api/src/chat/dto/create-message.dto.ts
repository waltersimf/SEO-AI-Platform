export class CreateMessageDto {
  chatId: string;
  authorId: string;
  content: string;
  replyToId?: string;
}