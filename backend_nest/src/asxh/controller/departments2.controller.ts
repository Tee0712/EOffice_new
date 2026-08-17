import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/oauth/jwt.guard';
import { ProgramsService } from '../service/programs.service';

@ApiTags('ASXH - Phòng ban')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/asxh-departments')
export class Departments2Controller {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách phòng ban từ bảng departments2' })
  async getDepartments2() {
    const data = await this.programsService.getDepartments2();
    return { success: true, data };
  }
}
