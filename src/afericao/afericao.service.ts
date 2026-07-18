import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AfericaoService {
  constructor(private prisma: PrismaService) {}

  async listar(empresa_id: string, equipamento_id?: string) {
    return this.prisma.afericao.findMany({
      where: {
        empresa_id,
        ...(equipamento_id ? { equipamento_id } : {}),
      },
      orderBy: { data_afericao: 'desc' },
      include: { equipamento: { include: { contrato: true } } },
    });
  }

  async buscar(id: string, empresa_id: string) {
    return this.prisma.afericao.findFirst({
      where: { id, empresa_id },
      include: { equipamento: { include: { contrato: true } } },
    });
  }

  async listarVencendo(empresa_id: string, diasAntecedencia = 45) {
    const hoje = new Date();
    const limite = new Date();
    limite.setDate(hoje.getDate() + diasAntecedencia);

    return this.prisma.afericao.findMany({
      where: {
        empresa_id,
        data_validade: { lte: limite },
      },
      orderBy: { data_validade: 'asc' },
      include: { equipamento: { include: { contrato: true } } },
    });
  }

  async criar(
    empresa_id: string,
    criado_por_id: string,
    dados: {
      equipamento_id: string;
      data_afericao: string;
      data_validade?: string;
      orgao_responsavel: string;
      numero_certificado?: string;
      anexo_certificado_url?: string;
      observacoes?: string;
    },
  ) {
    const dataAfericao = new Date(dados.data_afericao);

    // Se não informar validade, calcula automaticamente 12 meses (norma do Contran)
    let dataValidade: Date;
    if (dados.data_validade) {
      dataValidade = new Date(dados.data_validade);
    } else {
      dataValidade = new Date(dataAfericao);
      dataValidade.setFullYear(dataValidade.getFullYear() + 1);
    }

    return this.prisma.afericao.create({
      data: {
        empresa_id,
        equipamento_id: dados.equipamento_id,
        data_afericao: dataAfericao,
        data_validade: dataValidade,
        orgao_responsavel: dados.orgao_responsavel,
        numero_certificado: dados.numero_certificado || null,
        anexo_certificado_url: dados.anexo_certificado_url || null,
        observacoes: dados.observacoes || null,
        criado_por_id,
      },
    });
  }

  async atualizar(
    id: string,
    empresa_id: string,
    dados: {
      data_afericao?: string;
      data_validade?: string;
      orgao_responsavel?: string;
      numero_certificado?: string;
      anexo_certificado_url?: string;
      observacoes?: string;
    },
  ) {
    return this.prisma.afericao.updateMany({
      where: { id, empresa_id },
      data: {
        ...(dados.data_afericao ? { data_afericao: new Date(dados.data_afericao) } : {}),
        ...(dados.data_validade ? { data_validade: new Date(dados.data_validade) } : {}),
        ...(dados.orgao_responsavel ? { orgao_responsavel: dados.orgao_responsavel } : {}),
        ...(dados.numero_certificado !== undefined ? { numero_certificado: dados.numero_certificado } : {}),
        ...(dados.anexo_certificado_url !== undefined ? { anexo_certificado_url: dados.anexo_certificado_url } : {}),
        ...(dados.observacoes !== undefined ? { observacoes: dados.observacoes } : {}),
      },
    });
  }
}