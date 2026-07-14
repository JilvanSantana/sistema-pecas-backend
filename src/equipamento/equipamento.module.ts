import { Module } from '@nestjs/common';
import { EquipamentoService } from './equipamento.service';
import { EquipamentoController } from './equipamento.controller';

@Module({
  providers: [EquipamentoService],
  controllers: [EquipamentoController],
  exports: [EquipamentoService],
})
export class EquipamentoModule {}