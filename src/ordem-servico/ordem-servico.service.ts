import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdemServicoService {
  constructor(private prisma: PrismaService) {}

  async listarMinhas(tecnico_id: string, empresa_id: string) {
    return this.prisma.ordem_servico.findMany({
      where: {
        empresa_id,
        tecnico_id,
        status: { in: ['aberta', 'em_andamento'] },
      },
      include: {
        equipamento: {
          include: { contrato: true, base: true },
        },
      },
      orderBy: { data_abertura: 'desc' },
    });
  }

  async listar(empresa_id: string) {
    return this.prisma.ordem_servico.findMany({
      where: { empresa_id },
      include: {
        equipamento: true,
        tecnico: {
          include: { usuario: true },
        },
      },
      orderBy: { data_abertura: 'desc' },
    });
  }

  async criar(empresa_id: string, dados: {
    equipamento_id: string;
    tecnico_id?: string;
    tipo: string;
  }) {
    return this.prisma.ordem_servico.create({
      data: {
        empresa_id,
        equipamento_id: dados.equipamento_id,
        tecnico_id: dados.tecnico_id || null,
        tipo: dados.tipo,
        status: 'aberta',
      },
      include: {
        equipamento: true,
      },
    });
  }

  async concluir(id: string, empresa_id: string) {
    return this.prisma.ordem_servico.updateMany({
      where: { id, empresa_id },
      data: {
        status: 'concluida',
        data_conclusao: new Date(),
      },
    });
  }

  async atribuirTecnico(id: string, empresa_id: string, tecnico_id: string) {
    return this.prisma.ordem_servico.updateMany({
      where: { id, empresa_id },
      data: {
        tecnico_id,
        status: 'em_andamento',
      },
    });
  }
}