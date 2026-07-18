import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ContratoService } from './contrato.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('contrato')
export class ContratoController {
  constructor(private contratoService: ContratoService) {}

  @Get()
  listar(@Request() req) {
    return this.contratoService.listar(req.user.empresa_id);
  }

  @Get(':id')
  buscar(@Param('id') id: string, @Request() req) {
    return this.contratoService.buscar(id, req.user.empresa_id);
  }

  @Post()
  criar(
    @Body() body: {
      numero_contrato: string;
      orgao_contratante: string;
      sla_horas_atendimento: number;
      data_inicio: string;
      data_fim?: string;
    },
    @Request() req,
  ) {
    return this.contratoService.criar(req.user.empresa_id, body);
  }

  @Patch(':id')
  atualizar(
    @Param('id') id: string,
    @Body() body: {
      numero_contrato?: string;
      orgao_contratante?: string;
      sla_horas_atendimento?: number;
      data_inicio?: string;
      data_fim?: string;
      status?: string;
    },
    @Request() req,
  ) {
    return this.contratoService.atualizar(id, req.user.empresa_id, body);
  }
}