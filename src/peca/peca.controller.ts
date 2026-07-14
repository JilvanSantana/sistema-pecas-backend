import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PecaService } from './peca.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('peca')
export class PecaController {
  constructor(private pecaService: PecaService) {}

  @Get('resumo')
  resumo(@Request() req) {
    return this.pecaService.resumoEstoque(req.user.empresa_id);
  }

  @Get()
  listar(
    @Request() req,
    @Query('categoria') categoria?: string,
    @Query('status') status?: string,
    @Query('base_id') base_id?: string,
  ) {
    return this.pecaService.listar(req.user.empresa_id, { categoria, status, base_id });
  }

  @Get('qr/:codigo')
  buscarPorQr(@Param('codigo') codigo: string, @Request() req) {
    return this.pecaService.buscarPorQr(codigo, req.user.empresa_id);
  }

  @Post()
  criar(
    @Body() body: {
      descricao: string;
      categoria: string;
      base_atual_id: string;
    },
    @Request() req,
  ) {
    return this.pecaService.criar(req.user.empresa_id, body);
  }

  @Post('lote')
  criarEmLote(
    @Body() body: {
      pecas: {
        descricao: string;
        categoria: string;
        base_atual_id: string;
      }[];
    },
    @Request() req,
  ) {
    return this.pecaService.criarEmLote(req.user.empresa_id, body.pecas);
  }

  @Post(':id/enviar-fabricante')
  enviarAoFabricante(
    @Param('id') id: string,
    @Body() body: {
      fornecedor_id: string;
      observacao: string;
      previsao_retorno?: string;
    },
    @Request() req,
  ) {
    return this.pecaService.enviarAoFabricante(id, req.user.empresa_id, body);
  }

  @Post(':id/retorno-fabricante')
  retornoFabricante(
    @Param('id') id: string,
    @Body() body: {
      base_destino_id: string;
      condicao: string;
    },
    @Request() req,
  ) {
    return this.pecaService.retornoFabricante(id, req.user.empresa_id, body);
  }
}