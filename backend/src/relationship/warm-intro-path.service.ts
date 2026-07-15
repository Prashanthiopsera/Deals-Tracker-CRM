import { Injectable } from '@nestjs/common';

export interface IntroPath {
  strength: number;
  hops: Array<{ user_id: string; score: number }>;
}

@Injectable()
export class WarmIntroPathService {
  findPaths(targetContactId: string, graph: Record<string, Array<{ user_id: string; score: number; connects_to?: string }>>): IntroPath[] {
    const direct = (graph[targetContactId] ?? []).map((edge) => ({
      strength: edge.score,
      hops: [{ user_id: edge.user_id, score: edge.score }],
    }));
    const oneHop: IntroPath[] = [];
    for (const edge of graph[targetContactId] ?? []) {
      for (const second of graph[edge.connects_to ?? ''] ?? []) {
        oneHop.push({
          strength: Math.min(edge.score, second.score),
          hops: [
            { user_id: edge.user_id, score: edge.score },
            { user_id: second.user_id, score: second.score },
          ],
        });
      }
    }
    return [...direct, ...oneHop].sort((a, b) => b.strength - a.strength).slice(0, 10);
  }
}
