import { Controller, Get, Param, Query } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { QueryDepartmentDto } from './dto/departments/query-department.dto';

@Controller('v1/event-departments')
export class DepartmentsController {
  constructor(private readonly service: DepartmentsService) {}

  @Get()
  findAll(@Query() query: QueryDepartmentDto) {
    return this.service.findAll(query);
  }

  @Get(':departmentId')
  findOne(@Param('departmentId') departmentId: string) {
    return this.service.findOne(departmentId);
  }
}
