import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('empresa')
export class EmpresaController {
  constructor(private empresaService: EmpresaService) {}

  @Roles('super_admin')
  @Get()
  listarEmpresas() {
    return this.empresaService.listarEmpresas();
  }

  @Roles('super_admin')
  @Get(':id')
  buscarEmpresa(@Param('id') id: string) {
    return this.empresaService.buscarEmpresa(id);
  }

  @Roles('super_admin')
  @Post()
  criarEmpresa(
    @Body() body: {
      razao_social: string;
      cnpj: string;
      plano_id?: string;
    },
  ) {
    return this.empresaService.criarEmpresa(body);
  }

  @Roles('super_admin')
  @Post('onboarding')
  criarEmpresaComAdmin(
    @Body() body: {
      razao_social: string;
      cnpj: string;
      plano_id?: string;
      admin_nome: string;
      admin_email: string;
      admin_senha: string;
      base_nome: string;
      base_estado: string;
      base_cidade?: string;
    },
  ) {
    return this.empresaService.criarEmpresaComAdmin(body);
  }

  @Roles('super_admin')
  @Patch(':id/bloquear')
  bloquearEmpresa(@Param('id') id: string) {
    return this.empresaService.bloquearEmpresa(id);
  }

  @Roles('super_admin')
  @Patch(':id/desbloquear')
  desbloquearEmpresa(@Param('id') id: string) {
    return this.empresaService.desbloquearEmpresa(id);
  }

  @Roles('super_admin')
  @Delete(':id')
  deletarEmpresa(@Param('id') id: string) {
    return this.empresaService.deletarEmpresa(id);
  }

  @Roles('super_admin')
  @Get(':id/bases')
  listarBases(@Param('id') id: string) {
    return this.empresaService.listarBases(id);
  }

  // ✅ CORRIGIDO: admin_global pode criar base na própria empresa
  @Roles('super_admin', 'admin_global')
  @Post(':id/bases')
  criarBase(
    @Param('id') empresa_id: string,
    @Body() body: {
      nome: string;
      tipo: string;
      estado: string;
      cidade?: string;
      endereco?: string;
    },
  ) {
    return this.empresaService.criarBase({ ...body, empresa_id });
  }

  @Roles('super_admin', 'admin_global')
  @Get('usuarios')
  listarUsuariosDaEmpresa(@Request() req) {
    return this.empresaService.listarUsuarios(req.user.empresa_id);
  }

  @Roles('super_admin')
  @Get(':id/usuarios')
  listarUsuarios(@Param('id') id: string) {
    return this.empresaService.listarUsuarios(id);
  }

  @Roles('super_admin', 'admin_global')
  @Post('usuarios')
  criarUsuario(
    @Body() body: { nome: string; email: string; senha: string; papel: string; base_id?: string },
    @Request() req,
  ) {
    return this.empresaService.criarUsuario(req.user.empresa_id, body);
  }

  @Roles('super_admin', 'admin_global')
  @Patch('usuarios/:id/bloquear')
  bloquearUsuario(@Param('id') id: string, @Request() req) {
    return this.empresaService.bloquearUsuario(id, req.user.empresa_id);
  }

  @Roles('super_admin', 'admin_global')
  @Patch('usuarios/:id/desbloquear')
  desbloquearUsuario(@Param('id') id: string, @Request() req) {
    return this.empresaService.desbloquearUsuario(id, req.user.empresa_id);
  }

  @Roles('super_admin', 'admin_global')
  @Delete('usuarios/:id')
  deletarUsuario(@Param('id') id: string, @Request() req) {
    return this.empresaService.deletarUsuario(id, req.user.empresa_id);
  }
}