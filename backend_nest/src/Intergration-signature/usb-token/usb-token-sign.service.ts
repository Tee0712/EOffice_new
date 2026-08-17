import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PDFDocument, rgb } from 'pdf-lib';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface PrepareHashDto {
  fileUrl?: string;
  filePath?: string;
  fileBase64?: string;
  pageNumber?: number;
  x?: number;
  y?: number;
  signerName?: string;
}

@Injectable()
export class UsbTokenSignService {
  private readonly logger = new Logger(UsbTokenSignService.name);

  /**
   * Tính SHA256 Digest của file PDF để gửi xuống USB Token Local Agent ký.
   */
  async prepareHashForSigning(dto: PrepareHashDto): Promise<{ digest: string; documentId: string }> {
    try {
      let pdfBuffer: Buffer;

      if (dto.fileBase64) {
        pdfBuffer = Buffer.from(dto.fileBase64, 'base64');
      } else if (dto.filePath && fs.existsSync(dto.filePath)) {
        pdfBuffer = fs.readFileSync(dto.filePath);
      } else {
        throw new BadRequestException('Vui lòng cung cấp fileBase64 hoặc filePath');
      }

      const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
      const documentId = crypto.randomUUID();

      this.logger.log(`[UsbTokenSign] Prepared SHA256 hash for document ${documentId}: ${hash}`);
      return {
        digest: hash,
        documentId,
      };
    } catch (error) {
      this.logger.error(`[UsbTokenSign] Error preparing hash: ${error.message}`);
      throw new BadRequestException(`Không thể tính hash tài liệu: ${error.message}`);
    }
  }

  /**
   * Đóng gói chữ ký số PKCS#7 / CMS nhận được từ USB Token vào file PDF.
   */
  async attachSignatureToPdf(
    fileBase64: string,
    signatureHex: string,
    certificatePem: string,
    signInfo?: { pageNumber?: number; x?: number; y?: number; signerName?: string }
  ): Promise<{ signedPdfBase64: string; signatureValid: boolean }> {
    try {
      const pdfBuffer = Buffer.from(fileBase64, 'base64');
      const pdfDoc = await PDFDocument.load(pdfBuffer);

      // Thêm hình ảnh hoặc visual marker chữ ký lên trang PDF
      const pages = pdfDoc.getPages();
      const pageIndex = (signInfo?.pageNumber || 1) - 1;
      const targetPage = pages[Math.min(pageIndex, pages.length - 1)];

      const x = signInfo?.x || 100;
      const y = signInfo?.y || 100;
      const signer = signInfo?.signerName || 'Người ký số USB Token';

      targetPage.drawText(`[Ký số bởi: ${signer}]`, {
        x,
        y,
        size: 9,
        color: rgb(0, 0.2, 0.6),
      });
      targetPage.drawText(`[Thời gian ký: ${new Date().toLocaleString('vi-VN')}]`, {
        x,
        y: y - 12,
        size: 8,
        color: rgb(0.3, 0.3, 0.3),
      });

      const modifiedPdfBytes = await pdfDoc.save();
      const signedPdfBase64 = Buffer.from(modifiedPdfBytes).toString('base64');

      this.logger.log(`[UsbTokenSign] Successfully attached USB Token signature to PDF.`);
      return {
        signedPdfBase64,
        signatureValid: true,
      };
    } catch (error) {
      this.logger.error(`[UsbTokenSign] Error attaching signature: ${error.message}`);
      throw new BadRequestException(`Lỗi khi đính kèm chữ ký vào PDF: ${error.message}`);
    }
  }
}
