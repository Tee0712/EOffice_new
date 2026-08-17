import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { BirthdayWishEntity } from './entities/birthday-wish.entity';
import { UserEntity } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';

type ViewMode = 'week' | 'month';

@Injectable()
export class BirthdayService {
  private schemaReady = false;

  constructor(
    @InjectRepository(BirthdayWishEntity, 'mssqlConnection')
    private readonly wishRepository: Repository<BirthdayWishEntity>,
    @InjectRepository(UserEntity, 'mssqlConnection')
    private readonly userRepository: Repository<UserEntity>,
    private readonly mailService: MailService,
  ) { }

  private async ensureSchema() {
    if (this.schemaReady) return;
    await this.wishRepository.query(`
      IF OBJECT_ID(N'dbo.birthday_wishes', N'U') IS NULL
      BEGIN
        CREATE TABLE dbo.birthday_wishes (
          id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_birthday_wishes PRIMARY KEY DEFAULT NEWID(),
          user_id NVARCHAR(100) NOT NULL,
          wished_by NVARCHAR(100) NOT NULL,
          message NVARCHAR(MAX) NULL,
          wished_at DATETIME NOT NULL CONSTRAINT DF_birthday_wishes_wished_at DEFAULT GETDATE(),
          mail_status INT NOT NULL CONSTRAINT DF_birthday_wishes_mail_status DEFAULT 0
        );
        CREATE INDEX IX_birthday_wishes_user_id ON dbo.birthday_wishes(user_id);
        CREATE INDEX IX_birthday_wishes_wished_by ON dbo.birthday_wishes(wished_by);
        CREATE INDEX IX_birthday_wishes_wished_at ON dbo.birthday_wishes(wished_at);
      END
      ELSE
      BEGIN
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.birthday_wishes') AND name = 'mail_status')
        BEGIN
          ALTER TABLE dbo.birthday_wishes ADD mail_status INT NOT NULL CONSTRAINT DF_birthday_wishes_mail_status DEFAULT 0;
        END
      END
    `);
    this.schemaReady = true;
  }

  private getRange(baseDate: Date, view: ViewMode) {
    const date = new Date(baseDate);
    date.setHours(0, 0, 0, 0);

    if (view === 'month') {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      return { start, end };
    }

    const day = date.getDay();
    const distanceToMonday = (day + 6) % 7;
    const start = new Date(date);
    start.setDate(start.getDate() - distanceToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  }

  private enumerateMonthDayPairs(start: Date, end: Date) {
    const pairs: Array<{ month: number; day: number }> = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      pairs.push({
        month: cursor.getMonth() + 1,
        day: cursor.getDate(),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return pairs;
  }

  private toDateOnly(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private birthdayInRangeDate(birthday: Date, start: Date, end: Date) {
    const month = birthday.getMonth();
    const day = birthday.getDate();
    const cursor = new Date(start);
    while (cursor <= end) {
      if (cursor.getMonth() === month && cursor.getDate() === day) {
        return new Date(cursor);
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return null;
  }

  async list(params: { view?: string; date?: string; page?: number; limit?: number }, currentUserId: string) {
    await this.ensureSchema();
    const view: ViewMode = params.view === 'month' ? 'month' : 'week';
    const baseDate = params.date ? new Date(params.date) : new Date();
    if (Number.isNaN(baseDate.getTime())) {
      throw new BadRequestException('Ngày không hợp lệ');
    }

    const { start, end } = this.getRange(baseDate, view);
    const monthDayPairs = this.enumerateMonthDayPairs(start, end);

    const users = await this.userRepository
      .createQueryBuilder('u')
      .leftJoin('u.parent', 'org')
      .select('u.id', 'id')
      .addSelect('u.name', 'name')
      .addSelect('u.position', 'position')
      .addSelect('u.birthday', 'birthday')
      .addSelect('u.email_user', 'emailUser')
      .addSelect('org.name', 'organizationName')
      .where('u.status = :status', { status: 1 })
      .andWhere('u.birthday IS NOT NULL')
      .andWhere(
        new Brackets((qb) => {
          monthDayPairs.forEach((pair, idx) => {
            qb.orWhere(
              `(DATEPART(month, u.birthday) = :m${idx} AND DATEPART(day, u.birthday) = :d${idx})`,
              { [`m${idx}`]: pair.month, [`d${idx}`]: pair.day },
            );
          });
        }),
      )
      .getRawMany<{
        id: string;
        name: string;
        position: string | null;
        birthday: Date;
        emailUser: string | null;
        organizationName: string | null;
      }>();

    const wishes = await this.wishRepository
      .createQueryBuilder('w')
      .where('w.wishedBy = :currentUserId', { currentUserId })
      .andWhere('w.mailStatus = 1')
      .getMany();

    const logData = `[BirthdayService] list: currentUserId=${currentUserId}, wishesFound=${wishes.length}, date=${new Date().toISOString()}\n`;
    try {
      require('fs').appendFileSync('birthday_service.log', logData);
    } catch (e) {}
    console.log(logData);

    const wishedUserSet = new Set(wishes.map((w) => w.userId));
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();

    const items = users
      .map((u) => {
        const birthdayDate = new Date(u.birthday);
        const upcoming = this.birthdayInRangeDate(birthdayDate, start, end);
        if (!upcoming) return null;

        return {
          id: u.id,
          name: u.name,
          position: u.position || '',
          departmentName: u.organizationName || '',
          birthday: birthdayDate,
          birthdayDateInRange: upcoming,
          birthdayLabel: `${String(upcoming.getDate()).padStart(2, '0')}-${String(
            upcoming.getMonth() + 1,
          ).padStart(2, '0')}`,
          emailUser: u.emailUser || '',
          wished: wishedUserSet.has(u.id),
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const aTime = a!.birthdayDateInRange.getTime();
        const bTime = b!.birthdayDateInRange.getTime();
        return aTime - bTime;
      }) as Array<any>;

    const total = items.length;
    const page = params.page || 1;
    const limit = params.limit || 10;
    const paginatedItems = items.slice((page - 1) * limit, page * limit);

    const todayCount = items.filter((item) => {
      const bd = new Date(item.birthday);
      return bd.getMonth() + 1 === todayMonth && bd.getDate() === todayDay;
    }).length;

    const wishedInRangeCount = items.filter(i => i.wished).length;

    return {
      view,
      range: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      summary: {
        totalInRange: total,
        todayCount,
        wishedCount: wishedInRangeCount,
      },
      items: paginatedItems,
      total,
      page,
      limit,
    };
  }

  async sendWish(userId: string, payload: { message?: string; subject?: string }, currentUserId: string) {
    const now = new Date();
    const logData = `[BirthdayService] sendWish: currentUserId=${currentUserId}, targetUserId=${userId}, date=${now.toISOString()}\n`;
    try { require('fs').appendFileSync('birthday_service_send.log', logData); } catch (e) {}
    
    const targetUser = await this.userRepository.findOne({
      where: { id: userId, status: 1 },
      select: ['id', 'name', 'emailUser'],
    });
    if (!targetUser) {
      throw new BadRequestException('Không tìm thấy nhân viên nhận lời chúc');
    }

  
    const startOfDay = this.toDateOnly(now);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const existed = await this.wishRepository
      .createQueryBuilder('w')
      .where('w.userId = :userId', { userId })
      .andWhere('w.wishedBy = :currentUserId', { currentUserId })
      .andWhere('w.mailStatus = 1')
      .andWhere('w.wishedAt >= :startOfDay AND w.wishedAt < :endOfDay', { startOfDay, endOfDay })
      .getOne();

    if (existed) {
      return {
        success: true,
        duplicated: true,
        mailSent: false,
        mailSkippedReason: 'ALREADY_WISHED_TODAY',
      };
    }

    const wish = this.wishRepository.create({
      userId,
      wishedBy: currentUserId,
      message: payload.message?.trim() || null,
      mailStatus: 0,
    });
    await this.wishRepository.save(wish);

    const sender = await this.userRepository.findOne({
      where: { id: currentUserId },
      select: ['id', 'name', 'emailUser'],
    });
    
    const senderEmail = sender?.emailUser || '';
    const recipientEmail = targetUser.emailUser || '';
    const from = sender?.name && senderEmail ? `"${sender.name}" <${senderEmail}>` : senderEmail;

    let message = payload.message?.trim() || `Chúc mừng sinh nhật ${targetUser.name}!`;
    const subject = payload.subject?.trim() || `🎂 Chúc mừng sinh nhật ${targetUser.name}!`;

    let theme = 'Sang trọng';
    const themeMatch = message.match(/^\[THIỆP - ([^\]]+)\]/);
    if (themeMatch) {
      theme = themeMatch[1].trim();
      message = message.replace(/^\[THIỆP - [^\]]+\]/, '').trim();
    }

    let mailSent = false;
    let mailSkippedReason: string | null = null;

    if (!recipientEmail) {
      throw new BadRequestException('Nhân viên này chưa có địa chỉ email, không thể gửi lời chúc');
    }

    if (!this.mailService.isMailConfigured()) {
      mailSkippedReason = 'MAIL_SERVICE_NOT_CONFIGURED';
    } else {
      console.log(`[BirthdayService] Sending ${theme} card from ${senderEmail} to ${recipientEmail}`);
      
      const html = this.getBirthdayCardHtml(
        targetUser.name,
        message,
        sender?.name || 'Đồng nghiệp eOffice',
        theme
      );

      mailSent = await this.mailService.sendMail({
        to: recipientEmail,
        subject,
        text: message,
        html,
      });

      if (!mailSent) {
        mailSkippedReason = 'MAIL_SEND_FAILED';
      } else {
        wish.mailStatus = 1;
        const logStatus = `[BirthdayService] sendWish success: wishId=${wish.id}, userId=${userId}, theme=${theme}, date=${new Date().toISOString()}\n`;
        try { require('fs').appendFileSync('birthday_service_send.log', logStatus); } catch (e) {}
        await this.wishRepository.save(wish);
      }
    }

    return {
      success: true,
      duplicated: false,
      mailSent,
      mailSkippedReason,
      mailDetails: mailSent ? { to: recipientEmail, from, theme } : null,
    };
  }

  private getBirthdayCardHtml(targetName: string, message: string, senderName: string, theme: string) {
    let bgColor = '#162447'; // Navy Sang trọng
    let titleColor = '#f472b6'; // Pink
    let separatorColor = '#f472b6';

    switch (theme) {
      case 'Ấm áp':
        bgColor = '#fe724c'; // Coral Ấm áp
        titleColor = '#ffffff';
        separatorColor = '#facc15'; // Gold/Yellow line
        break;
      case 'Tươi mới':
        bgColor = '#29ccb1'; // Mint/Teal Tươi mới
        titleColor = '#ffffff';
        separatorColor = '#ffffff';
        break;
      case 'Hoàng gia':
        bgColor = '#6d28d9'; // Purple Hoàng gia
        titleColor = '#facc15'; // Gold
        separatorColor = '#facc15';
        break;
      case 'Sang trọng':
      default:
        bgColor = '#162447';
        titleColor = '#f472b6';
        separatorColor = '#f472b6';
        break;
    }

    let mainContent = message;
    let footerName = senderName;
    if (message.includes(' — ')) {
      const parts = message.split(' — ');
      mainContent = parts[0];
      footerName = parts[1];
    } else if (message.includes(' - ')) {
       const parts = message.split(' - ');
       if (parts.length > 1 && parts[parts.length-1].length < 50) { 
         footerName = parts.pop()!;
         mainContent = parts.join(' - ');
       }
    }

    return `
      <div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 500px; margin: 0 auto; background-color: ${bgColor}; border-radius: 24px; padding: 50px 30px; text-align: center; color: #ffffff; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
          <div style="font-size: 64px; margin-bottom: 25px;">🎂</div>
          <div style="color: ${titleColor}; font-size: 32px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 15px; line-height: 1.2;">Chúc Mừng Sinh Nhật</div>
          <div style="font-size: 28px; font-weight: 700; margin-bottom: 25px; color: #ffffff;">${targetName}</div>
          <div style="width: 80px; height: 4px; background-color: ${separatorColor}; margin: 0 auto 35px auto; border-radius: 2px;"></div>
          <div style="font-size: 20px; font-style: italic; line-height: 1.7; margin-bottom: 35px; padding: 0 15px; color: #ffffff; font-weight: 400;">
            "${mainContent}"
          </div>
          <div style="font-size: 18px; font-weight: 600; color: #ffffff; margin-top: 20px;">
            — ${footerName}
          </div>
        </div>
      </div>
    `;
  }
}
