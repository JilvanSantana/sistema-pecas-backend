import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MovimentacaoService {
  constructor(private prisma: PrismaService) {}

  private filtroBase(papel: string, base_id: string | null) {
    if (papel === 'admin_base' || papel === 'operador') {
      return base_id ? {
        OR: [
          { origem_id: base_id, origem_tipo: 'base' },
          { destino_id: base_id, destino_tipo: 'base' },
        ]
      } : {};
    }
    return {};
  }

  async listar(empresa_id: string, usuario: any, filtros?: {
    status?: string;
    peca_id?: string;
    equipamento_id?: string;
  }) {
    return this.prisma.movimentacao.findMany({
      where: {
        empresa_id,
        ...this.filtroBase(usuario.papel, usuario.base_id),
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

  async listarPendentes(empresa_id: string, usuario: any) {
    return this.prisma.movimentacao.findMany({
      where: {
        empresa_id,
        ...this.filtroBase(usuario.papel, usuario.base_id),
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
    peca_defeituosa_id?: string;
  }) {
    const peca = await this.prisma.peca.findFirst({
      where: { id: dados.peca_id, empresa_id },
    });

    if (!peca) {
      throw new BadRequestException('Peça não encontrada');
    }

    let origem_id = dados.origem_id;
    if (dados.origem_tipo === 'tecnico') {
      const tecnico = await this.prisma.tecnico.findFirst({
        where: { usuario_id: dados.origem_id, empresa_id },
      });
      if (tecnico) {
        origem_id = tecnico.id;
      }
    }

    const movimentacao = await this.prisma.movimentacao.create({
      data: {
        empresa_id,
        peca_id: dados.peca_id,
        origem_tipo: dados.origem_tipo,
        origem_id: origem_id,
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
      data: {
        status_atual: 'instalada_equipamento',
        equipamento_atual_id: dados.equipamento_id || null,
        base_atual_id: null,
        tecnico_atual_id: null,
      },
    });

    if (dados.peca_defeituosa_id) {
      await this.prisma.peca.update({
        where: { id: dados.peca_defeituosa_id },
        data: {
          status_atual: 'aguardando_remessa',
          equipamento_atual_id: null,
          base_atual_id: null,
          tecnico_atual_id: origem_id,
        },
      });
    }

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
          tecnico_atual_id: null,
        },
      });
    }

    return { mensagem: `Movimentação marcada como ${status}` };
  }

  async listarAguardandoRemessa(empresa_id: string) {
    return this.prisma.peca.findMany({
      where: { empresa_id, status_atual: 'aguardando_remessa' },
      include: {
        movimentacao: {
          orderBy: { data_envio: 'desc' },
          take: 1,
          include: { equipamento: true },
        },
      },
      orderBy: { criado_em: 'desc' },
    });
  }

  async registrarRemessaParaSede(empresa_id: string, usuario_id: string, dados: {
    peca_ids: string[];
    base_destino_id: string;
    codigo_rastreio?: string;
    transportadora?: string;
  }) {
    const movimentacoes: any[] = [];

    for (const peca_id of dados.peca_ids) {
      const peca = await this.prisma.peca.findFirst({
        where: { id: peca_id, empresa_id },
      });

      if (!peca) continue;

      const mov = await this.prisma.movimentacao.create({
        data: {
          empresa_id,
          peca_id,
          origem_tipo: 'tecnico',
          origem_id: peca.tecnico_atual_id || usuario_id,
          destino_tipo: 'base',
          destino_id: dados.base_destino_id,
          motivo_envio: 'devolucao',
          descricao_problema: 'Peça defeituosa retornando para sede',
          codigo_rastreio: dados.codigo_rastreio || null,
          transportadora: dados.transportadora || null,
          status: 'enviada',
          usuario_responsavel_id: usuario_id,
        },
      });

      await this.prisma.peca.update({
        where: { id: peca_id },
        data: { status_atual: 'em_transito', tecnico_atual_id: null },
      });

      movimentacoes.push(mov);
    }

    return { mensagem: `${movimentacoes.length} peça(s) registrada(s) para remessa`, movimentacoes };
  }
}