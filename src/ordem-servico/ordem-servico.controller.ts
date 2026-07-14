import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OrdemServicoService } from './ordem-servico.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ordem-servico')
export class OrdemServicoController {
  constructor(private ordemServicoService: OrdemServicoService) {}

  @Get('minhas')
  listarMinhas(@Request() req) {
    return this.ordemServicoService.listarMinhas(
      req.user.id,
      req.user.empresa_id,
    );
  }

  @Get()
  listar(@Request() req) {
    return this.ordemServicoService.listar(req.user.empresa_id);
  }

  @Post()
  criar(
    @Body() body: {
      equipamento_id: string;
      tecnico_id?: string;
      tipo: string;
    },
    @Request() req,
  ) {
    return this.ordemServicoService.criar(req.user.empresa_id, body);
  }

  @Post(':id/concluir')
  concluir(@Param('id') id: string, @Request() req) {
    return this.ordemServicoService.concluir(id, req.user.empresa_id);
  }

  @Post(':id/atribuir')
  atribuirTecnico(
    @Param('id') id: string,
    @Body() body: { tecnico_id: string },
    @Request() req,
  ) {
    return this.ordemServicoService.atribuirTecnico(
      id,
      req.user.empresa_id,
      body.tecnico_id,
    );
  }
}