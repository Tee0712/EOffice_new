import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/oauth/jwt.guard';
import { ProgramsService } from '../service/programs.service';
import { CreateProgramDto } from '../dto/create-program.dto';

@ApiTags('ASXH - Chương trình')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) { }

  @Get('generate-code')
  @ApiOperation({ summary: 'Sinh mã chương trình tự động' })
  async generateCode(@Query('funding_type') fundingType: string) {
    const code = await this.programsService.generateCode(fundingType || 'CASH');
    return { success: true, data: { code } };
  }

  @Get('incoming-documents/search')
  @ApiOperation({ summary: 'Tìm kiếm văn bản đến (Local)' })
  async searchIncomingDocuments(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('keyword') keyword?: string,
  ) {
    const data = await this.programsService.searchIncomingDocuments(
      Number(page) || 1,
      Number(limit) || 10,
      keyword,
    );
    return data;
  }

  @Post()
  @ApiOperation({ summary: 'Khởi tạo chương trình mới' })
  async create(@Body() dto: CreateProgramDto) {
    const data = await this.programsService.create(dto);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xoá chương trình (Rollback/Cleanup)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.programsService.remove(id);
    return { success: true };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật chương trình' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    const data = await this.programsService.update(id, dto);
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách chương trình' })
  async findAll(@Query() query: any) {
    const data = await this.programsService.findAll(query);
    return { success: true, data };
  }

  @Get('export')
  @ApiOperation({ summary: 'Xuất báo cáo Excel danh sách chương trình' })
  async export(@Query() query: any, @Res() res: any) {
    const buffer = await this.programsService.exportExcel(query);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Danh_sach_chuong_trinh_ASXH.xlsx"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết chương trình' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      const data = await this.programsService.findOne(id);
      return { success: true, data };
    } catch (error) {
      console.error(`[CONTROLLER ERROR] findOne(${id}):`, error);
      throw error;
    }
  }
}
