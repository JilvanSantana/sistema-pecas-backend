import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class MovimentacaoService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

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

    if (!peca) throw new BadRequestException('Peça não encontrada');

    let tecnico_id: string | null = null;
    if (dados.origem_tipo === 'tecnico') {
      const tecnico = await this.prisma.tecnico.findFirst({
        where: { usuario_id: dados.origem_id, empresa_id },
      });
      if (tecnico) tecnico_id = tecnico.id;
    }

    const origem_id = tecnico_id || dados.origem_id;

    const movimentacao = await this.prisma.movimentacao.create({
      data: {
        empresa_id,
        peca_id: dados.peca_id,
        origem_tipo: dados.origem_tipo,
        origem_id,
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

    // ─── AUDITORIA ───────────────────────────────────────────────────────────
    await this.audit.registrar({
      empresa_id,
      entidade: 'movimentacao',
      entidade_id: movimentacao.id,
      acao: 'REGISTRAR_ENVIO',
      usuario_id,
      dados_anteriores: { status_peca: peca.status_atual, base_id: peca.base_atual_id },
      dados_novos: {
        origem_tipo: dados.origem_tipo,
        destino_tipo: dados.destino_tipo,
        motivo_envio: dados.motivo_envio,
        status: 'enviada',
      },
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

    if (!movimentacao) throw new BadRequestException('Movimentação não encontrada');

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
      const status_peca = dados.condicao === 'defeituosa'
        ? 'defeituosa_aguardando_analise'
        : 'em_estoque_base';

      await this.prisma.peca.update({
        where: { id: movimentacao.peca_id },
        data: {
          status_atual: status_peca,
          base_atual_id: movimentacao.destino_tipo === 'base' ? movimentacao.destino_id : null,
          tecnico_atual_id: null,
        },
      });
    }

    // ─── AUDITORIA ───────────────────────────────────────────────────────────
    await this.audit.registrar({
      empresa_id,
      entidade: 'movimentacao',
      entidade_id: id,
      acao: dados.confirmado ? 'CONFIRMAR_RECEBIMENTO' : 'RECEBIMENTO_DIVERGENTE',
      usuario_id,
      dados_anteriores: { status: movimentacao.status },
      dados_novos: { status, condicao: dados.condicao },
    });

    return { mensagem: `Movimentação marcada como ${status}` };
  }

  async listarAguardandoRemessa(empresa_id: string) {
    return this.prisma.peca.findMany({
      where: {
        empresa_id,
        status_atual: { in: ['aguardando_remessa', 'tecnico_confirmou_entrega'] },
      },
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
          origem_tipo: 'base',
          origem_id: usuario_id,
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

      // ─── AUDITORIA ─────────────────────────────────────────────────────────
      await this.audit.registrar({
        empresa_id,
        entidade: 'movimentacao',
        entidade_id: mov.id,
        acao: 'REMESSA_PARA_SEDE',
        usuario_id,
        dados_anteriores: { status_peca: peca.status_atual },
        dados_novos: { destino_base_id: dados.base_destino_id, status: 'enviada' },
      });

      movimentacoes.push(mov);
    }

    return { mensagem: `${movimentacoes.length} peça(s) registrada(s) para remessa`, movimentacoes };
  }

  async buscarPecaPorQr(codigo_qr: string, empresa_id: string) {
    const peca = await this.prisma.peca.findFirst({
      where: { codigo_qr, empresa_id },
      include: { base: true, tecnico: { include: { usuario: true } } },
    });

    if (!peca) throw new BadRequestException('Peça não encontrada');

    if (peca.status_atual === 'aguardando_remessa') {
      return {
        peca,
        acao: 'tecnico_confirmar_entrega',
        titulo: 'Técnico: confirmar entrega ao operador',
        movimentacao_id: null,
      };
    }

    if (peca.status_atual === 'tecnico_confirmou_entrega') {
      return {
        peca,
        acao: 'remessa',
        titulo: 'Registrar envio para a sede',
        movimentacao_id: null,
      };
    }

    if (peca.status_atual === 'saiu_para_campo') {
      return {
        peca,
        acao: 'tecnico_confirmar_recebimento_base',
        titulo: 'Técnico: confirmar recebimento da base',
        movimentacao_id: null,
      };
    }

    if (peca.status_atual === 'em_transito') {
      const movimentacao = await this.prisma.movimentacao.findFirst({
        where: {
          peca_id: peca.id,
          empresa_id,
          status: { in: ['enviada', 'em_transito'] },
        },
        orderBy: { data_envio: 'desc' },
      });

      return {
        peca,
        acao: movimentacao ? 'confirmar' : 'nenhuma',
        titulo: movimentacao ? 'Confirmar recebimento' : 'Nenhuma ação pendente',
        movimentacao_id: movimentacao?.id || null,
      };
    }

    return {
      peca,
      acao: 'nenhuma',
      titulo: 'Nenhuma ação pendente para esta peça',
      movimentacao_id: null,
    };
  }

  async tecnicoConfirmaEntrega(peca_id: string, empresa_id: string) {
    const peca = await this.prisma.peca.findFirst({
      where: { id: peca_id, empresa_id, status_atual: 'aguardando_remessa' },
    });

    if (!peca) throw new BadRequestException('Peça não encontrada ou não está aguardando remessa');

    await this.prisma.peca.update({
      where: { id: peca_id },
      data: { status_atual: 'tecnico_confirmou_entrega' },
    });

    return { mensagem: 'Entrega confirmada pelo técnico. Aguardando confirmação do operador.' };
  }

  async operadorConfirmaRecebimento(peca_id: string, empresa_id: string, base_id: string, dados: {
    tipo: string;
    descricao_defeito?: string;
  }) {
    const peca = await this.prisma.peca.findFirst({
      where: { id: peca_id, empresa_id, status_atual: 'tecnico_confirmou_entrega' },
    });

    if (!peca) throw new BadRequestException('Peça não encontrada ou técnico ainda não confirmou a entrega');

    const status_final = dados.tipo === 'defeituosa' ? 'defeituosa_aguardando_analise' : 'em_estoque_base';

    await this.prisma.peca.update({
      where: { id: peca_id },
      data: {
        status_atual: status_final,
        base_atual_id: base_id,
        tecnico_atual_id: null,
      },
    });

    return { mensagem: 'Recebimento confirmado. Peça registrada na base.' };
  }

  async registrarSaidaParaTecnico(empresa_id: string, usuario_id: string, dados: {
    peca_id: string;
    tecnico_usuario_id: string;
    observacao?: string;
  }) {
    const peca = await this.prisma.peca.findFirst({
      where: { id: dados.peca_id, empresa_id, status_atual: 'em_estoque_base' },
    });

    if (!peca) throw new BadRequestException('Peça não encontrada ou não está em estoque');

    const tecnico = await this.prisma.tecnico.findFirst({
      where: { usuario_id: dados.tecnico_usuario_id, empresa_id },
      include: { usuario: true },
    });

    if (!tecnico) throw new BadRequestException('Técnico não encontrado');

    await this.prisma.peca.update({
      where: { id: dados.peca_id },
      data: {
        status_atual: 'saiu_para_campo',
        tecnico_atual_id: tecnico.id,
        base_atual_id: null,
      },
    });

    const mov = await this.prisma.movimentacao.create({
      data: {
        empresa_id,
        peca_id: dados.peca_id,
        origem_tipo: 'base',
        origem_id: usuario_id,
        destino_tipo: 'tecnico',
        destino_id: tecnico.id,
        motivo_envio: 'saida_para_campo',
        descricao_problema: dados.observacao || null,
        status: 'enviada',
        usuario_responsavel_id: usuario_id,
      },
    });

    // ─── AUDITORIA ───────────────────────────────────────────────────────────
    await this.audit.registrar({
      empresa_id,
      entidade: 'movimentacao',
      entidade_id: mov.id,
      acao: 'SAIDA_PARA_TECNICO',
      usuario_id,
      dados_anteriores: { status_peca: peca.status_atual, base_id: peca.base_atual_id },
      dados_novos: { tecnico_id: tecnico.id, tecnico_nome: tecnico.usuario.nome, status: 'saiu_para_campo' },
    });

    return {
      mensagem: `Peça registrada como saída para o técnico ${tecnico.usuario.nome}. Aguardando confirmação do técnico.`,
      tecnico_nome: tecnico.usuario.nome,
    };
  }

  async tecnicoConfirmaRecebimentoDaBase(peca_id: string, empresa_id: string, usuario_id: string) {
    const peca = await this.prisma.peca.findFirst({
      where: { id: peca_id, empresa_id, status_atual: 'saiu_para_campo' },
    });

    if (!peca) throw new BadRequestException('Peça não encontrada ou não está aguardando confirmação');

    const tecnico = await this.prisma.tecnico.findFirst({
      where: { usuario_id, empresa_id },
    });

    if (!tecnico || peca.tecnico_atual_id !== tecnico.id) {
      throw new BadRequestException('Esta peça não foi enviada para você');
    }

    await this.prisma.peca.update({
      where: { id: peca_id },
      data: { status_atual: 'em_posse_tecnico' },
    });

    const mov = await this.prisma.movimentacao.findFirst({
      where: { peca_id, empresa_id, motivo_envio: 'saida_para_campo', status: 'enviada' },
      orderBy: { data_envio: 'desc' },
    });

    if (mov) {
      await this.prisma.movimentacao.update({
        where: { id: mov.id },
        data: {
          status: 'recebida',
          data_confirmacao_recebimento: new Date(),
          usuario_confirmou_id: usuario_id,
        },
      });

      // ─── AUDITORIA ─────────────────────────────────────────────────────────
      await this.audit.registrar({
        empresa_id,
        entidade: 'movimentacao',
        entidade_id: mov.id,
        acao: 'TECNICO_CONFIRMOU_RECEBIMENTO',
        usuario_id,
        dados_anteriores: { status_peca: 'saiu_para_campo' },
        dados_novos: { status_peca: 'em_posse_tecnico', tecnico_id: tecnico.id },
      });
    }

    return { mensagem: 'Recebimento confirmado. Peça agora está em sua posse.' };
  }

  async listarPecasParaTecnico(empresa_id: string, usuario_id: string) {
    const tecnico = await this.prisma.tecnico.findFirst({
      where: { usuario_id, empresa_id },
    });

    if (!tecnico) return [];

    return this.prisma.peca.findMany({
      where: {
        empresa_id,
        tecnico_atual_id: tecnico.id,
        status_atual: { in: ['saiu_para_campo', 'em_posse_tecnico', 'aguardando_remessa', 'tecnico_confirmou_entrega'] },
      },
      orderBy: { criado_em: 'desc' },
    });
  }

  async registrarSaidaDaSedeParaBase(empresa_id: string, usuario_id: string, dados: {
    peca_id: string;
    base_destino_id: string;
    codigo_rastreio?: string;
    transportadora?: string;
    observacao?: string;
  }) {
    const peca = await this.prisma.peca.findFirst({
      where: { id: dados.peca_id, empresa_id, status_atual: 'em_estoque_base' },
    });

    if (!peca) throw new BadRequestException('Peça não encontrada ou não está em estoque');

    const mov = await this.prisma.movimentacao.create({
      data: {
        empresa_id,
        peca_id: dados.peca_id,
        origem_tipo: 'base',
        origem_id: usuario_id,
        destino_tipo: 'base',
        destino_id: dados.base_destino_id,
        motivo_envio: 'envio_sede_para_base',
        descricao_problema: dados.observacao || null,
        codigo_rastreio: dados.codigo_rastreio || null,
        transportadora: dados.transportadora || null,
        status: 'enviada',
        usuario_responsavel_id: usuario_id,
      },
    });

    await this.prisma.peca.update({
      where: { id: dados.peca_id },
      data: { status_atual: 'em_transito', base_atual_id: null },
    });

    // ─── AUDITORIA ───────────────────────────────────────────────────────────
    await this.audit.registrar({
      empresa_id,
      entidade: 'movimentacao',
      entidade_id: mov.id,
      acao: 'SAIDA_SEDE_PARA_BASE',
      usuario_id,
      dados_anteriores: { status_peca: peca.status_atual, base_id: peca.base_atual_id },
      dados_novos: { base_destino_id: dados.base_destino_id, status: 'em_transito' },
    });

    return { mensagem: 'Peça registrada como enviada para a base. Aguardando confirmação de recebimento.' };
  }
}