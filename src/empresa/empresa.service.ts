import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmpresaService {
  constructor(private prisma: PrismaService) {}

  async listarEmpresas() {
    return this.prisma.empresa.findMany({
      include: { plano: true },
    });
  }

  async buscarEmpresa(id: string) {
    return this.prisma.empresa.findUnique({
      where: { id },
      include: { plano: true, base: true },
    });
  }

  async criarEmpresa(dados: {
    razao_social: string;
    cnpj: string;
    plano_id?: string;
  }) {
    return this.prisma.empresa.create({
      data: {
        razao_social: dados.razao_social,
        cnpj: dados.cnpj,
        plano_id: dados.plano_id || null,
        status_assinatura: 'trial',
      },
    });
  }

  async listarBases(empresa_id: string) {
    return this.prisma.base.findMany({
      where: { empresa_id },
    });
  }

  async criarBase(dados: {
    empresa_id: string;
    nome: string;
    tipo: string;
    estado: string;
    cidade?: string;
    endereco?: string;
  }) {
    return this.prisma.base.create({
      data: {
        empresa_id: dados.empresa_id,
        nome: dados.nome,
        tipo: dados.tipo,
        estado: dados.estado,
        cidade: dados.cidade || null,
        endereco: dados.endereco || null,
      },
    });
  }

  async listarUsuarios(empresa_id: string) {
    return this.prisma.usuario.findMany({
      where: { empresa_id },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        ativo: true,
        base: {
          select: { nome: true, estado: true },
        },
      },
      orderBy: { nome: 'asc' },
    });
  }
}