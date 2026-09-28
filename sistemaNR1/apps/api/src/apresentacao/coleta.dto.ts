import {
  IsInt,
  IsNumber,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RespostaAnonimaDto {
  @ApiProperty({ minLength: 64, maxLength: 64 })
  @Matches(/^[a-f0-9]{64}$/)
  codigo!: string;

  @ApiProperty({ minimum: 1, maximum: 3 })
  @IsInt()
  @Min(1)
  @Max(3)
  sobrecargaPercebida!: number;

  @ApiProperty({ minimum: 1, maximum: 3 })
  @IsInt()
  @Min(1)
  @Max(3)
  ritmoPercebido!: number;
}

export class CriarCampanhaDto {
  @IsUUID()
  estabelecimentoId!: string;

  @IsString()
  @Length(3, 150)
  titulo!: string;

  @Matches(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/,
  )
  inicio!: string;

  @Matches(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/,
  )
  fim!: string;

  @IsString()
  @Length(3, 80)
  fuso!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  metaPercentual!: number;

  @IsString()
  @Length(3, 500)
  canalDivulgacao!: string;

  @IsString()
  @Length(10, 1000)
  canalAlternativo!: string;
}

export class AdicionarGrupoDto {
  @IsUUID()
  grupoId!: string;

  @IsInt()
  @Min(1)
  populacaoEsperada!: number;
}

export class PublicarCampanhaDto {
  @IsUUID()
  estruturaCongeladaId!: string;
}

export class EmitirCodigoDto {
  @IsUUID()
  grupoId!: string;
}
