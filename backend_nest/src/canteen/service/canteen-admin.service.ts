import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MealSessionEntity } from '../entities/meal-session.entity';
import { DailyMenuEntity } from '../entities/daily-menu.entity';
import { CanteenSystemSettingEntity } from '../entities/canteen-system-setting.entity';
import { CanteenUserSettingEntity } from '../entities/canteen-user-setting.entity';
import { MealTemplateEntity } from '../entities/meal-template.entity';
import {
  CreateMealSessionDto,
  UpdateMealSessionDto,
  CreateDailyMenuDto,
  UpdateDailyMenuDto,
  CreateMealTemplateDto,
  UpdateSystemSettingDto,
  UpdateUserSettingDto,
} from '../dto';

@Injectable()
export class CanteenAdminService {
  constructor(
    @InjectRepository(MealSessionEntity, 'mssqlConnection')
    private readonly sessionRepo: Repository<MealSessionEntity>,
    @InjectRepository(DailyMenuEntity, 'mssqlConnection')
    private readonly dailyMenuRepo: Repository<DailyMenuEntity>,
    @InjectRepository(CanteenSystemSettingEntity, 'mssqlConnection')
    private readonly systemSettingRepo: Repository<CanteenSystemSettingEntity>,
    @InjectRepository(CanteenUserSettingEntity, 'mssqlConnection')
    private readonly userSettingRepo: Repository<CanteenUserSettingEntity>,
    @InjectRepository(MealTemplateEntity, 'mssqlConnection')
    private readonly templateRepo: Repository<MealTemplateEntity>,
  ) {}

  // ─── Meal Sessions ───────────────────────────────────────────────────────────

  getAllSessions() {
    return this.sessionRepo.find({ order: { sortOrder: 'ASC' } });
  }

  async createSession(dto: CreateMealSessionDto) {
    return this.sessionRepo.save({
      name: dto.name,
      timeStart: dto.time_start,
      timeEnd: dto.time_end,
      icon: dto.icon ?? null,
      sortOrder: dto.sort_order,
    });
  }

  async updateSession(id: number, dto: UpdateMealSessionDto) {
    const session = await this.sessionRepo.findOne({ where: { id } });
    if (!session) throw new NotFoundException('Không tìm thấy ca ăn');
    Object.assign(session, {
      ...(dto.name && { name: dto.name }),
      ...(dto.time_start && { timeStart: dto.time_start }),
      ...(dto.time_end && { timeEnd: dto.time_end }),
      ...(dto.icon !== undefined && { icon: dto.icon }),
      ...(dto.sort_order !== undefined && { sortOrder: dto.sort_order }),
    });
    return this.sessionRepo.save(session);
  }

  async deleteSession(id: number) {
    const session = await this.sessionRepo.findOne({ where: { id } });
    if (!session) throw new NotFoundException('Không tìm thấy ca ăn');
    await this.sessionRepo.remove(session);
    return { success: true };
  }

  // ─── Daily Menus ─────────────────────────────────────────────────────────────

  getDailyMenus(date?: string, mealSessionId?: number) {
    const qb = this.dailyMenuRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.mealSession', 'session')
      .orderBy('m.date', 'ASC')
      .addOrderBy('session.sortOrder', 'ASC');

    if (date) qb.andWhere('m.date = :date', { date });
    if (mealSessionId) qb.andWhere('m.mealSessionId = :mealSessionId', { mealSessionId });

    return qb.getMany();
  }

  async getDailyMenuById(id: number) {
    const menu = await this.dailyMenuRepo.findOne({
      where: { id },
      relations: ['mealSession'],
    });
    if (!menu) throw new NotFoundException('Không tìm thấy menu');
    return menu;
  }

  async createDailyMenu(dto: CreateDailyMenuDto, createdBy: string) {
    return this.dailyMenuRepo.save({
      date: dto.date,
      mealSessionId: dto.meal_session_id,
      dishName: dto.dish_name,
      description: dto.description ?? null,
      price: dto.price,
      servingTime: dto.serving_time ?? null,
      photoUrl: dto.photo_url ?? null,
      isActive: dto.is_active,
      createdBy,
    });
  }

  async updateDailyMenu(id: number, dto: UpdateDailyMenuDto) {
    const menu = await this.dailyMenuRepo.findOne({ where: { id } });
    if (!menu) throw new NotFoundException('Không tìm thấy menu');
    Object.assign(menu, {
      ...(dto.dish_name && { dishName: dto.dish_name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.price !== undefined && { price: dto.price }),
      ...(dto.serving_time !== undefined && { servingTime: dto.serving_time }),
      ...(dto.photo_url !== undefined && { photoUrl: dto.photo_url }),
      ...(dto.is_active !== undefined && { isActive: dto.is_active }),
    });
    return this.dailyMenuRepo.save(menu);
  }

  async deleteDailyMenu(id: number) {
    const menu = await this.dailyMenuRepo.findOne({ where: { id } });
    if (!menu) throw new NotFoundException('Không tìm thấy menu');
    await this.dailyMenuRepo.remove(menu);
    return { success: true };
  }

  // ─── Meal Templates ──────────────────────────────────────────────────────────

  getTemplates(userId: string) {
    return this.templateRepo
      .createQueryBuilder('t')
      .where('t.isSystem = 1 OR t.userId = :userId', { userId })
      .orderBy('t.isSystem', 'DESC')
      .addOrderBy('t.createdAt', 'ASC')
      .getMany();
  }

  async createTemplate(dto: CreateMealTemplateDto, userId?: string) {
    return this.templateRepo.save({
      userId: dto.is_system ? null : (userId ?? null),
      name: dto.name,
      mealSessions: JSON.stringify(dto.meal_session_ids),
      isSystem: dto.is_system,
    });
  }

  async deleteTemplate(id: number, userId: string, isAdmin: boolean) {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Không tìm thấy template');
    if (!isAdmin && template.userId !== userId) {
      throw new NotFoundException('Không có quyền xóa template này');
    }
    await this.templateRepo.remove(template);
    return { success: true };
  }

  // ─── System Settings ─────────────────────────────────────────────────────────

  async getSystemSettings() {
    return this.systemSettingRepo.findOne({ where: { id: 1 } });
  }

  async updateSystemSettings(dto: UpdateSystemSettingDto, updatedBy: string) {
    let setting = await this.systemSettingRepo.findOne({ where: { id: 1 } });
    if (!setting) {
      setting = this.systemSettingRepo.create({ id: 1 });
    }
    Object.assign(setting, {
      ...(dto.registration_deadline_time && { registrationDeadlineTime: dto.registration_deadline_time }),
      ...(dto.cancellation_deadline_time && { cancellationDeadlineTime: dto.cancellation_deadline_time }),
      ...(dto.allow_multi_meal !== undefined && { allowMultiMeal: dto.allow_multi_meal }),
      ...(dto.allow_bulk_registration !== undefined && { allowBulkRegistration: dto.allow_bulk_registration }),
      ...(dto.auto_cancel_on_business_trip !== undefined && { autoCancelOnBusinessTrip: dto.auto_cancel_on_business_trip }),
      ...(dto.auto_cancel_on_leave !== undefined && { autoCancelOnLeave: dto.auto_cancel_on_leave }),
      ...(dto.require_cancel_reason !== undefined && { requireCancelReason: dto.require_cancel_reason }),
      ...(dto.weekend_service !== undefined && { weekendService: dto.weekend_service }),
      ...(dto.refund_rate_on_time !== undefined && { refundRateOnTime: dto.refund_rate_on_time }),
      ...(dto.refund_rate_late !== undefined && { refundRateLate: dto.refund_rate_late }),
      updatedBy,
    });
    return this.systemSettingRepo.save(setting);
  }

  // ─── User Settings ───────────────────────────────────────────────────────────

  async getUserSettings(userId: string) {
    let setting = await this.userSettingRepo.findOne({ where: { userId } });
    if (!setting) {
      setting = await this.userSettingRepo.save(
        this.userSettingRepo.create({ userId }),
      );
    }
    return setting;
  }

  async updateUserSettings(userId: string, dto: UpdateUserSettingDto) {
    let setting = await this.userSettingRepo.findOne({ where: { userId } });
    if (!setting) {
      setting = this.userSettingRepo.create({ userId });
    }
    Object.assign(setting, {
      ...(dto.auto_cancel_on_trip !== undefined && { autoCancelOnTrip: dto.auto_cancel_on_trip }),
      ...(dto.auto_cancel_on_leave !== undefined && { autoCancelOnLeave: dto.auto_cancel_on_leave }),
      ...(dto.receive_email_notification !== undefined && { receiveEmailNotification: dto.receive_email_notification }),
      ...(dto.remind_before_1_day !== undefined && { remindBefore1Day: dto.remind_before_1_day }),
    });
    return this.userSettingRepo.save(setting);
  }
}
