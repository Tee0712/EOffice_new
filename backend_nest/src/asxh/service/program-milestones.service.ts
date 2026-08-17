import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramMilestoneEntity } from '../entities/program-milestone.entity';
import { CreateProgramMilestoneDto } from '../dto/create-program-milestone.dto';

@Injectable()
export class ProgramMilestonesService {
  constructor(
    @InjectRepository(ProgramMilestoneEntity, 'mssqlConnection')
    private readonly repo: Repository<ProgramMilestoneEntity>,
  ) {}

  async create(dto: CreateProgramMilestoneDto): Promise<ProgramMilestoneEntity> {
    const milestone = this.repo.create({
      ...dto,
      milestone_date: new Date(dto.milestone_date),
    });
    return await this.repo.save(milestone);
  }
}
