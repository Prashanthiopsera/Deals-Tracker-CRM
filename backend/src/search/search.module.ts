import { Module } from '@nestjs/common';
import { PermissionFilteredSearchController } from './permission-filtered-search.controller';
import { PermissionFilteredSearchService } from './permission-filtered-search.service';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SemanticSearchService } from './semantic-search.service';

@Module({
  controllers: [SearchController, PermissionFilteredSearchController],
  providers: [SearchService, SemanticSearchService, PermissionFilteredSearchService],
  exports: [SearchService, SemanticSearchService, PermissionFilteredSearchService],
})
export class SearchModule {}
