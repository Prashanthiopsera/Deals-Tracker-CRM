import { Injectable, UnauthorizedException } from '@nestjs/common';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { AuthUserContext } from './auth.types';

interface JwtPayload {
  sub: string;
  p7vc_user_id?: string;
  p7vc_role?: string;
  p7vc_team_id?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const domain = process.env.AUTH0_DOMAIN ?? 'p7vc.auth0.com';
    const audience = process.env.AUTH0_AUDIENCE ?? 'https://api.p7vc-crm.com';

    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience,
      issuer: `https://${domain}/`,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksUri: process.env.AUTH0_JWKS_URI ?? `https://${domain}/.well-known/jwks.json`,
      }),
    };

    super(options);
  }

  validate(payload: JwtPayload): AuthUserContext {
    if (!payload.p7vc_user_id || !payload.p7vc_role) {
      throw new UnauthorizedException('Missing required token claims');
    }

    return {
      sub: payload.sub,
      p7vcUserId: payload.p7vc_user_id,
      p7vcRole: payload.p7vc_role,
      p7vcTeamId: payload.p7vc_team_id,
    };
  }
}
