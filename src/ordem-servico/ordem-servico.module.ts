import { Module } from '@nestjs/common';
import { OrdemServicoService } from './ordem-servico.service';
import { OrdemServicoController } from './ordem-servico.controller';

@Module({
  providers: [OrdemServicoService],
  controllers: [OrdemServicoController],
  exports: [OrdemServicoService],
})
export class OrdemServicoModule {}