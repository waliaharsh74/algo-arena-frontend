import { create } from "zustand";
import { api } from "@/lib/api";
import { notifyError } from "@/lib/notify";
import { questionBankResponseSchema, type QuestionBankItem } from "@/types/api";

type QuestionBankState = {
  questions: QuestionBankItem[];
  pagination: { total: number; limit: number; offset: number };
  loading: boolean;
  requestId: number;
  loadQuestions: (params: {
    scope?: "global" | "mine";
    search?: string;
    tags?: string[];
    limit: number;
    offset: number;
  }) => Promise<void>;
};

const emptyPagination = { total: 0, limit: 20, offset: 0 };

export const useQuestionBankStore = create<QuestionBankState>((set, get) => ({
  questions: [],
  pagination: emptyPagination,
  loading: false,
  requestId: 0,
  loadQuestions: async ({ scope = "global", search, tags, limit, offset }) => {
    const nextRequestId = get().requestId + 1;
    set({ loading: true, requestId: nextRequestId });
    try {
      const params = new URLSearchParams();
      if (search?.trim()) {
        params.set("search", search.trim());
      }
      if (tags?.length) {
        params.set("tags", tags.join(","));
      }
      params.set("limit", String(limit));
      params.set("offset", String(offset));

      const path = scope === "mine" ? "/questions/mine" : "/questions";
      const data = await api.get(`${path}?${params.toString()}`, questionBankResponseSchema);
      if (get().requestId === nextRequestId) {
        set({ questions: data.questions, pagination: data.pagination, loading: false });
      }
    } catch (error) {
      if (get().requestId === nextRequestId) {
        set({ loading: false });
        notifyError(error, "Unable to load questions.");
      }
    }
  },
}));
