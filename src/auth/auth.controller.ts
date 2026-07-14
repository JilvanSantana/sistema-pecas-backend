import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; senha: string }) {
    return this.authService.login(body.email, body.senha);
  }

  @Post('registrar')
  async registrar(
    @Body()
    body: {
      empresa_id: string;
      nome: string;
      email: string;
      senha: string;
      papel: string;
      base_id?: string;
    },
  ) {
    return this.authService.registrarUsuario(body);
  }
}