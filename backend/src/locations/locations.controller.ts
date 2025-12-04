import { Controller, Get, Param, Query } from '@nestjs/common';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('countries')
  async getCountries() {
    return this.locationsService.getCountries();
  }

  @Get('states/:countryCode')
  async getStates(@Param('countryCode') countryCode: string) {
    return this.locationsService.getStates(countryCode);
  }

  @Get('cities/:countryCode/:regionCode')
  async getCities(@Param('countryCode') countryCode: string, @Param('regionCode') regionCode: string) {
    return this.locationsService.getCities(countryCode, regionCode);
  }

  @Get('search')
  async search(@Query('query') query: string) {
    return this.locationsService.searchCities(query);
  }
}