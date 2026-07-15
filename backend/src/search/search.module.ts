import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SemanticSearchService } from './semantic-search.service';

@Module({
  controllers: [SearchController],
  providers: [SearchService, SemanticSearchService],
  exports: [SearchService, SemanticSearchService],
})
export class SearchModule {}
