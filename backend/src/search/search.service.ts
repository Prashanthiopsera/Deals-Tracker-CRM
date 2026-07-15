import { Injectable } from '@nestjs/common';
import { UserRole } from '../database/enums';
import { searchFixtureRecords, SearchIndexRecord } from '../../test-fixtures/search/search-records.fixture';

export interface SearchResultItem {
  entityType: string;
  recordId: string;
  matchedField: string;
  snippet: string;
  rank: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResultItem[];
  total: number;
  latencyMs: number;
}

@Injectable()
export class SearchService {
  private records: SearchIndexRecord[] = searchFixtureRecords.map((record) => ({ ...record }));

  seedRecords(records: SearchIndexRecord[]): void {
    this.records = records.map((record) => ({ ...record }));
  }

  search(query: string, role: string): SearchResponse {
    const started = performance.now();
    const normalized = query.trim().toLowerCase();
    const tokens = normalized.split(/\s+/).filter(Boolean);

    const matches = this.records
      .filter((record) => this.canView(record, role))
      .map((record) => ({
        record,
        rank: this.rankRecord(record, tokens),
      }))
      .filter((item) => item.rank > 0)
      .sort((a, b) => b.rank - a.rank)
      .map(({ record, rank }) => ({
        entityType: record.entityType,
        recordId: record.recordId,
        matchedField: record.matchedField,
        snippet: this.highlightSnippet(record.snippet, tokens),
        rank,
      }));

    return {
      query,
      results: matches,
      total: matches.length,
      latencyMs: performance.now() - started,
    };
  }

  private rankRecord(record: SearchIndexRecord, tokens: string[]): number {
    if (tokens.length === 0) return 0;
    const haystack = record.text.toLowerCase();
    return tokens.reduce((score, token) => (haystack.includes(token) ? score + 1 : score), 0);
  }

  private highlightSnippet(snippet: string, tokens: string[]): string {
    let output = snippet;
    for (const token of tokens) {
      const pattern = new RegExp(token, 'ig');
      output = output.replace(pattern, (match) => `**${match}**`);
    }
    return output;
  }

  private canView(record: SearchIndexRecord, role: string): boolean {
    if (record.visibility === 'director_only' && role !== UserRole.DIRECTOR && role !== UserRole.ADMIN) {
      return false;
    }
    if (record.visibility === 'non_intern' && role === UserRole.INTERN) {
      return false;
    }
    return true;
  }
}
