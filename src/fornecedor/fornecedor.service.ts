import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FornecedorService {
  constructor(private prisma: PrismaService) {}

  async listar(empresa_id: string) {
    return this.prisma.fornecedor.findMany({
      where: { empresa_id, ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async buscar(id: string, empresa_id: string) {
    return this.prisma.fornecedor.findFirst({
      where: { id, empresa_id },
    });
  }

  async criar(empresa_id: string, dados: {
    nome: string;
    cnpj?: string;
    tipo: string;
    contato?: string;
    email?: string;
    telefone?: string;
    observacoes?: string;
  }) {
    return this.prisma.fornecedor.create({
      data: {
        empresa_id,
        nome: dados.nome,
        cnpj: dados.cnpj || null,
        tipo: dados.tipo,
        contato: dados.contato || null,
        email: dados.email || null,
        telefone: dados.telefone || null,
        observacoes: dados.observacoes || null,
      },
    });
  }

  async atualizar(id: string, empresa_id: string, dados: {
    nome?: string;
    cnpj?: string;
    tipo?: string;
    contato?: string;
    email?: string;
    telefone?: string;
    observacoes?: string;
    ativo?: boolean;
  }) {
    return this.prisma.fornecedor.updateMany({
      where: { id, empresa_id },
      data: dados,
    });
  }
}