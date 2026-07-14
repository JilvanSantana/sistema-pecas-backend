import { Module } from '@nestjs/common';
import { PecaService } from './peca.service';
import { PecaController } from './peca.controller';

@Module({
  providers: [PecaService],
  controllers: [PecaController],
  exports: [PecaService],
})
export class PecaModule {}