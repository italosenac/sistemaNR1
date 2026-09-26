import { Transform } from 'class-transformer';
import {
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

function aparar({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class EntradaVinculoDto implements EntradaVinculo {
  @ApiProperty({ maxLength: 50 })
  @Transform(aparar)
  @IsString()
  @Length(1, 50)
  matriculaFuncional!: string;

  @ApiProperty({ enum: PAPEIS_USUARIO })
  @IsIn(PAPEIS_USUARIO)
  papel!: PapelUsuario;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  estabelecimentoId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  setorId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  funcaoId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  turnoId?: string;
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
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  usuarioId!: string;
}
