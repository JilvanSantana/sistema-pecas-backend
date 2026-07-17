import { Module } from '@nestjs/common';
import { AfericaoService } from './afericao.service';
import { AfericaoController } from './afericao.controller';

@Module({
  providers: [AfericaoService],
  controllers: [AfericaoController],
  exports: [AfericaoService],
})
export class AfericaoModule {}