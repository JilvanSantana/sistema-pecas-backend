import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmpresaService {
  constructor(private prisma: PrismaService) {}

  async listarEmpresas() {
    return this.prisma.empresa.findMany({
      include: {
        plano: true,
        _count: {
          select: { usuario: true, equipamento: true, base: true },
        },
      },
      orderBy: { criado_em: 'desc' },
    });
  }

  async buscarEmpresa(id: string) {
    return this.prisma.empresa.findUnique({
      where: { id },
      include: { plano: true, base: true },
    });
  }

  async criarEmpresaComAdmin(dados: {
    razao_social: string;
    cnpj: string;
    plano_id?: string;
    admin_nome: string;
    admin_email: string;
    admin_senha: string;
    base_nome: string;
    base_estado: string;
    base_cidade?: string;
  }) {
    const cnpjExistente = await this.prisma.empresa.findUnique({
      where: { cnpj: dados.cnpj },
    });
    if (cnpjExistente) {
      throw new BadRequestException('CNPJ já cadastrado no sistema');
    }

    const empresa = await this.prisma.empresa.create({
      data: {
        razao_social: dados.razao_social,
        cnpj: dados.cnpj,
        plano_id: dados.plano_id || null,
        status_assinatura: 'trial',
      },
    });

    const base = await this.prisma.base.create({
      data: {
        empresa_id: empresa.id,
        nome: dados.base_nome,
        tipo: 'sede',
        estado: dados.base_estado,
        cidade: dados.base_cidade || null,
      },
    });

    const senha_hash = await bcrypt.hash(dados.admin_senha, 10);
    await this.prisma.usuario.create({
      data: {
        empresa_id: empresa.id,
        nome: dados.admin_nome,
        email: dados.admin_email,
        senha_hash,
        papel: 'admin_global',
        base_id: base.id,
      },
    });

    return { empresa, mensagem: 'Empresa criada com sucesso, com sede e administrador.' };
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

  async bloquearEmpresa(id: string) {
    await this.prisma.empresa.update({
      where: { id },
      data: { status_assinatura: 'bloqueada' },
    });
    return { mensagem: 'Empresa bloqueada.' };
  }

  async desbloquearEmpresa(id: string) {
    await this.prisma.empresa.update({
      where: { id },
      data: { status_assinatura: 'ativo' },
    });
    return { mensagem: 'Empresa desbloqueada.' };
  }

  async deletarEmpresa(id: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.log_auditoria.deleteMany({ where: { empresa_id: id } });
      await tx.ordem_servico.deleteMany({ where: { empresa_id: id } });
      await tx.afericao.deleteMany({ where: { empresa_id: id } });
      await tx.contrato.deleteMany({ where: { empresa_id: id } });
      await tx.movimentacao.deleteMany({ where: { empresa_id: id } });
      await tx.peca.deleteMany({ where: { empresa_id: id } });
      await tx.equipamento.deleteMany({ where: { empresa_id: id } });
      await tx.tecnico.deleteMany({ where: { empresa_id: id } });
      await tx.usuario.deleteMany({ where: { empresa_id: id } });
      await tx.base.deleteMany({ where: { empresa_id: id } });
      await tx.empresa.delete({ where: { id } });
    });

    return { mensagem: 'Empresa excluída permanentemente.' };
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
      where: {
        empresa_id,
        papel: { not: 'super_admin' },
      },
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

  async criarUsuario(empresa_id: string, dados: {
    nome: string;
    email: string;
    senha: string;
    papel: string;
    base_id?: string;
  }) {
    const emailExistente = await this.prisma.usuario.findFirst({
      where: { empresa_id, email: dados.email },
    });
    if (emailExistente) {
      throw new BadRequestException('Email já cadastrado nesta empresa');
    }

    const senha_hash = await bcrypt.hash(dados.senha, 10);
    const usuario = await this.prisma.usuario.create({
      data: {
        empresa_id,
        nome: dados.nome,
        email: dados.email,
        senha_hash,
        papel: dados.papel,
        base_id: dados.base_id || null,
      },
    });

    if (dados.papel === 'tecnico' && dados.base_id) {
      await this.prisma.tecnico.create({
        data: {
          usuario: { connect: { id: usuario.id } },
          empresa: { connect: { id: empresa_id } },
          base: { connect: { id: dados.base_id } },
        },
      });
    }

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
    };
  }

  async bloquearUsuario(id: string, empresa_id: string) {
    await this.prisma.usuario.updateMany({
      where: { id, empresa_id },
      data: { ativo: false },
    });
    return { mensagem: 'Usuário bloqueado.' };
  }

  async desbloquearUsuario(id: string, empresa_id: string) {
    await this.prisma.usuario.updateMany({
      where: { id, empresa_id },
      data: { ativo: true },
    });
    return { mensagem: 'Usuário desbloqueado.' };
  }

  async deletarUsuario(id: string, empresa_id: string) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id, empresa_id },
    });

    if (!usuario || usuario.papel === 'super_admin') {
      throw new BadRequestException('Não é possível excluir este usuário');
    }

    await this.prisma.tecnico.deleteMany({
      where: { usuario_id: id, empresa_id },
    });

    await this.prisma.usuario.deleteMany({
      where: { id, empresa_id },
    });

    return { mensagem: 'Usuário excluído com sucesso.' };
  }
}