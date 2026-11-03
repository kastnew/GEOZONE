export interface VectorDocument {
  id: string;
  placeId?: number;
  title: string;
  content: string;
  category: string;
  embedding: number[];
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) || 1e-6);
}

/**
 * In-Memory Vector Store linh hoạt cho GeoZone (hoặc cắm vào pgvector)
 */
export class VectorStore {
  private documents: VectorDocument[] = [];

  addDocuments(docs: VectorDocument[]) {
    this.documents.push(...docs);
  }

  similaritySearch(queryEmbedding: number[], topK: number = 3): VectorDocument[] {
    if (this.documents.length === 0) return [];

    const scored = this.documents.map(doc => ({
      doc,
      score: cosineSimilarity(queryEmbedding, doc.embedding)
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map(s => s.doc);
  }

  findKnowledgeByPlaceId(placeId: number): VectorDocument[] {
    return this.documents.filter(d => d.placeId === placeId);
  }
}

export const globalVectorStore = new VectorStore();
