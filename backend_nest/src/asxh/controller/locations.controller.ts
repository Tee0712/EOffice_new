import { Controller, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/oauth/jwt.guard';
import { LocationsService } from '../service/locations.service';

@ApiTags('ASXH - Địa danh')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('provinces')
  @ApiOperation({ summary: 'Danh sách Tỉnh/Thành phố' })
  getProvinces() {
    return this.locationsService.findAllProvinces();
  }

  @Get('districts')
  @ApiOperation({ summary: 'Danh sách Quận/Huyện theo Tỉnh' })
  getDistricts(@Query('province_id', ParseIntPipe) provinceId: number) {
    return this.locationsService.findDistrictsByProvince(provinceId);
  }
}
