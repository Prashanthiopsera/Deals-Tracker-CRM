'use client';

import { FormEvent, useState } from 'react';
import { createSavedSearch, searchRecords, SearchResultItem } from '../lib/search-api';

export function SearchPanel({ token }: { token?: string }) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'full_text' | 'semantic'>('full_text');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus('Searching...');
    const response = await searchRecords(query, token, mode);
    setResults(response.results ?? []);
    setStatus(`Found ${response.total ?? 0} results`);
  }

  async function onSaveSearch() {
    await createSavedSearch(`Saved: ${query}`, query, token, mode);
    setStatus('Search saved');
  }

  return (
    <section>
      <form onSubmit={onSubmit}>
        <input
          aria-label="Search query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search companies, contacts, documents..."
        />
        <select value={mode} onChange={(event) => setMode(event.target.value as 'full_text' | 'semantic')}>
          <option value="full_text">Full text</option>
          <option value="semantic">Semantic</option>
        </select>
        <button type="submit">Search</button>
        <button type="button" onClick={onSaveSearch}>
          Save search
        </button>
      </form>
      {status ? <p>{status}</p> : null}
      <ul>
        {results.map((result) => (
          <li key={`${result.entityType}-${result.recordId}`}>
            <strong>{result.entityType}</strong> {result.recordId} — {result.snippet}
          </li>
        ))}
      </ul>
    </section>
  );
}
