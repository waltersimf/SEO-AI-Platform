import { IsString, IsNotEmpty } from 'class-validator';

export class AiQueryDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
