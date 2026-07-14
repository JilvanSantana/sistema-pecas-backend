import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MovimentacaoService {
  constructor(private prisma: PrismaService) {}

  async listar(empresa_id: string, filtros?: {
    status?: string;
    peca_id?: string;
    equipamento_id?: string;
  }) {
    return this.prisma.movimentacao.findMany({
      where: {
        empresa_id,
        ...(filtros?.status && { status: filtros.status }),
        ...(filtros?.peca_id && { peca_id: filtros.peca_id }),
        ...(filtros?.equipamento_id && { equipamento_id: filtros.equipamento_id }),
      },
      include: {
        peca: true,
        equipamento: true,
        contrato: true,
        ordem_servico: true,
      },
      orderBy: { data_envio: 'desc' },
    });
  }

  async listarPendentes(empresa_id: string) {
    return this.prisma.movimentacao.findMany({
      where: {
        empresa_id,
        status: { in: ['enviada', 'em_transito'] },
      },
      include: { peca: true, equipamento: true },
      orderBy: { data_envio: 'asc' },
    });
  }

  async registrarEnvio(empresa_id: string, usuario_id: string, dados: {
    peca_id: string;
    origem_tipo: string;
    origem_id: string;
    destino_tipo: string;
    destino_id: string;
    motivo_envio: string;
    descricao_problema?: string;
    codigo_rastreio?: string;
    transportadora?: string;
    equipamento_id?: string;
    contrato_id?: string;
    ordem_servico_id?: string;
    causou_parada?: boolean;
    data_inicio_parada?: string;
    registrado_offline?: boolean;
    latitude_registro?: number;
    longitude_registro?: number;
  }) {
    const peca = await this.prisma.peca.findFirst({
      where: { id: dados.peca_id, empresa_id },
    });

    if (!peca) {
      throw new BadRequestException('Peça não encontrada');
    }

    const movimentacao = await this.prisma.movimentacao.create({
      data: {
        empresa_id,
        peca_id: dados.peca_id,
        origem_tipo: dados.origem_tipo,
        origem_id: dados.origem_id,
        destino_tipo: dados.destino_tipo,
        destino_id: dados.destino_id,
        motivo_envio: dados.motivo_envio,
        descricao_problema: dados.descricao_problema || null,
        codigo_rastreio: dados.codigo_rastreio || null,
        transportadora: dados.transportadora || null,
        equipamento_id: dados.equipamento_id || null,
        contrato_id: dados.contrato_id || null,
        ordem_servico_id: dados.ordem_servico_id || null,
        causou_parada: dados.causou_parada || false,
        data_inicio_parada: dados.data_inicio_parada ? new Date(dados.data_inicio_parada) : null,
        registrado_offline: dados.registrado_offline || false,
        latitude_registro: dados.latitude_registro || null,
        longitude_registro: dados.longitude_registro || null,
        status: 'enviada',
        usuario_responsavel_id: usuario_id,
      },
    });

    await this.prisma.peca.update({
      where: { id: dados.peca_id },
      data: { status_atual: 'em_transito' },
    });

    return movimentacao;
  }

  async confirmarRecebimento(id: string, empresa_id: string, usuario_id: string, dados: {
    confirmado: boolean;
    condicao: string;
    data_fim_parada?: string;
  }) {
    const movimentacao = await this.prisma.movimentacao.findFirst({
      where: { id, empresa_id },
    });

    if (!movimentacao) {
      throw new BadRequestException('Movimentação não encontrada');
    }

    const status = dados.confirmado ? 'recebida' : 'divergente';

    await this.prisma.movimentacao.update({
      where: { id },
      data: {
        status,
        data_confirmacao_recebimento: new Date(),
        usuario_confirmou_id: usuario_id,
        ...(dados.data_fim_parada && { data_fim_parada: new Date(dados.data_fim_parada) }),
      },
    });

    if (dados.confirmado) {
      let status_peca = 'em_estoque_base';

      if (dados.condicao === 'defeituosa') {
        status_peca = 'defeituosa_aguardando_analise';
      }

      await this.prisma.peca.update({
        where: { id: movimentacao.peca_id },
        data: {
          status_atual: status_peca,
          base_atual_id: movimentacao.destino_tipo === 'base' ? movimentacao.destino_id : null,
          tecnico_atual_id: movimentacao.destino_tipo === 'tecnico' ? movimentacao.destino_id : null,
        },
      });
    }

    return { mensagem: `Movimentação marcada como ${status}` };
  }
}