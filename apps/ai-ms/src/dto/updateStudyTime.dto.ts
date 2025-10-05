import { IsString,IsNumber } from "class-validator"


export class UpdateStudyTimeDto {
    @IsString()
    userId: string

    @IsNumber()
    actualStudyTime: number

    @IsString()
    dayName: string

}