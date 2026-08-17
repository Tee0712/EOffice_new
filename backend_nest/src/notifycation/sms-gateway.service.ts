import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface SmsPayload {
  phone: string;
  content: string;
  brandname?: string;
}

@Injectable()
export class SmsGatewayService {
  private readonly logger = new Logger(SmsGatewayService.name);

  /**
   * Gửi tin nhắn SMS Brandname nhắc họp / thông báo khẩn
   */
  async sendSms(payload: SmsPayload): Promise<{ success: boolean; messageId?: string }> {
    const brandname = payload.brandname || process.env.SMS_BRANDNAME || 'EOFFICE';
    const smsApiUrl = process.env.SMS_GATEWAY_URL;
    const smsApiKey = process.env.SMS_API_KEY;

    this.logger.log(`[SMS-Gateway] Gửi SMS Brandname [${brandname}] tới ${payload.phone}: "${payload.content}"`);

    if (!smsApiUrl || !smsApiKey) {
      this.logger.warn(`[SMS-Gateway] Chưa cấu hình SMS_GATEWAY_URL hoặc SMS_API_KEY. Chế độ mô phỏng (Simulated): Gửi thành công.`);
      return {
        success: true,
        messageId: `SIMULATED_${Date.now()}`,
      };
    }

    try {
      const response = await axios.post(
        smsApiUrl,
        {
          to: payload.phone,
          text: payload.content,
          brandname: brandname,
        },
        {
          headers: {
            Authorization: `Bearer ${smsApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      return {
        success: true,
        messageId: response.data?.messageId || response.data?.id,
      };
    } catch (error) {
      this.logger.error(`[SMS-Gateway] Gửi SMS thất bại: ${error.message}`);
      return {
        success: false,
      };
    }
  }
}
