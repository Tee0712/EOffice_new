import { Controller, Post, Body, Request } from '@nestjs/common';

@Controller('attachments')
export class AttachmentsController {
  @Post('upload')
  uploadFile(@Request() req: any, @Body() body: any) {
    return { 
      fileUrl: `https://storage.example.com/mock-upload-${Date.now()}.pdf`,
      fileName: 'uploaded-file.pdf'
    };
  }
}
