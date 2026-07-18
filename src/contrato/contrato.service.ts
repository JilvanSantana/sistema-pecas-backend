import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContratoService {
  constructor(private prisma: PrismaService) {}

  async listar(empresa_id: string) {
    return this.prisma.contrato.findMany({
      where: { empresa_id },
      orderBy: { data_inicio: 'desc' },
    });
  }

  async buscar(id: string, empresa_id: string) {
    return this.prisma.contrato.findFirst({
      where: { id, empresa_id },
      include: { equipamento: true },
    });
  }

  async criar(empresa_id: string, dados: {
    numero_contrato: string;
    orgao_contratante: string;
    sla_horas_atendimento: number;
    data_inicio: string;
    data_fim?: string;
  }) {
    return this.prisma.contrato.create({
      data: {
        empresa_id,
        numero_contrato: dados.numero_contrato,
        orgao_contratante: dados.orgao_contratante,
        sla_horas_atendimento: dados.sla_horas_atendimento,
        data_inicio: new Date(dados.data_inicio),
        data_fim: dados.data_fim ? new Date(dados.data_fim) : null,
        status: 'ativo',
      },
    });
  }

  async atualizar(id: string, empresa_id: string, dados: {
    numero_contrato?: string;
    orgao_contratante?: string;
    sla_horas_atendimento?: number;
    data_inicio?: string;
    data_fim?: string;
    status?: string;
  }) {
    return this.prisma.contrato.updateMany({
      where: { id, empresa_id },
      data: {
        ...(dados.numero_contrato ? { numero_contrato: dados.numero_contrato } : {}),
        ...(dados.orgao_contratante ? { orgao_contratante: dados.orgao_contratante } : {}),
        ...(dados.sla_horas_atendimento !== undefined ? { sla_horas_atendimento: dados.sla_horas_atendimento } : {}),
        ...(dados.data_inicio ? { data_inicio: new Date(dados.data_inicio) } : {}),
        ...(dados.data_fim !== undefined ? { data_fim: dados.data_fim ? new Date(dados.data_fim) : null } : {}),
        ...(dados.status ? { status: dados.status } : {}),
      },
    });
  }
}