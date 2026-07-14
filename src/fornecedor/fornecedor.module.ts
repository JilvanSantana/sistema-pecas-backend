import { Module } from '@nestjs/common';
import { FornecedorService } from './fornecedor.service';
import { FornecedorController } from './fornecedor.controller';

@Module({
  providers: [FornecedorService],
  controllers: [FornecedorController],
  exports: [FornecedorService],
})
export class FornecedorModule {}