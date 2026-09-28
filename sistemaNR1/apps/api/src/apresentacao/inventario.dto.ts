import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';

export class AlineasDto {
  @IsString() @Length(10, 4000) a!: string;
  @IsString() @Length(10, 4000) b!: string;
  @IsString() @Length(10, 4000) c!: string;
  @IsString() @Length(10, 4000) d!: string;
  @IsString() @Length(10, 4000) e!: string;
  @IsString() @Length(10, 4000) f!: string;
  @IsString() @Length(10, 4000) g!: string;
  @IsString() @Length(10, 4000) h!: string;
  @IsString() @Length(10, 4000) i!: string;
}

export class ItemPsicossocialDto {
  @IsUUID() avaliacaoId!: string;
  @ValidateNested() @Type(() => AlineasDto) alineas!: AlineasDto;
}

export class ItemGeralDto {
  @IsIn(['fisico', 'quimico', 'biologico', 'ergonomico', 'acidentes', 'outro'])
  categoria!: string;
  @IsString() @Length(10, 500) proveniencia!: string;
  @ValidateNested() @Type(() => AlineasDto) alineas!: AlineasDto;
}

export class ConsolidarInventarioDto {
  @IsUUID() estabelecimentoId!: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemPsicossocialDto)
  itensPsicossociais!: ItemPsicossocialDto[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemGeralDto)
  itensGerais!: ItemGeralDto[];
}
