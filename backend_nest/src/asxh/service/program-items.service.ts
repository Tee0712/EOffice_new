import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramItemEntity } from '../entities/program-item.entity';
import { CreateProgramItemDto } from '../dto/create-program-item.dto';

@Injectable()
export class ProgramItemsService {
  constructor(
    @InjectRepository(ProgramItemEntity, 'mssqlConnection')
    private readonly repo: Repository<ProgramItemEntity>,
  ) {}

  async create(dto: CreateProgramItemDto): Promise<ProgramItemEntity> {
    const item = this.repo.create(dto);
    return await this.repo.save(item);
  }
}
