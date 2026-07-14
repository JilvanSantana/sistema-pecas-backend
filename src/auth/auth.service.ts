import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, senha: string) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { email, ativo: true },
    });

    if (!usuario || !usuario.senha_hash) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      papel: usuario.papel,
      empresa_id: usuario.empresa_id,
    };

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
        empresa_id: usuario.empresa_id,
      },
    };
  }

  async registrarUsuario(dados: {
    empresa_id: string;
    nome: string;
    email: string;
    senha: string;
    papel: string;
    base_id?: string;
  }) {
    const senha_hash = await bcrypt.hash(dados.senha, 10);

    const usuario = await this.prisma.usuario.create({
      data: {
        empresa_id: dados.empresa_id,
        nome: dados.nome,
        email: dados.email,
        senha_hash,
        papel: dados.papel,
        base_id: dados.base_id || null,
      },
    });

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
    };
  }
}