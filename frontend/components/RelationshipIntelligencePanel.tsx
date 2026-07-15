'use client';

interface Props {
  scores: Array<{ user_id: string; score: number }>;
  paths: Array<{ strength: number; hops: Array<{ user_id: string }> }>;
  coInvestors: Array<{ investor_name: string; investor_type: string }>;
}

export function RelationshipIntelligencePanel({ scores, paths, coInvestors }: Props) {
  return (
    <section data-testid="relationship-intelligence-panel">
      <h2>Who Knows</h2>
      <ul>{scores.map((s) => <li key={s.user_id}>{s.user_id}: {s.score}</li>)}</ul>
      <h2>Warm Intros</h2>
      <ul>{paths.map((p, i) => <li key={i}>Strength {p.strength}</li>)}</ul>
      <h2>Co-Investors</h2>
      <ul>{coInvestors.map((c) => <li key={c.investor_name}>{c.investor_name} ({c.investor_type})</li>)}</ul>
    </section>
  );
}
