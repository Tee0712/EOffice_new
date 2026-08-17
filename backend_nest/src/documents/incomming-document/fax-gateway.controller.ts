import { Controller, Post, Body, UploadedFile, UseInterceptors, Logger, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IncomingService } from './incoming.service';

export interface FaxWebhookPayload {
  callerNumber?: string;
  recipientNumber?: string;
  receivedTime?: string;
  pageCount?: number;
  faxId?: string;
}

@Controller('v1/incoming-documents/fax')
export class FaxGatewayController {
  private readonly logger = new Logger(FaxGatewayController.name);

  constructor(private readonly incommingService: IncomingService) {}

  /**
   * Webhook tiếp nhận Fax tự động từ FoIP / Fax Server Gateway.
   */
  @Post('webhook')
  @UseInterceptors(FileInterceptor('faxFile'))
  async receiveFaxWebhook(
    @Body() payload: FaxWebhookPayload,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    this.logger.log(`[Fax-Gateway] Nhận Fax mới từ số: ${payload.callerNumber || 'Không rõ'}, Số trang: ${payload.pageCount || 1}, Fax ID: ${payload.faxId || 'N/A'}`);

    // Tạo bản ghi văn bản đến với nguồn tiếp nhận là 'FAX'
    const defaultData: any = {
      title: `Văn bản Fax từ ${payload.callerNumber || 'Tổng đài Fax'} (${payload.receivedTime || new Date().toLocaleDateString('vi-VN')})`,
      documentType: 'FAX',
      sourceType: 'FAX',
      arrivedDate: new Date(),
      status: 'CHO_TIEP_NHAN',
      note: `Tự động nhận qua Fax Server Gateway. Fax ID: ${payload.faxId || 'N/A'}, Số gửi: ${payload.callerNumber || 'N/A'}`,
    };

    return {
      success: true,
      message: 'Tiếp nhận Fax tự động thành công.',
      data: defaultData,
    };
  }
}
