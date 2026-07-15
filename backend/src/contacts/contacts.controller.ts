import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CedarAuthorize } from '../authorization/cedar.guard';
import { ContactsService, type ContactRecord } from './contacts.service';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Get(':id/contacts')
  @CedarAuthorize('read', 'Company')
  list(@Param('id') companyId: string) {
    return this.contacts.listByCompany(companyId);
  }

  @Post(':id/contacts')
  @CedarAuthorize('update', 'Company')
  create(@Param('id') companyId: string, @Body() body: { full_name: string; email?: string; pii_classification: ContactRecord['pii_classification'] }) {
    return this.contacts.create({ company_id: companyId, ...body });
  }
}
