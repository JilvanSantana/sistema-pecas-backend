import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MovimentacaoService } from './movimentacao.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('movimentacao')
export class MovimentacaoController {
  constructor(private movimentacaoService: MovimentacaoService) {}

  @Get('pendentes')
  listarPendentes(@Request() req) {
    return this.movimentacaoService.listarPendentes(req.user.empresa_id);
  }

  @Get()
  listar(
    @Request() req,
    @Query('status') status?: string,
    @Query('peca_id') peca_id?: string,
    @Query('equipamento_id') equipamento_id?: string,
  ) {
    return this.movimentacaoService.listar(req.user.empresa_id, { status, peca_id, equipamento_id });
  }

  @Post()
  registrarEnvio(
    @Body() body: {
      peca_id: string;
      origem_tipo: string;
      origem_id: string;
      destino_tipo: string;
      destino_id: string;
      motivo_envio: string;
      descricao_problema?: string;
      codigo_rastreio?: string;
      transportadora?: string;
      equipamento_id?: string;
      contrato_id?: string;
      ordem_servico_id?: string;
      causou_parada?: boolean;
      data_inicio_parada?: string;
      registrado_offline?: boolean;
      latitude_registro?: number;
      longitude_registro?: number;
    },
    @Request() req,
  ) {
    return this.movimentacaoService.registrarEnvio(
      req.user.empresa_id,
      req.user.id,
      body,
    );
  }

  @Post(':id/confirmar')
  confirmarRecebimento(
    @Param('id') id: string,
    @Body() body: {
      confirmado: boolean;
      condicao: string;
      data_fim_parada?: string;
    },
    @Request() req,
  ) {
    return this.movimentacaoService.confirmarRecebimento(
      id,
      req.user.empresa_id,
      req.user.id,
      body,
    );
  }
}