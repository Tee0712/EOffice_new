import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentsService } from './departments.service';
import { DepartmentsController } from './departments.controller';
import { BulletinDepartmentEntity } from './entities/department.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BulletinDepartmentEntity], 'mssqlConnection')],
  providers: [DepartmentsService],
  controllers: [DepartmentsController],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
