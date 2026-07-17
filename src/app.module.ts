import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmpresaModule } from './empresa/empresa.module';
import { EquipamentoModule } from './equipamento/equipamento.module';
import { PecaModule } from './peca/peca.module';
import { MovimentacaoModule } from './movimentacao/movimentacao.module';
import { FornecedorModule } from './fornecedor/fornecedor.module';
import { OrdemServicoModule } from './ordem-servico/ordem-servico.module';
import { AfericaoModule } from './afericao/afericao.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    EmpresaModule,
    EquipamentoModule,
    PecaModule,
    MovimentacaoModule,
    FornecedorModule,
    OrdemServicoModule,
    AfericaoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}