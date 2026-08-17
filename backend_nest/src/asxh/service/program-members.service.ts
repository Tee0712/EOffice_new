import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramMemberEntity } from '../entities/program-member.entity';
import { CreateProgramMemberDto } from '../dto/create-program-member.dto';

@Injectable()
export class ProgramMembersService {
  constructor(
    @InjectRepository(ProgramMemberEntity, 'mssqlConnection')
    private readonly repo: Repository<ProgramMemberEntity>,
  ) {}

  async create(dto: CreateProgramMemberDto): Promise<ProgramMemberEntity> {
    const member = this.repo.create(dto);
    return await this.repo.save(member);
  }
}
