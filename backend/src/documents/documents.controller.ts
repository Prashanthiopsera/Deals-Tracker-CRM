import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUserContext } from '../auth/auth.types';
import { CedarAuthorize } from '../authorization/cedar.guard';
import { DocumentsService } from './documents.service';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get(':id/documents')
  @CedarAuthorize('read', 'Company')
  list(@Param('id') companyId: string) {
    return this.documents.listByCompany(companyId);
  }

  @Post(':id/documents')
  @CedarAuthorize('update', 'Company')
  upload(
    @Param('id') companyId: string,
    @Body() body: { filename: string; mime_type: string; size_bytes: number },
    @Req() req: Request & { user: AuthUserContext },
  ) {
    return this.documents.upload({
      company_id: companyId,
      filename: body.filename,
      mime_type: body.mime_type,
      size_bytes: body.size_bytes,
      uploaded_by: req.user.p7vcUserId,
    });
  }

  @Get(':companyId/documents/:documentId/download-url')
  @CedarAuthorize('read', 'Company')
  downloadUrl(
    @Param('documentId') documentId: string,
    @Req() req: Request & { user: AuthUserContext },
  ) {
    return this.documents.getDownloadUrl(documentId, req.user.p7vcUserId);
  }
}
