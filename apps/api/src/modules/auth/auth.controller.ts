import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { AuthenticatedUser } from '../authz/authz.types';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_PATH = '/api/v1/auth';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @ApiOperation({ summary: 'Login con correo/usuario y contraseña (RF-001)' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto.usuario, dto.password, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    this.setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
    return {
      accessToken: result.accessToken,
      user: this.serializeUser(result.user),
    };
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Renueva el access token usando el refresh token en cookie (RF-002)' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = this.extractRefreshCookie(req);
    const result = await this.authService.refresh(rawToken, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    this.setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
    return { accessToken: result.accessToken };
  }

  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  @ApiOperation({ summary: 'Revoca el refresh token actual (RF-003)' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = this.extractRefreshCookie(req, { optional: true });
    if (rawToken) await this.authService.logout(rawToken);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
  }

  @Get('me')
  @ApiOperation({ summary: 'Perfil, roles y sedes autorizadas del usuario autenticado' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.serializeUser(user);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Cambia la contraseña del usuario autenticado (RF-008)' })
  async changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(user.id, dto.passwordActual, dto.passwordNueva);
    return { status: 'ok' };
  }

  private serializeUser(user: AuthenticatedUser) {
    return {
      id: user.id.toString(),
      correo: user.correo,
      usuario: user.usuario,
      nombres: user.nombres,
      apellidos: user.apellidos,
      esCorporativo: user.esCorporativo,
      mustChangePassword: user.mustChangePassword,
      roles: user.roles,
      permisos: user.permisos,
      sedeIds: user.sedeIds.map(String),
      isCorporate: user.isCorporate,
    };
  }

  private setRefreshCookie(res: Response, token: string, expiresAt: Date): void {
    res.cookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      path: REFRESH_COOKIE_PATH,
      expires: expiresAt,
    });
  }

  private extractRefreshCookie(req: Request, options?: { optional: boolean }): string {
    const cookies = req.cookies as Record<string, string> | undefined;
    const token = cookies?.[REFRESH_COOKIE_NAME];
    if (!token && !options?.optional) {
      throw new UnauthorizedException({
        code: 'REFRESH_AUSENTE',
        message: 'No hay sesión activa.',
      });
    }
    return token ?? '';
  }
}
