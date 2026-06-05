import { IsString, MinLength } from 'class-validator';

export class IntrospectTokenDto {
  @IsString()
  @MinLength(1)
  token!: string;
}
