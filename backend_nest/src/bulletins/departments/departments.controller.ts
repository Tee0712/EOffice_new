import { Controller, Get, Post, Put, Patch, Body, Param, Delete } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { BulletinDepartmentEntity } from './entities/department.entity';

@Controller('v1/departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<BulletinDepartmentEntity>) {
    return this.departmentsService.create(data);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('is_active') isActive: boolean) {
    return this.departmentsService.updateStatus(id, isActive);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<BulletinDepartmentEntity>) {
    return this.departmentsService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
