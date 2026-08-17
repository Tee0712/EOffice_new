import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { UsbTokenSignService, PrepareHashDto } from './usb-token-sign.service';
import { JwtAuthGuard } from 'src/auth-sso/jwt.guard';

@Controller('v1/signature/usb-token')
@UseGuards(JwtAuthGuard)
export class UsbTokenSignController {
  constructor(private readonly usbTokenSignService: UsbTokenSignService) {}

  @Post('prepare-hash')
  prepareHash(@Body() dto: PrepareHashDto) {
    return this.usbTokenSignService.prepareHashForSigning(dto);
  }

  @Post('attach-signature')
  attachSignature(
    @Body()
    body: {
      fileBase64: string;
      signatureHex: string;
      certificatePem: string;
      signInfo?: { pageNumber?: number; x?: number; y?: number; signerName?: string };
    }
  ) {
    return this.usbTokenSignService.attachSignatureToPdf(
      body.fileBase64,
      body.signatureHex,
      body.certificatePem,
      body.signInfo
    );
  }
}
