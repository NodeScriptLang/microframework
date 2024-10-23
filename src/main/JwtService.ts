import { ClientError } from '@nodescript/errors';
import { Schema } from 'airtight';
import jsonwebtoken from 'jsonwebtoken';
import { config } from 'mesh-config';

/**
 * Manages issuing and validation of JWT tokens.
 */
export class JwtService {

    @config() private JWT_PUBLIC_KEY!: string;
    @config() private JWT_PRIVATE_KEY!: string;
    @config({ default: 'nodescript.dev' }) private JWT_ISSUER!: string;

    createToken(
        payload: Record<string, any>,
        expiresInSeconds: number,
    ): string {
        return jsonwebtoken.sign({
            payload
        }, this.JWT_PRIVATE_KEY, {
            algorithm: 'RS256',
            issuer: this.JWT_ISSUER,
            expiresIn: expiresInSeconds,
        });
    }

    decodeToken<T>(
        token: string,
        schema: Schema<T>,
    ): T {
        const jwt = jsonwebtoken.verify(token, this.JWT_PUBLIC_KEY, {
            issuer: this.JWT_ISSUER,
        });
        if (typeof jwt === 'string' || !jwt.payload) {
            throw new ClientError('Unsupported JWT');
        }
        return schema.decode(jwt.payload);
    }

}
