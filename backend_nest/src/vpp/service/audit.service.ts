import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemLogEntity } from 'src/systemLogManagement/system-log.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(SystemLogEntity, 'mssqlConnection')
    private readonly systemLogRepo: Repository<SystemLogEntity>,
  ) {}

  async log(
    userId: string,
    action: string,
    details: string,
    method: string,
    status: string = 'SUCCESS',
    type: string = 'VPP',
    ipAddress: string = '',
  ) {
    const logEntry = this.systemLogRepo.create({
      id: uuidv4(),
      action,
      details,
      method,
      status,
      type,
      userInfoId: userId,
      ipAddress,
      timestamp: new Date(),
    });

    return this.systemLogRepo.save(logEntry);
  }
}
