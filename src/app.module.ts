import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { EmpresaModule } from './empresa/empresa.module';
import { EquipamentoModule } from './equipamento/equipamento.module';
import { PecaModule } from './peca/peca.module';
import { MovimentacaoModule } from './movimentacao/movimentacao.module';
import { FornecedorModule } from './fornecedor/fornecedor.module';
import { OrdemServicoModule } from './ordem-servico/ordem-servico.module';
import { AfericaoModule } from './afericao/afericao.module';
import { ContratoModule } from './contrato/contrato.module';

@Module({
  imports: [
    // ─── Rate Limiting global: 100 requisições por minuto por IP ─────────────
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,   // janela de 1 minuto (em ms)
        limit: 100,   // máximo de 100 requisições por IP nessa janela
      },
    ]),

    PrismaModule,
    AuditModule,
    AuthModule,
    EmpresaModule,
    EquipamentoModule,
    PecaModule,
    MovimentacaoModule,
    FornecedorModule,
    OrdemServicoModule,
    AfericaoModule,
    ContratoModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // ─── Aplica o ThrottlerGuard em TODAS as rotas automaticamente ────────────
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}