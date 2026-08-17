import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/events/create-event.dto';
import { QueryEventDto } from './dto/events/query-event.dto';
import { UpdateEventStatusDto } from './dto/events/update-event-status.dto';
import { CreateSatisfactionSurveyDto } from './dto/events/create-satisfaction-survey.dto';
import { SubmitSatisfactionResponseDto } from './dto/events/submit-satisfaction-response.dto';

@Controller('v1/events')
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @Get()
  findAll(@Query() query: QueryEventDto) {
    return this.service.findAll(query);
  }

  @Get('summary')
  getSummary(@Query() query: QueryEventDto) {
    return this.service.getSummary(query);
  }

  @Post()
  create(@Body() dto: CreateEventDto, @Request() req: any) {
    const userId = req.user?.id || req.user?.userId || 'system';
    return this.service.create(dto, userId);
  }

  @Get(':eventId')
  findOne(@Param('eventId') eventId: string) {
    return this.service.findOne(eventId);
  }

  @Put(':eventId')
  update(@Param('eventId') eventId: string, @Body() dto: Partial<CreateEventDto>) {
    return this.service.update(eventId, dto);
  }

  @Patch(':eventId/status')
  updateStatus(@Param('eventId') eventId: string, @Body() dto: UpdateEventStatusDto) {
    return this.service.updateStatus(eventId, dto);
  }

  @Get(':eventId/suggested-departments')
  getSuggestedDepartments(@Param('eventId') eventId: string, @Query('keyword') keyword?: string) {
    return this.service.getSuggestedDepartments(eventId, keyword);
  }

  @Post(':eventId/attachments')
  @UseInterceptors(FileInterceptor('file'))
  uploadAttachment(
    @Param('eventId') eventId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('category') category: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 'system';
    return this.service.saveAttachment(
      eventId,
      file.originalname,
      file.path || file.originalname,
      file.size,
      file.mimetype,
      category,
      userId,
    );
  }

  @Delete(':eventId/attachments/:attachmentId')
  deleteAttachment(
    @Param('eventId') eventId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.service.deleteAttachment(eventId, attachmentId);
  }

  @Get(':eventId/dashboard')
  getDashboard(@Param('eventId') eventId: string) {
    return this.service.getDashboard(eventId);
  }

  @Get(':eventId/interaction-stats')
  getInteractionStats(@Param('eventId') eventId: string) {
    return this.service.getInteractionStats(eventId);
  }

  @Post(':eventId/satisfaction-survey')
  upsertSatisfactionSurvey(
    @Param('eventId') eventId: string,
    @Body() dto: CreateSatisfactionSurveyDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.userId || 'system';
    return this.service.upsertSatisfactionSurvey(eventId, dto, userId);
  }

  @Get(':eventId/satisfaction-survey')
  getSatisfactionSurvey(@Param('eventId') eventId: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.userId || null;
    return this.service.getSatisfactionSurvey(eventId, userId);
  }

  @Post(':eventId/satisfaction-survey/submit')
  submitSatisfactionResponse(
    @Param('eventId') eventId: string,
    @Body() dto: SubmitSatisfactionResponseDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.userId || null;
    const userName = req.user?.fullName || req.user?.name || req.user?.username || null;
    const departmentId = req.user?.departmentId || req.user?.orgUnitId || null;
    return this.service.submitSatisfactionResponse(eventId, dto, userId, userName, departmentId);
  }
}
