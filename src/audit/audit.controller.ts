import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Roles('super_admin', 'admin_global')
  @Get()
  listarLogs(
    @Request() req,
    @Query('entidade') entidade?: string,
    @Query('acao') acao?: string,
    @Query('usuario_id') usuario_id?: string,
    @Query('limite') limite?: string,
  ) {
    return this.auditService.buscarPorEmpresa(req.user.empresa_id, {
      entidade,
      acao,
      usuario_id,
      limite: limite ? parseInt(limite) : 100,
    });
  }

  @Roles('super_admin')
  @Get('todas-empresas')
  listarLogsTodasEmpresas(
    @Query('entidade') entidade?: string,
    @Query('acao') acao?: string,
    @Query('empresa_id') empresa_id?: string,
    @Query('limite') limite?: string,
  ) {
    return this.auditService.buscarTodos({
      entidade,
      acao,
      empresa_id,
      limite: limite ? parseInt(limite) : 200,
    });
  }
}