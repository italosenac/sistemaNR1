import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SaudeController } from './apresentacao/saude.controller';
import { validarAmbiente } from './infraestrutura/validar-ambiente';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: validarAmbiente })],
  controllers: [SaudeController],
})
export class AppModule {}
