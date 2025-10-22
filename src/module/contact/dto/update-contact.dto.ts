import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ContactStatusEnum, CreateContactDto } from './create-contact.dto';
import { IsEnum, IsNumberString, IsOptional } from 'class-validator';

export class UpdateContactDto extends PartialType(CreateContactDto) {
  @IsOptional()
  @IsEnum(ContactStatusEnum)
  status?: ContactStatusEnum;
}

export class ContactFilterDto {
  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumberString()
  skip?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumberString()
  take?: string;

  @ApiPropertyOptional({ enum: ContactStatusEnum })
  @IsOptional()
  @IsEnum(ContactStatusEnum)
  status?: ContactStatusEnum;
}