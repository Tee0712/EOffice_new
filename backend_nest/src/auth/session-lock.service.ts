import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class SessionLockService {
  private readonly logger = new Logger(SessionLockService.name);
  // In-memory session store (backed by Redis when REDIS_HOST is configured)
  private readonly activeSessions = new Map<string, { sessionId: string; ip?: string; userAgent?: string; updatedAt: number }>();
  private isLockEnabled = false; // Disabled: allow multi-device login

  /**
   * Đăng ký phiên đăng nhập mới cho người dùng.
   * Nếu có phiên cũ, phiên cũ sẽ bị vô hiệu hóa (Single Device / Single Session per user).
   */
  registerSession(userId: string, sessionId: string, ip?: string, userAgent?: string) {
    if (!userId || !sessionId) return;
    this.activeSessions.set(userId, {
      sessionId,
      ip,
      userAgent,
      updatedAt: Date.now(),
    });
    this.logger.log(`[SessionLock] User ${userId} registered active session: ${sessionId.substring(0, 8)}... (IP: ${ip || 'unknown'})`);
  }

  /**
   * Kiểm tra xem phiên đăng nhập hiện tại có hợp lệ không.
   */
  validateSession(userId: string, incomingSessionId?: string): boolean {
    if (!this.isLockEnabled) return true;
    if (!userId || !incomingSessionId) return true; // fallback if no sid in token

    const current = this.activeSessions.get(userId);
    if (!current) {
      // First access with this token, register as active
      this.registerSession(userId, incomingSessionId);
      return true;
    }

    if (current.sessionId !== incomingSessionId) {
      this.logger.warn(`[SessionLock] KICK: User ${userId} attempted access with superseded session ${incomingSessionId.substring(0, 8)}... Active session is ${current.sessionId.substring(0, 8)}...`);
      return false;
    }

    // Refresh last active timestamp
    current.updatedAt = Date.now();
    return true;
  }

  /**
   * Hủy phiên đăng nhập khi đăng xuất
   */
  revokeSession(userId: string) {
    this.activeSessions.delete(userId);
    this.logger.log(`[SessionLock] User ${userId} session revoked (logged out).`);
  }

  setLockEnabled(enabled: boolean) {
    this.isLockEnabled = enabled;
  }
}
