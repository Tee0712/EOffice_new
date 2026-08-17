import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { CanteenRegistrationService } from './canteen-registration.service';
import { MealCheckInEntity as MealCheckinEntity } from '../entities/meal-checkin.entity';
import { MealRegistrationEntity } from '../entities/meal-registration.entity';
import { CanteenRegistrationEntity } from '../entities/canteen-registration.entity';
import { MealCheckinDto, UpdateCheckinStatusDto } from '../dto';
import * as moment from 'moment';

@Injectable()
export class CanteenCheckinService {
  constructor(
    @InjectRepository(MealCheckinEntity, 'mssqlConnection')
    private readonly checkinRepo: Repository<MealCheckinEntity>,
    @InjectRepository(CanteenRegistrationEntity, 'mssqlConnection')
    private readonly registrationRepo: Repository<CanteenRegistrationEntity>,
    @InjectRepository(MealRegistrationEntity, 'mssqlConnection')
    private readonly legacyRegistrationRepo: Repository<MealRegistrationEntity>,
    @InjectDataSource('mssqlConnection')
    private readonly dataSource: DataSource,
    private readonly registrationService: CanteenRegistrationService,
  ) { }

  private getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    const first = parts[0]?.[0] || '';
    const last = parts[parts.length - 1]?.[0] || '';
    return (first + last).toUpperCase();
  }

  private isMealCheckinsIdSchemaError(err: any): boolean {
    const message = String(err?.message || '');
    return message.includes("Cannot insert the value NULL into column 'id'") && message.includes('meal_checkins');
  }

  private formatTime(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  async getCheckinList(date: string, slot?: string, q?: string, dept?: string) {
    // 1. Lấy danh sách đăng ký từ admin registrations
    const regs = await this.registrationService.getAdminRegistrations({ date, dept, slot, q });

    // ── DEBUG TEMP ──────────────────────────────────────────────────────────
    console.log(`[DEBUG] getCheckinList date=${date} slot=${slot} → regs.length=${regs?.length}`);
    (regs || []).slice(0, 5).forEach((r: any) => {
      console.log(`  reg id=${r.id} user=${r.user_id} status=${r.status}`);
      (r.meals || []).forEach((m: any) => {
        console.log(`    meal slot=${m.slot} menu_id=${m.menu_id} price=${m.price} dish=${m.dish_name}`);
      });
    });
    // ────────────────────────────────────────────────────────────────────────

    if (!regs || regs.length === 0) return [];

    const now = moment();
    const isPastDay = moment(date, 'YYYY-MM-DD').isBefore(now, 'day');
    const isToday = moment(date, 'YYYY-MM-DD').isSame(now, 'day');

    // 2. Thu thập tất cả menu_id để query giá trực tiếp từ daily_menus
    const allMenuIds = Array.from(new Set(
      regs.flatMap((r: any) => (r.meals || []).map((m: any) => Number(m.menu_id)).filter(Boolean))
    ));

    // 3. Query giá từ bảng menus (legacy) theo menu_id - dùng unit_price_snapshot nếu price_total_planned = 0
    const menuPriceMap = new Map<number, number>();
    if (allMenuIds.length > 0) {
      try {
        const menuIdList = allMenuIds.join(',');
        // Lấy giá từ menus + fallback từ menu_items.unit_price_snapshot (giống calculateMenuPrice)
        const menuPriceRows: Array<{ id: number; price: number }> = await this.dataSource.query(`
          SELECT m.id,
            CAST(
              ISNULL(
                NULLIF(m.price_total_planned, 0),
                (SELECT TOP 1 mi.unit_price_snapshot
                 FROM menu_items mi
                 WHERE mi.menu_id = m.id
                 ORDER BY mi.sort_order ASC)
              )
            AS FLOAT) AS price
          FROM menus m
          WHERE m.id IN (${menuIdList})
        `);
        menuPriceRows.forEach(row => menuPriceMap.set(Number(row.id), Number(row.price) || 0));
        console.log(`[DEBUG] menus price lookup: ${JSON.stringify(menuPriceRows)}`);
      } catch (e) {
        console.warn('[CanteenCheckinService] Không thể lấy giá từ menus:', e?.message);
      }
    }



    // 4. Thu thập IDs đăng ký để tìm check-in thực tế
    const regIds = Array.from(new Set(regs.map((r: any) => Number(r.id)).filter(Boolean)));
    const allCheckins = regIds.length > 0
      ? await this.checkinRepo.find({ where: { registration_id: In(regIds) } as any })
      : [];

    // 5. Chuyển đổi và làm phẳng dữ liệu
    const result: any[] = [];
    const targetSlotToken = slot ? (this.registrationService as any).normalizeSlotToken(slot) : null;

    regs.forEach((r: any) => {
      (r.meals || []).forEach((m: any) => {
        if (targetSlotToken && String(m.slot) !== targetSlotToken) return;

        const checkin = allCheckins.find(c =>
          Number(c.registration_id) === Number(r.id) && Number(c.menu_id) === Number(m.menu_id)
        );

        let status = checkin ? 'checked' : (r.status === 'cancelled' ? 'absent' : 'pending');

        if (status === 'pending') {
          if (isPastDay) {
            status = 'absent';
          } else if (isToday) {
            const slotToken = m.slot;
            let endTimeStr = '';
            if (slotToken === 'breakfast') endTimeStr = '09:00';
            else if (slotToken === 'lunch') endTimeStr = '14:00';
            else if (slotToken === 'dinner') endTimeStr = '20:00';
            if (endTimeStr && now.isAfter(moment(`${date} ${endTimeStr}`, 'YYYY-MM-DD HH:mm'))) {
              status = 'absent';
            }
          }
        }

        // Ưu tiên giá: (1) price_at_time từ registration > (2) giá trực tiếp từ daily_menus
        const menuId = Number(m.menu_id);
        const price = Number(m.price) > 0
          ? Number(m.price)
          : (menuPriceMap.get(menuId) || 0);

        result.push({
          id: r.user_id,
          name: r.user_name || r.user_id,
          dept: r.department_id || '',
          deptName: r.department_name || '',
          avatar: this.getInitials(r.user_name || r.user_id),
          status,
          time: checkin
            ? this.formatTime(checkin.checked_in_at)
            : (r.status === 'cancelled' && r.cancelled_at ? this.formatTime(r.cancelled_at) : null),
          meal: m.dish_name || 'Suất ăn',
          price,
          registration_id: r.id,
          menu_id: m.menu_id,
          checkin_id: checkin?.id || null,
        });
      });
    });

    // 6. Loại bỏ trùng lặp
    const dedupMap = new Map<string, any>();
    result.forEach(item => {
      const key = `${item.id}|${item.menu_id}|${item.meal}`;
      if (!dedupMap.has(key)) dedupMap.set(key, item);
    });

    return Array.from(dedupMap.values());
  }

  async checkin(dto: any, adminId: string) {
    const checkin = this.checkinRepo.create({
      user_id: dto.user_id,
      registration_id: dto.registration_id,
      menu_id: dto.menu_id,
      checked_in_at: new Date(),
      method: dto.method || 'manual',
      checked_in_by: adminId,
    } as any);

    try {
      return await this.checkinRepo.save(checkin);
    } catch (err) {
      if (this.isMealCheckinsIdSchemaError(err)) {
        throw new InternalServerErrorException(
          'DB schema error: dbo.meal_checkins.id must be auto-generated (IDENTITY or DEFAULT).',
        );
      }
      throw err;
    }
  }

  async updateStatus(userId: string, menuId: number, dto: any, adminId: string) {
    const regId = Number(dto.registration_id);
    if (!regId || isNaN(regId)) {
      throw new BadRequestException('Thiếu registration_id để cập nhật trạng thái');
    }

    // Chỉ cho phép thay đổi trạng thái trong 3 ngày kể từ ngày suất ăn.
    const regDate = await this.getRegistrationDateForEditWindow(regId, menuId);
    if (regDate) {
      const today = moment().startOf('day');
      const lastEditable = moment(regDate, 'YYYY-MM-DD').startOf('day').add(3, 'days');
      if (today.isAfter(lastEditable)) {
        throw new ForbiddenException('Quá hạn 3 ngày, không thể thay đổi trạng thái.');
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingCheckin = await queryRunner.manager.findOne(MealCheckinEntity, {
        where: { registration_id: regId, menu_id: menuId } as any
      });

      if (dto.status === 'checked') {
        if (!existingCheckin) {
          const checkin = queryRunner.manager.create(MealCheckinEntity, {
            user_id: userId,
            registration_id: regId,
            menu_id: menuId,
            checked_in_at: new Date(),
            method: 'manual',
            checked_in_by: adminId,
          } as any);
          await queryRunner.manager.save(checkin);
        }

        await queryRunner.manager.update(CanteenRegistrationEntity, regId, { status: 'completed' });
        await queryRunner.manager.update(MealRegistrationEntity, regId, { status: 'registered' });

        await queryRunner.commitTransaction();
        return { success: true };
      }

      if (existingCheckin) {
        await queryRunner.manager.delete(MealCheckinEntity, (existingCheckin as any).id);
      }

      if (dto.status === 'absent') {
        await queryRunner.manager.update(CanteenRegistrationEntity, regId, {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelReason: dto.note || 'Admin đánh dấu vắng',
        });
        await queryRunner.manager.update(MealRegistrationEntity, regId, {
          status: 'cancelled',
          cancelled_at: new Date(),
          cancel_reason: dto.note || 'Admin đánh dấu vắng',
        });
      } else if (dto.status === 'pending') {
        await queryRunner.manager.update(CanteenRegistrationEntity, regId, {
          status: 'upcoming',
          cancelledAt: null,
          cancelReason: null,
        });
        await queryRunner.manager.update(MealRegistrationEntity, regId, {
          status: 'registered',
          cancelled_at: null,
          cancel_reason: null,
        });
      }

      await queryRunner.commitTransaction();
      return { success: true };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (this.isMealCheckinsIdSchemaError(err)) {
        throw new InternalServerErrorException(
          'DB schema error: dbo.meal_checkins.id must be auto-generated (IDENTITY or DEFAULT).',
        );
      }
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteCheckin(id: number) {
    const checkin = await this.checkinRepo.findOne({ where: { id } });
    if (!checkin) throw new NotFoundException('Không tìm thấy bản ghi check-in');
    return this.checkinRepo.delete(id);
  }

  private async getRegistrationDateForEditWindow(registrationId: number, menuId: number): Promise<string | null> {
    const reg = await this.registrationRepo.findOne({ where: { id: registrationId } });
    if (reg?.date) return String(reg.date);

    try {
      const rows: Array<{ menu_date?: any }> = await this.dataSource.query(
        `SELECT menu_date FROM menus WHERE id = @0`,
        [menuId],
      );
      const raw = rows?.[0]?.menu_date;
      if (!raw) return null;
      const m = moment(raw);
      return m.isValid() ? m.format('YYYY-MM-DD') : null;
    } catch {
      return null;
    }
  }

  async getSummary(date?: string) {
    return this.registrationService.getAdminSummary(date);
  }
}
