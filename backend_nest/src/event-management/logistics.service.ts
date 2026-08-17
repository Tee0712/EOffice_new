import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventLogisticsEntity, LogisticsStatus } from './entities/event-logistics.entity';
import { EventHotelEntity } from './entities/event-hotel.entity';
import { EventTransportEntity } from './entities/event-transport.entity';
import { EventCateringEntity } from './entities/event-catering.entity';
import { CreateLogisticsDto } from './dto/logistics/create-logistics.dto';
import { CreateHotelDto } from './dto/logistics/create-hotel.dto';
import { CreateTransportDto } from './dto/logistics/create-transport.dto';
import { CreateCateringDto } from './dto/logistics/create-catering.dto';

export class UpdateLogisticsStatusDto {
  status: LogisticsStatus;
}

@Injectable()
export class LogisticsService {
  constructor(
    @InjectRepository(EventLogisticsEntity, 'mssqlConnection')
    private readonly logisticsRepo: Repository<EventLogisticsEntity>,
    @InjectRepository(EventHotelEntity, 'mssqlConnection')
    private readonly hotelRepo: Repository<EventHotelEntity>,
    @InjectRepository(EventTransportEntity, 'mssqlConnection')
    private readonly transportRepo: Repository<EventTransportEntity>,
    @InjectRepository(EventCateringEntity, 'mssqlConnection')
    private readonly cateringRepo: Repository<EventCateringEntity>,
  ) {}

  async create(eventId: string, dto: CreateLogisticsDto) {
    const logistics = await this.logisticsRepo.save(
      this.logisticsRepo.create({ eventId, logisticsType: dto.logisticsType, requestNote: dto.requestNote, assignedTo: dto.assignedTo }),
    );
    return { success: true, data: logistics };
  }

  async findByEvent(eventId: string) {
    const items = await this.logisticsRepo.find({ where: { eventId }, order: { createdAt: 'DESC' } });
    return { success: true, data: items };
  }

  async addHotel(logisticsId: string, dto: CreateHotelDto) {
    await this.getLogisticsOrFail(logisticsId);
    const hotel = await this.hotelRepo.save(
      this.hotelRepo.create({
        logisticsId,
        guestId: dto.guestId,
        hotelName: dto.hotelName,
        roomType: dto.roomType,
        checkinDate: dto.checkinDate ? new Date(dto.checkinDate) : null,
        checkoutDate: dto.checkoutDate ? new Date(dto.checkoutDate) : null,
        roomCount: dto.roomCount ?? 1,
        bookingRef: dto.bookingRef,
        note: dto.note,
      }),
    );
    return { success: true, data: hotel };
  }

  async addTransport(logisticsId: string, dto: CreateTransportDto) {
    await this.getLogisticsOrFail(logisticsId);
    const transport = await this.transportRepo.save(
      this.transportRepo.create({
        logisticsId,
        vehicleType: dto.vehicleType,
        quantity: dto.quantity ?? 1,
        pickupLocation: dto.pickupLocation,
        dropoffLocation: dto.dropoffLocation,
        pickupTime: dto.pickupTime ? new Date(dto.pickupTime) : null,
        driverInfo: dto.driverInfo,
        note: dto.note,
      }),
    );
    return { success: true, data: transport };
  }

  async addCatering(logisticsId: string, dto: CreateCateringDto) {
    await this.getLogisticsOrFail(logisticsId);
    const catering = await this.cateringRepo.save(
      this.cateringRepo.create({
        logisticsId,
        mealType: dto.mealType,
        venue: dto.venue,
        mealTime: dto.mealTime ? new Date(dto.mealTime) : null,
        paxCount: dto.paxCount,
        menuDescription: dto.menuDescription,
        supplier: dto.supplier,
        note: dto.note,
      }),
    );
    return { success: true, data: catering };
  }

  async updateStatus(logisticsId: string, status: LogisticsStatus) {
    const logistics = await this.getLogisticsOrFail(logisticsId);
    logistics.status = status;
    const saved = await this.logisticsRepo.save(logistics);
    return { success: true, data: { id: saved.id, status: saved.status } };
  }

  private async getLogisticsOrFail(id: string): Promise<EventLogisticsEntity> {
    const logistics = await this.logisticsRepo.findOne({ where: { id } });
    if (!logistics) throw new NotFoundException('Logistics không tồn tại');
    return logistics;
  }
}
