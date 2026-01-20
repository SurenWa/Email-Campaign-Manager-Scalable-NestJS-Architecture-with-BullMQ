import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '../strategies/jwt.strategy';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        // No roles required, allow access
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context
            .switchToHttp()
            .getRequest<{ user: JwtPayload }>();
        const user = request.user;

        if (!user || !user.role) {
            throw new ForbiddenException('Access denied: No role assigned');
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        const hasRole = requiredRoles.some((role) => user.role === role);

        if (!hasRole) {
            throw new ForbiddenException(
                `Access denied: Requires one of roles [${requiredRoles.join(', ')}]`,
            );
        }

        return true;
    }
}
