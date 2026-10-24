import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditOptions {
  empresa_id: string;
  entidade: string;
  entidade_id: string;
  acao: string;
  usuario_id?: string;
  dados_anteriores?: object;
  dados_novos?: object;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async registrar(opcoes: AuditOptions): Promise<void> {
    try {
      await this.prisma.log_auditoria.create({
        data: {
          empresa_id: opcoes.empresa_id,
          entidade: opcoes.entidade,
          entidade_id: opcoes.entidade_id,
          acao: opcoes.acao,
          usuario_id: opcoes.usuario_id ?? null,
          dados_anteriores: opcoes.dados_anteriores ?? undefined,
          dados_novos: opcoes.dados_novos ?? undefined,
        },
      });
    } catch (error) {
      console.error('[AuditService] Falha ao registrar log:', error);
    }
  }

  async buscarHistorico(empresa_id: string, entidade: string, entidade_id: string) {
    return this.prisma.log_auditoria.findMany({
      where: { empresa_id, entidade, entidade_id },
      include: {
        usuario: {
          select: { id: true, nome: true, email: true, papel: true },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
  }

  async buscarPorEmpresa(
    empresa_id: string,
    filtros?: { entidade?: string; acao?: string; usuario_id?: string; limite?: number },
  ) {
    return this.prisma.log_auditoria.findMany({
      where: {
        empresa_id,
        ...(filtros?.entidade && { entidade: filtros.entidade }),
        ...(filtros?.acao && { acao: filtros.acao }),
        ...(filtros?.usuario_id && { usuario_id: filtros.usuario_id }),
      },
      include: {
        usuario: {
          select: { id: true, nome: true, email: true, papel: true },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: filtros?.limite ?? 50,
    });
  }
}