import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/oauth/jwt.guard';
import { ProgramItemsService } from '../service/program-items.service';
import { ProgramMilestonesService } from '../service/program-milestones.service';
import { ProgramMembersService } from '../service/program-members.service';
import { CreateProgramItemDto } from '../dto/create-program-item.dto';
import { CreateProgramMilestoneDto } from '../dto/create-program-milestone.dto';
import { CreateProgramMemberDto } from '../dto/create-program-member.dto';

@ApiTags('ASXH - Thành phần phụ')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1')
export class ProgramSubItemsController {
  constructor(
    private readonly itemsService: ProgramItemsService,
    private readonly milestonesService: ProgramMilestonesService,
    private readonly membersService: ProgramMembersService,
  ) {}

  @Post('program-items')
  @ApiOperation({ summary: 'Thêm hạng mục chi' })
  async addItem(@Body() dto: CreateProgramItemDto) {
    const data = await this.itemsService.create(dto);
    return { success: true, data };
  }

  @Post('program-milestones')
  @ApiOperation({ summary: 'Thêm mốc triển khai' })
  async addMilestone(@Body() dto: CreateProgramMilestoneDto) {
    const data = await this.milestonesService.create(dto);
    return { success: true, data };
  }

  @Post('program-members')
  @ApiOperation({ summary: 'Thêm nhân sự phụ trách' })
  async addMember(@Body() dto: CreateProgramMemberDto) {
    const data = await this.membersService.create(dto);
    return { success: true, data };
  }
}
