import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
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

  @Get('usuarios')
  listarUsuariosDaEmpresa(@Request() req) {
    return this.empresaService.listarUsuarios(req.user.empresa_id);
  }

  @Get(':id')
  buscarEmpresa(@Param('id') id: string) {
    return this.empresaService.buscarEmpresa(id);
  }

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

  @Patch(':id/bloquear')
  bloquearEmpresa(@Param('id') id: string) {
    return this.empresaService.bloquearEmpresa(id);
  }

  @Patch(':id/desbloquear')
  desbloquearEmpresa(@Param('id') id: string) {
    return this.empresaService.desbloquearEmpresa(id);
  }

  @Get(':id/bases')
  listarBases(@Param('id') id: string) {
    return this.empresaService.listarBases(id);
  }

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

  @Get(':id/usuarios')
  listarUsuarios(@Param('id') id: string) {
    return this.empresaService.listarUsuarios(id);
  }

  @Post('usuarios')
  criarUsuario(@Body() body: { nome: string; email: string; senha: string; papel: string; base_id?: string }, @Request() req) {
    return this.empresaService.criarUsuario(req.user.empresa_id, body);
  }

  @Patch('usuarios/:id/bloquear')
  bloquearUsuario(@Param('id') id: string, @Request() req) {
    return this.empresaService.bloquearUsuario(id, req.user.empresa_id);
  }

  @Patch('usuarios/:id/desbloquear')
  desbloquearUsuario(@Param('id') id: string, @Request() req) {
    return this.empresaService.desbloquearUsuario(id, req.user.empresa_id);
  }
}