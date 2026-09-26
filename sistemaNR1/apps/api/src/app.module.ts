import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SaudeController } from './apresentacao/saude.controller.js';
import { validarAmbiente } from './infraestrutura/validar-ambiente.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validarAmbiente }),
  ],
  controllers: [SaudeController],
})
export class AppModule {}
