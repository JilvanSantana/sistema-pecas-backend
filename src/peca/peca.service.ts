import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PecaService {
  constructor(private prisma: PrismaService) {}

  async listar(empresa_id: string, filtros?: {
    categoria?: string;
    status?: string;
    base_id?: string;
  }) {
    return this.prisma.peca.findMany({
      where: {
        empresa_id,
        ...(filtros?.categoria && { categoria: filtros.categoria }),
        ...(filtros?.status && { status_atual: filtros.status }),
        ...(filtros?.base_id && { base_atual_id: filtros.base_id }),
      },
      include: {
        base: true,
        tecnico: true,
        equipamento: true,
      },
      orderBy: { criado_em: 'desc' },
    });
  }

  async buscarPorQr(codigo_qr: string, empresa_id: string) {
    return this.prisma.peca.findFirst({
      where: { codigo_qr, empresa_id },
      include: {
        base: true,
        tecnico: true,
        equipamento: true,
        movimentacao: {
          orderBy: { data_envio: 'desc' },
          take: 10,
        },
      },
    });
  }

  async criar(empresa_id: string, dados: {
    descricao: string;
    categoria: string;
    base_atual_id: string;
  }) {
    const codigo_qr = `PC-${dados.categoria.toUpperCase().replace(/\s/g, '_')}-${Date.now()}`;

    return this.prisma.peca.create({
      data: {
        empresa_id,
        codigo_qr,
        descricao: dados.descricao,
        categoria: dados.categoria,
        status_atual: 'em_estoque_base',
        base_atual_id: dados.base_atual_id,
      },
    });
  }

  async criarEmLote(empresa_id: string, pecas: {
    descricao: string;
    categoria: string;
    base_atual_id: string;
  }[]) {
    const dados = pecas.map(p => ({
      empresa_id,
      codigo_qr: `PC-${p.categoria.toUpperCase().replace(/\s/g, '_')}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      descricao: p.descricao,
      categoria: p.categoria,
      status_atual: 'em_estoque_base',
      base_atual_id: p.base_atual_id,
    }));

    return this.prisma.peca.createMany({ data: dados });
  }

  async enviarAoFabricante(id: string, empresa_id: string, dados: {
    fornecedor_id: string;
    observacao: string;
    previsao_retorno?: string;
  }) {
    await this.prisma.peca.updateMany({
      where: { id, empresa_id },
      data: {
        status_atual: 'em_reparo_fabricante',
        base_atual_id: null,
        tecnico_atual_id: null,
        equipamento_atual_id: null,
      },
    });

    return { mensagem: 'Peça enviada ao fabricante para reparo' };
  }

  async retornoFabricante(id: string, empresa_id: string, dados: {
    base_destino_id: string;
    condicao: string;
  }) {
    let status_peca = 'em_estoque_base';

    if (dados.condicao === 'nova') {
      status_peca = 'em_estoque_base';
    } else if (dados.condicao === 'reparada') {
      status_peca = 'em_estoque_base';
    } else if (dados.condicao === 'irreparavel') {
      status_peca = 'descartada';
    }

    await this.prisma.peca.updateMany({
      where: { id, empresa_id },
      data: {
        status_atual: status_peca,
        base_atual_id: dados.condicao !== 'irreparavel' ? dados.base_destino_id : null,
      },
    });

    return { mensagem: 'Retorno do fabricante registrado com sucesso' };
  }

  async resumoEstoque(empresa_id: string) {
    const total = await this.prisma.peca.count({ where: { empresa_id } });
    const em_estoque = await this.prisma.peca.count({ where: { empresa_id, status_atual: 'em_estoque_base' } });
    const em_transito = await this.prisma.peca.count({ where: { empresa_id, status_atual: 'em_transito' } });
    const instaladas = await this.prisma.peca.count({ where: { empresa_id, status_atual: 'instalada_equipamento' } });
    const nao_localizadas = await this.prisma.peca.count({ where: { empresa_id, status_atual: 'nao_localizada' } });
    const defeituosas = await this.prisma.peca.count({ where: { empresa_id, status_atual: 'defeituosa_aguardando_analise' } });
    const em_reparo = await this.prisma.peca.count({ where: { empresa_id, status_atual: 'em_reparo_fabricante' } });

    return { total, em_estoque, em_transito, instaladas, nao_localizadas, defeituosas, em_reparo };
  }
}