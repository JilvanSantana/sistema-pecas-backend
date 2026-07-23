import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EquipamentoService {
  constructor(private prisma: PrismaService) {}

  private filtroBase(papel: string, base_id: string | null) {
    if (papel === 'admin_base' || papel === 'operador') {
      return base_id ? { base_responsavel_id: base_id } : {};
    }
    return {};
  }

  async listar(empresa_id: string, usuario: any, filtros?: {
    tipo?: string;
    status?: string;
    base_id?: string;
    incluir_arquivados?: boolean;
  }) {
    return this.prisma.equipamento.findMany({
      where: {
        empresa_id,
        arquivado: filtros?.incluir_arquivados === true,
        ...this.filtroBase(usuario.papel, usuario.base_id),
        ...(filtros?.tipo && { tipo: filtros.tipo }),
        ...(filtros?.status && { status_operacional: filtros.status }),
        ...(filtros?.base_id && { base_responsavel_id: filtros.base_id }),
      },
      include: { base: true, contrato: true },
      orderBy: { criado_em: 'desc' },
    });
  }

  async buscar(id: string, empresa_id: string) {
    return this.prisma.equipamento.findFirst({
      where: { id, empresa_id },
      include: {
        base: true,
        contrato: true,
        ordem_servico: {
          orderBy: { data_abertura: 'desc' },
          take: 5,
        },
      },
    });
  }

  async buscarPorQr(qr_code: string, empresa_id: string) {
    return this.prisma.equipamento.findFirst({
      where: { qr_code, empresa_id, arquivado: false },
      include: { base: true, contrato: true },
    });
  }

  async criar(empresa_id: string, dados: {
    tipo: string;
    numero_serie?: string;
    modelo?: string;
    fabricante?: string;
    localizacao_instalacao: string;
    quantidade_faixas?: number;
    latitude?: number;
    longitude?: number;
    base_responsavel_id: string;
    contrato_id?: string;
  }) {
    const qr_code = `EQ-${dados.tipo.toUpperCase()}-${Date.now()}`;
    return this.prisma.equipamento.create({
      data: {
        empresa_id,
        tipo: dados.tipo,
        numero_serie: dados.numero_serie || null,
        modelo: dados.modelo || null,
        fabricante: dados.fabricante || null,
        localizacao_instalacao: dados.localizacao_instalacao,
        quantidade_faixas: dados.quantidade_faixas || null,
        latitude: dados.latitude || null,
        longitude: dados.longitude || null,
        base_responsavel_id: dados.base_responsavel_id,
        contrato_id: dados.contrato_id || null,
        status_operacional: 'ativo',
        qr_code,
      },
    });
  }

  async atualizarStatus(id: string, empresa_id: string, status: string) {
    return this.prisma.equipamento.updateMany({
      where: { id, empresa_id },
      data: { status_operacional: status },
    });
  }

  async arquivar(id: string, empresa_id: string) {
    await this.prisma.equipamento.updateMany({
      where: { id, empresa_id },
      data: { arquivado: true },
    });
    return { mensagem: 'Equipamento arquivado. O histórico foi preservado.' };
  }

  async desarquivar(id: string, empresa_id: string) {
    await this.prisma.equipamento.updateMany({
      where: { id, empresa_id },
      data: { arquivado: false },
    });
    return { mensagem: 'Equipamento restaurado para a lista ativa.' };
  }

  async resumoPorStatus(empresa_id: string, usuario: any) {
    const filtro = { empresa_id, arquivado: false, ...this.filtroBase(usuario.papel, usuario.base_id) };
    const total = await this.prisma.equipamento.count({ where: filtro });
    const ativos = await this.prisma.equipamento.count({ where: { ...filtro, status_operacional: 'ativo' } });
    const parados = await this.prisma.equipamento.count({ where: { ...filtro, status_operacional: 'inativo_aguardando_peca' } });
    const manutencao = await this.prisma.equipamento.count({ where: { ...filtro, status_operacional: 'em_manutencao' } });
    return { total, ativos, parados, manutencao };
  }
}