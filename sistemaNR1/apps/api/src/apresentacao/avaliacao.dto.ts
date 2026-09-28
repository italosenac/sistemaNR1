import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PublicarCriterioDto {
  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  matriz!: Record<string, unknown>;
}

export class ConsequenciaDto {
  @IsString()
  @Length(3, 500)
  descricao!: string;

  @IsInt()
  @Min(1)
  @Max(3)
  magnitude!: number;
}

export class RegistrarAvaliacaoDto {
  @IsUUID() campanhaId!: string;
  @IsUUID() criterioId!: string;
  @IsIn(['sobrecarga_percebida', 'ritmo_percebido']) fatorId!: string;
  @IsIn(['grupo', 'estabelecimento']) escopoTipo!: 'grupo' | 'estabelecimento';
  @IsUUID() escopoId!: string;
  @IsString() @Length(3, 500) perigo!: string;
  @IsInt() @Min(1) @Max(3) severidade!: number;
  @IsInt() @Min(1) @Max(3) probabilidade!: number;
  @IsString() @Length(10, 1000) justificativaProbabilidade!: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsequenciaDto)
  consequencias!: ConsequenciaDto[];
  @IsInt() @Min(0) indiceDeterminante!: number;
  @IsOptional() @IsString() justificativaEmpate?: string;
  @IsBoolean() riscoEvidente!: boolean;
  @IsOptional() @IsString() medidaRegistrada?: string;
  @IsIn(['nenhuma', 'aep', 'aet']) ergonomia!: 'nenhuma' | 'aep' | 'aet';
  @IsOptional() @IsString() referenciaErgonomia?: string;
  @IsOptional()
  @IsIn(['manter', 'aprimorar', 'introduzir'])
  decisaoExcepcional?: 'manter' | 'aprimorar' | 'introduzir';
  @IsOptional() @IsString() justificativaExcecao?: string;
}
