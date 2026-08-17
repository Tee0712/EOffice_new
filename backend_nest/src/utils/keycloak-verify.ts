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

/**
 * Xác thực Local JWT (HS256) token
 * Trả về decoded payload nếu hợp lệ, ngược lại throw error
 */
export function verifyLocalToken(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const jwtSecret = process.env.JWT_SECRET || 'EOFFICE_SECRET_KEY_2026';
    jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      resolve(decoded);
    });
  });
}

/**
 * Thử xác thực token với cả 2 phương pháp:
 * 1. Local JWT (HS256) - cho local login
 * 2. Keycloak (RS256) - cho SSO login
 * 
 * Trả về { type: 'local' | 'keycloak', payload: decoded }
 */
export async function verifyAnyToken(token: string): Promise<{ type: 'local' | 'keycloak'; payload: any }> {
  // Thử Local JWT trước
  try {
    const payload = await verifyLocalToken(token);
    return { type: 'local', payload };
  } catch (localErr) {
    // Thử Keycloak tiếp
    try {
      const payload = await verifyKeycloakToken(token);
      return { type: 'keycloak', payload };
    } catch (keycloakErr) {
      // Cả 2 đều fail - throw lỗi tổng hợp
      throw new Error(`Token verification failed: local=${localErr.message}, keycloak=${keycloakErr.message}`);
    }
  }
}
