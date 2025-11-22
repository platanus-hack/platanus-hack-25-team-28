import { OpenAIEmbeddings } from "@langchain/openai"
import { EmbeddingProvider } from "../types"

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private embeddings: OpenAIEmbeddings

  constructor(apiKey: string) {
    this.embeddings = new OpenAIEmbeddings({
      apiKey,
      model: "text-embedding-3-small",
    })
  }

  async embed(texts: string[]): Promise<number[][]> {
    const result = await this.embeddings.embedDocuments(texts)
    return result
  }
}
