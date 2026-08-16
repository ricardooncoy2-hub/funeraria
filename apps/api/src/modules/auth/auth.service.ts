import { randomBytes, createHash } from 'node:crypto';
import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { SedeScopeService } from '../authz/sede-scope.service';
import { AuthenticatedUser } from '../authz/authz.types';

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly sedeScopeService: SedeScopeService,
  ) {}

  async login(
    identificador: string,
    password: string,
    meta: RequestMeta,
  ): Promise<AuthTokens & { user: AuthenticatedUser }> {
    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [{ correo: identificador }, { usuario: identificador }],
      },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException({
        code: 'CREDENCIALES_INVALIDAS',
        message: 'Usuario o contraseña incorrectos.',
      });
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { ultimoLoginAt: new Date() } });

    const context = await this.sedeScopeService.buildUserContext(user.id);
    const tokens = await this.issueTokens(user.id, meta);
    return { ...tokens, user: context };
  }

  async refresh(rawRefreshToken: string, meta: RequestMeta): Promise<AuthTokens> {
    const tokenHash = hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findFirst({ where: { tokenHash } });

    if (!stored) {
      throw new UnauthorizedException({
        code: 'REFRESH_INVALIDO',
        message: 'Refresh token inválido.',
      });
    }

    if (stored.revokedAt) {
      // Reutilización de un refresh ya rotado: posible robo — se revoca toda la sesión (docs/16 §16.1).
      await this.prisma.refreshToken.updateMany({
        where: { usuarioId: stored.usuarioId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException({
        code: 'REFRESH_REUTILIZADO',
        message: 'Sesión inválida, vuelva a iniciar sesión.',
      });
    }

    if (stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException({
        code: 'REFRESH_EXPIRADO',
        message: 'La sesión expiró, vuelva a iniciar sesión.',
      });
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(stored.usuarioId, meta);
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async changePassword(
    userId: bigint,
    passwordActual: string,
    passwordNueva: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await bcrypt.compare(passwordActual, user.passwordHash))) {
      throw new ForbiddenException({
        code: 'PASSWORD_INCORRECTA',
        message: 'La contraseña actual no es correcta.',
      });
    }
    const passwordHash = await bcrypt.hash(passwordNueva, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
    });
    // Cambiar la contraseña cierra el resto de sesiones activas.
    await this.prisma.refreshToken.updateMany({
      where: { usuarioId: userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(usuarioId: bigint, meta: RequestMeta): Promise<AuthTokens> {
    const accessToken = await this.jwtService.signAsync({ sub: usuarioId.toString() });

    const refreshToken = randomBytes(48).toString('base64url');
    const days = Number(this.configService.get<string>('JWT_REFRESH_EXPIRES_DAYS') ?? '7');
    const refreshExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        usuarioId,
        tokenHash: hashToken(refreshToken),
        expiresAt: refreshExpiresAt,
        userAgent: meta.userAgent?.slice(0, 255),
        ip: meta.ip?.slice(0, 45),
      },
    });

    return { accessToken, refreshToken, refreshExpiresAt };
  }
}
