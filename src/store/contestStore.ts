import { create } from "zustand";
import { api } from "@/lib/api";
import { notifyError, notifySuccess } from "@/lib/notify";
import {
  contestStatus,
  contestsResponseSchema,
  contestResponseSchema,
  joinContestResponseSchema,
  leaderboardResponseSchema,
  progressResponseSchema,
  questionsResponseSchema,
  submitAnswerResponseSchema,
  type Contest,
  type ContestStatus,
  type LeaderboardResponse,
  type Progress,
  type Question,
  type SubmitAnswerResult,
} from "@/types/api";

type AnswerRecord = {
  choiceIds: string[];
  awardedPoints: number;
  submittedAt: string;
};

type ContestState = {
  contestsByStatus: Record<ContestStatus, Contest[]>;
  listLoading: Record<ContestStatus, boolean>;
  listLoaded: Record<ContestStatus, boolean>;
  activeContestId: string | null;
  activeContest: Contest | null;
  questions: Question[];
  answers: Record<string, AnswerRecord>;
  progress: Progress | null;
  leaderboard: LeaderboardResponse | null;
  detailLoading: boolean;
  questionsLoading: boolean;
  joinLoading: boolean;
  leaderboardLoading: boolean;
  submitLoading: boolean;
  progressLoading: boolean;
  loadAllContests: () => Promise<void>;
  loadContests: (status: ContestStatus, force?: boolean) => Promise<void>;
  selectContest: (contestId: string | null) => void;
  loadContest: (contestId: string) => Promise<void>;
  joinContest: (contestId: string) => Promise<boolean>;
  loadQuestions: (contestId: string) => Promise<void>;
  submitAnswer: (
    contestId: string,
    payload: { questionId: string; choiceIds: string[]; timeTakenSeconds: number }
  ) => Promise<SubmitAnswerResult | null>;
  loadProgress: (contestId: string) => Promise<void>;
  loadLeaderboard: (contestId: string) => Promise<void>;
};

const buildStatusRecord = <T,>(value: T) =>
  contestStatus.reduce((acc, status) => {
    acc[status] = value;
    return acc;
  }, {} as Record<ContestStatus, T>);

export const useContestStore = create<ContestState>((set, get) => ({
  contestsByStatus: buildStatusRecord<Contest[]>([]),
  listLoading: buildStatusRecord(false),
  listLoaded: buildStatusRecord(false),
  activeContestId: null,
  activeContest: null,
  questions: [],
  answers: {},
  progress: null,
  leaderboard: null,
  detailLoading: false,
  questionsLoading: false,
  joinLoading: false,
  leaderboardLoading: false,
  submitLoading: false,
  progressLoading: false,
  loadAllContests: async () => {
    await Promise.all(contestStatus.map((status) => get().loadContests(status)));
  },
  loadContests: async (status, force = false) => {
    const { listLoaded, listLoading } = get();
    if (listLoaded[status] && !force) return;
    if (listLoading[status]) return;

    set((state) => ({
      listLoading: { ...state.listLoading, [status]: true },
    }));

    try {
      const data = await api.get(
        `/contests?status=${status}&limit=20`,
        contestsResponseSchema
      );
      set((state) => ({
        contestsByStatus: { ...state.contestsByStatus, [status]: data.contests },
        listLoaded: { ...state.listLoaded, [status]: true },
        listLoading: { ...state.listLoading, [status]: false },
      }));
    } catch (error) {
      set((state) => ({
        listLoading: { ...state.listLoading, [status]: false },
      }));
      notifyError(error, "Unable to load contests.");
    }
  },
  selectContest: (contestId) => {
    const contest = contestId
      ? contestStatus
          .flatMap((status) => get().contestsByStatus[status])
          .find((item) => item.id === contestId) ?? null
      : null;

    set({
      activeContestId: contestId,
      activeContest: contest,
      questions: [],
      answers: {},
      progress: null,
      leaderboard: null,
    });

    if (contestId) {
      void get().loadContest(contestId);
      void get().loadLeaderboard(contestId);
    }
  },
  loadContest: async (contestId) => {
    set({ detailLoading: true });
    try {
      const data = await api.get(`/contests/${contestId}`, contestResponseSchema);
      if (get().activeContestId === contestId) {
        set({ activeContest: data.contest, detailLoading: false });
      }
    } catch (error) {
      set({ detailLoading: false });
      notifyError(error, "Unable to load contest details.");
    }
  },
  joinContest: async (contestId) => {
    set({ joinLoading: true });
    try {
      await api.post(`/contests/${contestId}/join`, undefined, joinContestResponseSchema);
      notifySuccess("Joined contest", "Questions are unlocked for you.");
      await Promise.all([get().loadQuestions(contestId), get().loadProgress(contestId)]);
      return true;
    } catch (error) {
      notifyError(error, "Unable to join contest.");
      return false;
    } finally {
      set({ joinLoading: false });
    }
  },
  loadQuestions: async (contestId) => {
    set({ questionsLoading: true });
    try {
      const data = await api.get(
        `/contests/${contestId}/questions`,
        questionsResponseSchema
      );
      if (get().activeContestId === contestId) {
        set({ questions: data.questions, questionsLoading: false });
      }
    } catch (error) {
      set({ questionsLoading: false });
      notifyError(error, "Unable to load questions.");
    }
  },
  submitAnswer: async (contestId, payload) => {
    if (get().answers[payload.questionId]) {
      return null;
    }
    set({ submitLoading: true });
    try {
      const data = await api.post(
        `/contests/${contestId}/answers`,
        payload,
        submitAnswerResponseSchema
      );
      set((state) => ({
        answers: {
          ...state.answers,
          [payload.questionId]: {
            choiceIds: payload.choiceIds,
            awardedPoints: data.awardedPoints,
            submittedAt: new Date().toISOString(),
          },
        },
        progress: state.progress
          ? { ...state.progress, score: data.score }
          : { score: data.score, rank: null },
      }));
      notifySuccess(
        "Answer submitted",
        data.awardedPoints ? `+${data.awardedPoints} points awarded.` : "No points this time."
      );
      void get().loadProgress(contestId);
      void get().loadLeaderboard(contestId);
      return data;
    } catch (error) {
      notifyError(error, "Unable to submit answer.");
      return null;
    } finally {
      set({ submitLoading: false });
    }
  },
  loadProgress: async (contestId) => {
    set({ progressLoading: true });
    try {
      const data = await api.get(`/contests/${contestId}/me`, progressResponseSchema);
      if (get().activeContestId === contestId) {
        set({ progress: data.progress, progressLoading: false });
      }
    } catch (error) {
      set({ progressLoading: false });
      notifyError(error, "Unable to load your progress.");
    }
  },
  loadLeaderboard: async (contestId) => {
    set({ leaderboardLoading: true });
    try {
      const data = await api.get(
        `/contests/${contestId}/leaderboard?limit=10&offset=0`,
        leaderboardResponseSchema
      );
      if (get().activeContestId === contestId) {
        set({ leaderboard: data, leaderboardLoading: false });
      }
    } catch (error) {
      set({ leaderboardLoading: false });
      notifyError(error, "Unable to load leaderboard.");
    }
  },
}));


