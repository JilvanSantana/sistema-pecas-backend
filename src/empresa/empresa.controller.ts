import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('empresa')
export class EmpresaController {
  constructor(private empresaService: EmpresaService) {}

  @Get()
  listarEmpresas() {
    return this.empresaService.listarEmpresas();
  }

  @Get(':id')
  buscarEmpresa(@Param('id') id: string) {
    return this.empresaService.buscarEmpresa(id);
  }

  @Post()
  criarEmpresa(
    @Body()
    body: {
      razao_social: string;
      cnpj: string;
      plano_id?: string;
    },
  ) {
    return this.empresaService.criarEmpresa(body);
  }

  @Get(':id/bases')
  listarBases(@Param('id') id: string) {
    return this.empresaService.listarBases(id);
  }

  @Post(':id/bases')
  criarBase(
    @Param('id') empresa_id: string,
    @Body()
    body: {
      nome: string;
      tipo: string;
      estado: string;
      cidade?: string;
      endereco?: string;
    },
  ) {
    return this.empresaService.criarBase({ ...body, empresa_id });
  }

  @Get(':id/usuarios')
  listarUsuarios(@Param('id') id: string) {
    return this.empresaService.listarUsuarios(id);
  }
}