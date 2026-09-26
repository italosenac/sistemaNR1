import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SaudeController } from './apresentacao/saude.controller.js';
import { validarAmbiente } from './infraestrutura/validar-ambiente.js';
import { UsuariosModule } from './usuarios.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validarAmbiente }),
    UsuariosModule,
  ],
  controllers: [SaudeController],
})
export class AppModule {}
