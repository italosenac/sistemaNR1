import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PAPEIS_USUARIO } from '@sistemanr1/contratos';
import type {
  CadastroUsuario,
  EntradaVinculo,
  PapelUsuario,
  VincularUsuario,
} from '@sistemanr1/contratos';
export function aparar({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}
export function opcional({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() || null : value;
}
export class LotacaoDto {
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  estabelecimentoId?: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  setorId?: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  funcaoId?: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  turnoId?: string | null;
}
export class EntradaVinculoDto extends LotacaoDto implements EntradaVinculo {
  @ApiPropertyOptional({ maxLength: 50, nullable: true })
  @Transform(opcional)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  matriculaFuncional?: string | null;
  @ApiProperty({ enum: PAPEIS_USUARIO, isArray: true })
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(4)
  @IsIn(PAPEIS_USUARIO, { each: true })
  papeis!: PapelUsuario[];
  @ApiProperty({ minLength: 3, maxLength: 500 })
  @Transform(aparar)
  @IsString()
  @Length(3, 500)
  motivo!: string;
}
export class CadastroUsuarioDto
  extends EntradaVinculoDto
  implements CadastroUsuario
{
  @ApiProperty({ minLength: 3, maxLength: 150 })
  @Transform(aparar)
  @IsString()
  @Length(3, 150)
  nomeCompleto!: string;
  @ApiProperty({ format: 'email', maxLength: 254 })
  @Transform(aparar)
  @IsEmail()
  @MaxLength(254)
  email!: string;
  @ApiProperty({
    format: 'password',
    writeOnly: true,
    minLength: 12,
    maxLength: 128,
  })
  @IsString()
  @Length(12, 128)
  senha!: string;
}
export class VincularUsuarioDto
  extends EntradaVinculoDto
  implements VincularUsuario
{
  @ApiProperty({ format: 'uuid' }) @IsUUID() usuarioId!: string;
}
