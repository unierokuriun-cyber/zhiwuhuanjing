export type Category = "观赏性" | "实用性";
export type Location = "客厅" | "阳台" | "书房" | "庭院" | "室内";
export type Plant = {
  id: string;
  speciesId: string;
  name: string;
  latin: string;
  nickname: string;
  location: Location;
  image: string;
  moisture: number;
  light: string;
  temperature: number;
  status: "健康" | "需要关注";
  days: number;
  category: Category;
  stage: string;
  goal: string;
  createdAt: string;
  lastCareAt?: string;
  deviceConnected: false;
};
export type PlantDraft = Pick<
  Plant,
  | "speciesId"
  | "nickname"
  | "category"
  | "location"
  | "stage"
  | "goal"
  | "image"
>;
export type CareTask = {
  id: string;
  plantId: string;
  title: string;
  subtitle: string;
  type: "water" | "sun" | "photo";
  done: boolean;
  date?: string;
  status?: "pending" | "completed" | "skipped";
};
export type CareKind = "water" | "fertilize" | "prune" | "task" | "observation" | "growth";
export type CareRecord = {
  id: string;
  plantId: string;
  text: string;
  at: string;
  kind: CareKind;
  xp: number;
};

export type ChatMessage = {
  id: string;
  plantId: string;
  role: "user" | "assistant";
  text: string;
  at: string;
};
export type CompanionEvent = { id: string; plantId: string; kind: "create" | "greet" | "observe" | "growth"; at: string; xp: number };
