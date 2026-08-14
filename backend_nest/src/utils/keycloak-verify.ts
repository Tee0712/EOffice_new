import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';

const keycloakJwksClient = jwksClient({
  jwksUri: `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/certs`,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
});

function getKey(header: any, callback: any) {
  keycloakJwksClient.getSigningKey(header.kid, function (err: any, key: any) {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

/**
 * Xác thực Keycloak RS256 token sử dụng jwks-rsa
 * Trả về decoded payload nếu hợp lệ, ngược lại throw error
 */
export function verifyKeycloakToken(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey as any, { algorithms: ['RS256'] }, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      resolve(decoded);
    });
  });
}
