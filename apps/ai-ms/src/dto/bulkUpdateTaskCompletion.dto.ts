import { IsString, IsArray, IsNumber, IsBoolean } from 'class-validator';

export class BulkUpdateTaskCompletionDto {

    @IsString()
     userId: string 
     
    @IsString()
     dayName: string 

    @IsArray()
     taskIds: string[]

    @IsBoolean()
     completed: boolean 
     
    @IsNumber()
     actualStudyTime?: number 
}
