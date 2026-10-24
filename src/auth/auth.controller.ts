import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ─── LOGIN: máximo 5 tentativas por minuto por IP ─────────────────────────
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('login')
  async login(@Body() body: { email: string; senha: string }) {
    return this.authService.login(body.email, body.senha);
  }

  // ─── REGISTRAR: máximo 3 tentativas por minuto por IP ────────────────────
  @Throttle({ default: { ttl: 60000, limit: 3 } })
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