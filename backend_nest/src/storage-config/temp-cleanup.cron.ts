import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TempCleanupCron {
  private readonly logger = new Logger(TempCleanupCron.name);

  /**
   * Quét và dọn dẹp các tệp tạm thời (PDF preview, temporary upload) cũ hơn 7 ngày.
   * Chạy tự động lúc 02:00 sáng hàng ngày.
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCleanupTempFiles() {
    this.logger.log('[TempCleanupCron] Bắt đầu quét dọn dẹp file tạm thời...');
    const tempDir = path.join(process.cwd(), 'upload', 'temp');

    if (!fs.existsSync(tempDir)) {
      return;
    }

    try {
      const files = fs.readdirSync(tempDir);
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);

        if (stats.isFile() && stats.mtimeMs < sevenDaysAgo) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }

      this.logger.log(`[TempCleanupCron] Đã xóa ${deletedCount} tệp tạm thời hết hạn.`);
    } catch (error) {
      this.logger.error(`[TempCleanupCron] Lỗi khi dọn dẹp file tạm: ${error.message}`);
    }
  }
}
