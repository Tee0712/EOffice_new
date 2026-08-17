import { Injectable } from '@nestjs/common';
import { PROVINCES, DISTRICTS } from '../constants/locations';

@Injectable()
export class LocationsService {
  findAllProvinces() {
    return { success: true, data: PROVINCES };
  }

  findDistrictsByProvince(provinceId: number) {
    const districts = DISTRICTS[provinceId] || [];
    return { success: true, data: districts };
  }
}
