import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class FlashCardStats {
  @IsInt()
  @IsNotEmpty()
  totalSets: number;

  @IsInt()
  @IsNotEmpty()
  totalCards: number;

  @IsInt()
  @IsNotEmpty()
  thisWeek: number;
}
