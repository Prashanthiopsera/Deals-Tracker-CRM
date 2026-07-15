import { Injectable } from '@nestjs/common';
import { UserRole } from '../database/enums';
import { SemanticSearchService } from './semantic-search.service';
import { SearchService } from './search.service';

@Injectable()
export class PermissionFilteredSearchService {
  constructor(
    private readonly fullText: SearchService,
    private readonly semantic: SemanticSearchService,
  ) {}

  search(query: string, role: string, mode: 'full_text' | 'semantic' = 'full_text') {
    if (mode === 'semantic') {
      const embedding = this.semantic.embedQuery(query);
      const results = this.semantic.search(embedding).filter((result) => this.canView(role));
      return { mode, query, results, total: results.length };
    }
    const response = this.fullText.search(query, role);
    return { mode, ...response };
  }

  private canView(role: string): boolean {
    return role !== UserRole.INTERN;
  }
}
