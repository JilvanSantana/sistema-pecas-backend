import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AfericaoService } from './afericao.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('afericao')
export class AfericaoController {
  constructor(private afericaoService: AfericaoService) {}

  @Get()
  listar(@Query('equipamento_id') equipamento_id: string, @Request() req) {
    return this.afericaoService.listar(req.user.empresa_id, equipamento_id);
  }

  @Get('vencendo')
  listarVencendo(@Query('dias') dias: string, @Request() req) {
    const diasAntecedencia = dias ? parseInt(dias, 10) : 30;
    return this.afericaoService.listarVencendo(req.user.empresa_id, diasAntecedencia);
  }

  @Get(':id')
  buscar(@Param('id') id: string, @Request() req) {
    return this.afericaoService.buscar(id, req.user.empresa_id);
  }

  @Post()
  criar(
    @Body() body: {
      equipamento_id: string;
      data_afericao: string;
      data_validade?: string;
      orgao_responsavel: string;
      numero_certificado?: string;
      anexo_certificado_url?: string;
      observacoes?: string;
    },
    @Request() req,
  ) {
    return this.afericaoService.criar(req.user.empresa_id, req.user.id, body);
  }

  @Patch(':id')
  atualizar(
    @Param('id') id: string,
    @Body() body: {
      data_afericao?: string;
      data_validade?: string;
      orgao_responsavel?: string;
      numero_certificado?: string;
      anexo_certificado_url?: string;
      observacoes?: string;
    },
    @Request() req,
  ) {
    return this.afericaoService.atualizar(id, req.user.empresa_id, body);
  }
}