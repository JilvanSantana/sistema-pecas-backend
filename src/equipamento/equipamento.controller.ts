import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { EquipamentoService } from './equipamento.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('equipamento')
export class EquipamentoController {
  constructor(private equipamentoService: EquipamentoService) {}

  @Get('resumo')
  resumo(@Request() req) {
    return this.equipamentoService.resumoPorStatus(req.user.empresa_id, req.user);
  }

  @Get('qr/:codigo')
  buscarPorQr(@Param('codigo') codigo: string, @Request() req) {
    return this.equipamentoService.buscarPorQr(codigo, req.user.empresa_id);
  }

  @Get()
  listar(
    @Request() req,
    @Query('tipo') tipo?: string,
    @Query('status') status?: string,
    @Query('base_id') base_id?: string,
  ) {
    return this.equipamentoService.listar(req.user.empresa_id, req.user, { tipo, status, base_id });
  }

  @Get(':id')
  buscar(@Param('id') id: string, @Request() req) {
    return this.equipamentoService.buscar(id, req.user.empresa_id);
  }

  @Post()
  criar(@Body() body: {
    tipo: string;
    numero_serie?: string;
    modelo?: string;
    fabricante?: string;
    localizacao_instalacao: string;
    quantidade_faixas?: number;
    latitude?: number;
    longitude?: number;
    base_responsavel_id: string;
    contrato_id?: string;
  }, @Request() req) {
    return this.equipamentoService.criar(req.user.empresa_id, body);
  }

  @Patch(':id/status')
  atualizarStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Request() req,
  ) {
    return this.equipamentoService.atualizarStatus(id, req.user.empresa_id, body.status);
  }
}