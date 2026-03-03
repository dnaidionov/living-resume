import type { ChatModel } from "@/types/contracts";
import type { ModelInput, ModelOutput } from "@/types/ai";
import { buildGroundedAnswer } from "@/lib/ai/prompting";

export class OpenAIChatModel implements ChatModel {
  async generateAnswer(input: ModelInput): Promise<ModelOutput> {
    const answer = buildGroundedAnswer(input.prompt, input.evidence, input.mode);

    return {
      answer,
      citations: input.evidence.slice(0, 4).map((item) => ({
        sourceId: item.id,
        title: item.title,
        section: item.section
      })),
      confidence: input.evidence.length >= 4 ? "high" : "medium"
    };
  }
}
