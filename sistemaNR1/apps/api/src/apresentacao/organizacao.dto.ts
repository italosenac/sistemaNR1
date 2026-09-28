import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PAPEIS_USUARIO } from '@sistemanr1/contratos';
import type { PapelUsuario, StatusCadastro } from '@sistemanr1/contratos';
import { aparar, opcional, LotacaoDto } from './usuarios.dto.js';
export class PerfilDto {
  @ApiProperty({ minLength: 3, maxLength: 150 })
  @Transform(aparar)
  @IsString()
  @Length(3, 150)
  nomeCompleto!: string;
}
export class EmpresaDto {
  @ApiProperty({ minLength: 3, maxLength: 150 })
  @Transform(aparar)
  @IsString()
  @Length(3, 150)
  razaoSocial!: string;
  @ApiPropertyOptional()
  @Transform(opcional)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nomeFantasia?: string | null;
  @ApiPropertyOptional()
  @Transform(opcional)
  @IsOptional()
  @IsString()
  @MaxLength(18)
  cnpj?: string | null;
  @ApiPropertyOptional()
  @Transform(opcional)
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  emailCorporativo?: string | null;
  @ApiPropertyOptional()
  @Transform(opcional)
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefone?: string | null;
}
export class EditarEmpresaDto extends EmpresaDto {
  @ApiProperty({ enum: ['ativo', 'inativo'] })
  @IsIn(['ativo', 'inativo'])
  status!: StatusCadastro;
}
export class EstruturaDto extends LotacaoDto {
  @ApiProperty({ maxLength: 150 })
  @Transform(aparar)
  @IsString()
  @Length(1, 150)
  nome!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descricao?: string;
  @ApiPropertyOptional()
  @Transform(opcional)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  endereco?: string | null;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  caracterizacaoAmbiente?: string;
  @ApiPropertyOptional()
  @Transform(opcional)
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  horarioInicio?: string | null;
  @ApiPropertyOptional()
  @Transform(opcional)
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  horarioFim?: string | null;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000000)
  quantidadeEstimadaTrabalhadores?: number;
  @ApiProperty({ enum: ['ativo', 'inativo'] })
  @IsIn(['ativo', 'inativo'])
  status!: StatusCadastro;
}
export class EditarVinculoDto {
  @ApiPropertyOptional({ nullable: true })
  @Transform(opcional)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  matriculaFuncional?: string | null;
  @ApiProperty({ enum: ['ativo', 'inativo'] })
  @IsIn(['ativo', 'inativo'])
  status!: StatusCadastro;
}
export class SalvarLotacaoDto extends LotacaoDto {
  @ApiProperty({ enum: ['ativo', 'inativo'] })
  @IsIn(['ativo', 'inativo'])
  status!: StatusCadastro;
}
export class MotivoDto {
  @ApiProperty({ minLength: 3, maxLength: 500 })
  @Transform(aparar)
  @IsString()
  @Length(3, 500)
  motivo!: string;
}
export class PapelDto extends MotivoDto {
  @ApiProperty({ enum: PAPEIS_USUARIO })
  @IsIn(PAPEIS_USUARIO)
  papel!: PapelUsuario;
}
export class ProfissionalDto {
  @ApiProperty()
  @Transform(aparar)
  @IsString()
  @Length(1, 100)
  conselho!: string;
  @ApiProperty()
  @Transform(aparar)
  @IsString()
  @Length(1, 50)
  numeroRegistro!: string;
  @ApiPropertyOptional({ nullable: true })
  @Transform(opcional)
  @IsOptional()
  @Matches(/^[A-Z]{2}$/)
  uf?: string | null;
}
export class CongelarDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() estabelecimentoId!: string;
}
