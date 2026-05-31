export type AiNoteInput = {
  title: string;
  content: string;
};

export type ActionItem = {
  title: string;
  description: string | null;
};

export type AiProvider = {
  name: string;
  summarizeNote(input: AiNoteInput): Promise<string>;
  extractActionItems(input: AiNoteInput): Promise<ActionItem[]>;
};

export type AiApiStyle = "responses" | "chat-completions";

export type AiRuntimeConfig = {
  mode: "mock" | "openai-compatible";
  label?: string;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  apiStyle?: AiApiStyle;
};
