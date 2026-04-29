import type { ChatRequest } from "@/types/ai";
import { staticRetrievalStore } from "@/lib/retrieval/store";
import { OpenAIChatModel } from "@/lib/ai/openai";
import { buildResumeChatScopeRefusal } from "@/lib/ai/prompting";
import type { ChatAnswer, ModelInput, ModelOutput } from "@/types/ai";
import type { EvidenceChunk } from "@/types/content";

const model = new OpenAIChatModel();

type ChatDependencies = {
  searchEvidence: (
    query: string,
    mode: "resume_qa" | "build_process"
  ) => Promise<EvidenceChunk[]>;
  generateAnswer: (input: ModelInput) => Promise<ModelOutput>;
};

type ScopeDecision = "allow_resume_or_projects" | "allow_build_process" | "block";

const resumeScopeSignals =
  /\b(resume|professional history|background|career|experience|project|projects|role|roles|work history|worked|skills?|strengths?|qualifications?|fit|achievement|achievements|dmitry|naidionov|epam|modus|pwc|cardstack|acision|vingis|leadership|roadmap|stakeholder|delivery)\b/i;
const projectScopeSignals =
  /\b(career twin|living resume|chat|fit analysis|rag|retrieval|prompt|prompting|embedding|embeddings|openai|cloudflare|next\.?js|worker|github|architecture|site|system|built|build|project|projects)\b/i;
const directBuildSignals =
  /\bhow this is built\b|\bhow is this site built\b|\bhow is this system built\b|\bsite architecture\b|\bsystem architecture\b|\bhow (was|is) (this|the project|career twin|living resume) built\b/i;
const obviousGenericTaskSignals =
  /\b(write me|draft (me|an?|the)|generate (me|an?|the)|create (me|an?|the)|compose (me|an?|the)|solve (this|my)|plan (my|a trip|an itinerary)|book (my|me)|give me a recipe|tell me a joke|write a poem|write a story|translate this|summari[sz]e this|review this code|sql query|python script)\b/i;
const promptInjectionSignals =
  /\b(ignore (all|any|previous) instructions|reveal (your|the) (system prompt|developer prompt|instructions)|show (your|the) hidden prompt|act as (?!.*dmitry)|jailbreak|bypass|override|tool call|use your tools|system message|developer message)\b/i;
const buildProcessSignals =
  /\bcareer twin\b|\bgithub\b|how this is built\b|\bhow is this site built\b|\bhow is this system built\b|\bsite architecture\b|\bsystem architecture\b/i;
const followUpSignals =
  /^(what about|how about|tell me more|more on that|and leadership|and strategy|and execution|why|how so|which one|compare them|what else)\b/i;
const scopeDecisionCache = new Map<string, ScopeDecision>();

export function resolveChatMode(request: ChatRequest): "resume_qa" | "build_process" {
  if (request.mode === "build_process") {
    return "build_process";
  }

  if (request.mode === "resume_qa") {
    return "resume_qa";
  }

  const normalized = request.message.toLowerCase();
  return /\bbuilt\b|\bbuild\b|\bsite\b|\barchitecture\b|\bhow this is\b/.test(normalized)
    ? "build_process"
    : "resume_qa";
}

function normalizePromptForCache(message: string): string {
  return message.trim().toLowerCase().replace(/\s+/g, " ");
}

function hasResumeScopedHistory(request: ChatRequest): boolean {
  return (request.history ?? []).some((turn) => resumeScopeSignals.test(turn.text) || projectScopeSignals.test(turn.text));
}

function decideChatScope(request: ChatRequest): ScopeDecision {
  const message = request.message.trim();
  const normalized = normalizePromptForCache(message);
  const canUseCache = !followUpSignals.test(message) && !(request.history?.length);
  const cached = canUseCache ? scopeDecisionCache.get(normalized) : undefined;
  if (cached) {
    return cached;
  }

  let decision: ScopeDecision;

  if (promptInjectionSignals.test(message) || obviousGenericTaskSignals.test(message)) {
    decision = "block";
  } else if (directBuildSignals.test(message) || (buildProcessSignals.test(message) && projectScopeSignals.test(message))) {
    decision = "allow_build_process";
  } else if (resumeScopeSignals.test(message) || projectScopeSignals.test(message)) {
    decision = "allow_resume_or_projects";
  } else if (followUpSignals.test(message) && hasResumeScopedHistory(request)) {
    decision = "allow_resume_or_projects";
  } else {
    decision = "block";
  }

  if (canUseCache) {
    scopeDecisionCache.set(normalized, decision);
  }

  return decision;
}

export async function answerChatWithDependencies(
  request: ChatRequest,
  dependencies: ChatDependencies
): Promise<ChatAnswer> {
  const scopeDecision = decideChatScope(request);
  if (scopeDecision === "block") {
    return {
      answer: buildResumeChatScopeRefusal(),
      citations: [],
      confidence: "low"
    };
  }

  const mode = scopeDecision === "allow_build_process" ? "build_process" : resolveChatMode(request);
  const evidence = await dependencies.searchEvidence(
    request.message,
    mode === "build_process" ? "build_process" : "resume_qa"
  );

  return dependencies.generateAnswer({
    prompt: request.message,
    evidence,
    mode,
    history: request.history?.slice(-8)
  });
}

export async function answerChat(request: ChatRequest) {
  return answerChatWithDependencies(request, {
    searchEvidence: (query, mode) => staticRetrievalStore.searchEvidence(query, mode),
    generateAnswer: (input) => model.generateAnswer(input)
  });
}
