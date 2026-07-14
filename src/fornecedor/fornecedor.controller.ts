import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { FornecedorService } from './fornecedor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('fornecedor')
export class FornecedorController {
  constructor(private fornecedorService: FornecedorService) {}

  @Get()
  listar(@Request() req) {
    return this.fornecedorService.listar(req.user.empresa_id);
  }

  @Get(':id')
  buscar(@Param('id') id: string, @Request() req) {
    return this.fornecedorService.buscar(id, req.user.empresa_id);
  }

  @Post()
  criar(
    @Body() body: {
      nome: string;
      cnpj?: string;
      tipo: string;
      contato?: string;
      email?: string;
      telefone?: string;
      observacoes?: string;
    },
    @Request() req,
  ) {
    return this.fornecedorService.criar(req.user.empresa_id, body);
  }

  @Patch(':id')
  atualizar(
    @Param('id') id: string,
    @Body() body: {
      nome?: string;
      cnpj?: string;
      tipo?: string;
      contato?: string;
      email?: string;
      telefone?: string;
      observacoes?: string;
      ativo?: boolean;
    },
    @Request() req,
  ) {
    return this.fornecedorService.atualizar(id, req.user.empresa_id, body);
  }
}