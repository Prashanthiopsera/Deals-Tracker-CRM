import { Module } from '@nestjs/common';
import { PermissionFilteredSearchController } from './permission-filtered-search.controller';
import { PermissionFilteredSearchService } from './permission-filtered-search.service';
import { SavedSearchController } from './saved-search.controller';
import { SavedSearchService } from './saved-search.service';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SemanticSearchService } from './semantic-search.service';

@Module({
  controllers: [SearchController, PermissionFilteredSearchController, SavedSearchController],
  providers: [
    SearchService,
    SemanticSearchService,
    PermissionFilteredSearchService,
    SavedSearchService,
  ],
  exports: [SearchService, SemanticSearchService, PermissionFilteredSearchService, SavedSearchService],
})
export class SearchModule {}
