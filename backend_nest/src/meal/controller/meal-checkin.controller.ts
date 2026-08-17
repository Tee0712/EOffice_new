import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Body,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/oauth/jwt.guard';
import { MealCheckinService } from '../service/meal-checkin.service';
import { ZodValidationPipe } from '../zod-validation.pipe';
import { SystemLogServiceSql } from 'src/systemLogManagement/system-log-service-sql';
import { Request } from 'express';
import {
  MealCheckinSchema,
  MealCheckinDto,
  CheckinListQuerySchema,
  CheckinListQueryDto,
  UpdateCheckinStatusSchema,
  UpdateCheckinStatusDto,
} from '../dto/meal.dto';

@ApiTags('🍽️ Meal - Check-in Xuất ăn')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/meals/checkins')
export class MealCheckinController {
  constructor(
    private readonly checkinService: MealCheckinService,
    private readonly systemLogService: SystemLogServiceSql,
  ) { }

  private async trackAction(req: Request, method: string, details: string, subType: string) {
    try {
      const userId = (req as any).user?.userId || 'Unknown';
      const ipAddress = req.ip || req.connection?.remoteAddress || 'Unknown';
      await this.systemLogService.createLogFromSystem({
        action: method,
        details,
        method,
        status: 'SUCCESS',
        type: 'CANTEEN_CHECKIN',
        subType,
        userInfo: userId,
        ipAddress,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error('[MealCheckinController] Logging failed:', e);
    }
  }

  @Get('list')
  @ApiOperation({ summary: 'Lấy danh sách check-in xuất ăn' })
  async getList(
    @Query(new ZodValidationPipe(CheckinListQuerySchema)) query: CheckinListQueryDto,
  ) {
    const data = await this.checkinService.getCheckinList(query.date, query.slot, query.q, query.dept);
    const summary = await this.checkinService.getSummary(query.date);
    return { success: true, data, summary };
  }

  @Post()
  @ApiOperation({ summary: 'Thực hiện check-in (Manual)' })
  async checkin(
    @Body(new ZodValidationPipe(MealCheckinSchema)) body: MealCheckinDto,
    @Req() req: any,
  ) {
    const data = await this.checkinService.checkin(body, req.user.userId);
    await this.trackAction(req, 'POST', `Check-in thủ công cho user ${body.user_id || body.registration_id}, menu ${body.menu_id}`, 'CHECKIN_MANUAL');
    return { success: true, data };
  }

  @Patch('status/:userId/:menuId')
  @ApiOperation({ summary: 'Cập nhật trạng thái ăn (checked/absent/pending)' })
  async updateStatus(
    @Param('userId') userId: string,
    @Param('menuId', ParseIntPipe) menuId: number,
    @Body(new ZodValidationPipe(UpdateCheckinStatusSchema)) body: UpdateCheckinStatusDto,
    @Req() req: any,
  ) {
    const data = await this.checkinService.updateStatus(userId, menuId, body, req.user.userId);
    await this.trackAction(req, 'PATCH', `Cập nhật trạng thái ${body.status} cho user ${userId}, menu ${menuId}`, 'STATUS_UPDATE');
    return { success: true, data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bản ghi check-in' })
  async deleteCheckin(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    await this.checkinService.deleteCheckin(id);
    await this.trackAction(req, 'DELETE', `Xóa bản ghi check-in ID ${id}`, 'CHECKIN_DELETE');
    return { success: true };
  }
}

