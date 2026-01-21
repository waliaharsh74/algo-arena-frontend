import { create } from "zustand";
import { api } from "@/lib/api";
import { isApiError } from "@/lib/errors";
import { notifyError, notifySuccess } from "@/lib/notify";
import {
  adminQuestionsResponseSchema,
  contestStatus,
  contestsResponseSchema,
  contestResponseSchema,
  joinContestResponseSchema,
  leaderboardResponseSchema,
  importQuestionsResponseSchema,
  attachQuestionsResponseSchema,
  deleteQuestionResponseSchema,
  progressResponseSchema,
  questionResponseSchema,
  questionsResponseSchema,
  submitAnswerResponseSchema,
  updateQuestionResponseSchema,
  type AdminQuestion,
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
  adminQuestions: AdminQuestion[];
  answers: Record<string, AnswerRecord>;
  progress: Progress | null;
  leaderboard: LeaderboardResponse | null;
  detailLoading: boolean;
  questionsLoading: boolean;
  adminQuestionsLoading: boolean;
  joinLoading: boolean;
  leaderboardLoading: boolean;
  submitLoading: boolean;
  progressLoading: boolean;
  createLoading: boolean;
  updateLoading: boolean;
  questionCreateLoading: boolean;
  questionUpdateLoading: boolean;
  questionDeleteLoading: boolean;
  questionImportLoading: boolean;
  questionAttachLoading: boolean;
  loadAllContests: (force?: boolean) => Promise<void>;
  loadContests: (status: ContestStatus, force?: boolean) => Promise<void>;
  selectContest: (contestId: string | null) => void;
  loadContest: (contestId: string) => Promise<void>;
  createContest: (payload: {
    title: string;
    description?: string | null;
    startTime: string;
    endTime: string;
  }) => Promise<Contest | null>;
  updateContest: (
    contestId: string,
    payload: {
      title?: string;
      description?: string | null;
      startTime?: string;
      endTime?: string;
    }
  ) => Promise<Contest | null>;
  createQuestion: (
    contestId: string,
    payload: {
      title: string;
      description?: string | null;
      isMultiple: boolean;
      points: number;
      maxTimeSeconds: number;
      order?: number;
      choices: { value: string; isCorrect: boolean }[];
    }
  ) => Promise<Question | null>;
  updateQuestion: (
    questionId: string,
    payload: {
      title: string;
      description?: string | null;
      isMultiple: boolean;
      points: number;
      maxTimeSeconds: number;
      choices: { value: string; isCorrect: boolean }[];
    }
  ) => Promise<boolean>;
  deleteQuestion: (questionId: string) => Promise<boolean>;
  importQuestions: (
    contestId: string,
    payload: { sourceContestId: string; questionIds?: string[]; startOrder?: number }
  ) => Promise<number | null>;
  attachQuestions: (
    contestId: string,
    payload: { questionIds: string[]; startOrder?: number }
  ) => Promise<number | null>;
  joinContest: (contestId: string) => Promise<boolean>;
  loadQuestions: (contestId: string) => Promise<void>;
  submitAnswer: (
    contestId: string,
    payload: { questionId: string; choiceIds: string[]; timeTakenSeconds: number }
  ) => Promise<SubmitAnswerResult | null>;
  loadProgress: (contestId: string) => Promise<void>;
  loadLeaderboard: (contestId: string) => Promise<void>;
  loadAdminQuestions: (contestId: string) => Promise<void>;
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
  adminQuestions: [],
  answers: {},
  progress: null,
  leaderboard: null,
  detailLoading: false,
  questionsLoading: false,
  adminQuestionsLoading: false,
  joinLoading: false,
  leaderboardLoading: false,
  submitLoading: false,
  progressLoading: false,
  createLoading: false,
  updateLoading: false,
  questionCreateLoading: false,
  questionUpdateLoading: false,
  questionDeleteLoading: false,
  questionImportLoading: false,
  questionAttachLoading: false,
  loadAllContests: async (force = false) => {
    await Promise.all(contestStatus.map((status) => get().loadContests(status, force)));
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
      adminQuestions: [],
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
  createContest: async (payload) => {
    set({ createLoading: true });
    try {
      const data = await api.post("/contests", payload, contestResponseSchema);
      notifySuccess("Contest created", "Contest is ready for questions.");
      await get().loadAllContests(true);
      return data.contest;
    } catch (error) {
      notifyError(error, "Unable to create contest.");
      return null;
    } finally {
      set({ createLoading: false });
    }
  },
  updateContest: async (contestId, payload) => {
    set({ updateLoading: true });
    try {
      const data = await api.patch(`/contests/${contestId}`, payload, contestResponseSchema);
      set((state) => ({
        activeContest: state.activeContest?.id === contestId ? data.contest : state.activeContest,
      }));
      notifySuccess("Contest updated", "Contest details were saved.");
      await get().loadAllContests(true);
      return data.contest;
    } catch (error) {
      notifyError(error, "Unable to update contest.");
      return null;
    } finally {
      set({ updateLoading: false });
    }
  },
  createQuestion: async (contestId, payload) => {
    set({ questionCreateLoading: true });
    try {
      const data = await api.post(
        `/contests/${contestId}/questions`,
        payload,
        questionResponseSchema
      );
      notifySuccess("Question added", "Question is ready for the contest.");
      await get().loadAdminQuestions(contestId);
      return data.question;
    } catch (error) {
      notifyError(error, "Unable to add question.");
      return null;
    } finally {
      set({ questionCreateLoading: false });
    }
  },
  updateQuestion: async (questionId, payload) => {
    set({ questionUpdateLoading: true });
    try {
      await api.patch(`/questions/${questionId}`, payload, updateQuestionResponseSchema);
      notifySuccess("Question updated", "Question details were saved.");
      return true;
    } catch (error) {
      notifyError(error, "Unable to update question.");
      return false;
    } finally {
      set({ questionUpdateLoading: false });
    }
  },
  deleteQuestion: async (questionId) => {
    set({ questionDeleteLoading: true });
    try {
      await api.delete(`/questions/${questionId}`, deleteQuestionResponseSchema);
      notifySuccess("Question deleted", "Question was removed from the bank.");
      return true;
    } catch (error) {
      notifyError(error, "Unable to delete question.");
      return false;
    } finally {
      set({ questionDeleteLoading: false });
    }
  },
  importQuestions: async (contestId, payload) => {
    set({ questionImportLoading: true });
    try {
      const data = await api.post(
        `/contests/${contestId}/questions/import`,
        payload,
        importQuestionsResponseSchema
      );
      notifySuccess("Questions imported", `Imported ${data.imported} questions.`);
      await get().loadAdminQuestions(contestId);
      return data.imported;
    } catch (error) {
      notifyError(error, "Unable to import questions.");
      return null;
    } finally {
      set({ questionImportLoading: false });
    }
  },
  attachQuestions: async (contestId, payload) => {
    set({ questionAttachLoading: true });
    try {
      const data = await api.post(
        `/contests/${contestId}/questions/attach`,
        payload,
        attachQuestionsResponseSchema
      );
      notifySuccess("Questions added", `Added ${data.added} questions to this contest.`);
      await get().loadAdminQuestions(contestId);
      return data.added;
    } catch (error) {
      notifyError(error, "Unable to add questions.");
      return null;
    } finally {
      set({ questionAttachLoading: false });
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
      const submittedAnswers = data.questions.reduce<Record<string, AnswerRecord>>(
        (acc, question) => {
          if (question.submittedAnswer) {
            acc[question.id] = {
              choiceIds: question.submittedAnswer.choiceIds,
              awardedPoints: question.submittedAnswer.awardedPoints,
              submittedAt: question.submittedAnswer.submittedAt,
            };
          }
          return acc;
        },
        {}
      );
      if (get().activeContestId === contestId) {
        set((state) => ({
          questions: data.questions,
          answers: { ...submittedAnswers, ...state.answers },
          questionsLoading: false,
        }));
      }
    } catch (error) {
      set({ questionsLoading: false });
      if (isApiError(error) && error.code === "NOT_A_PARTICIPANT") {
        return;
      }
      notifyError(error, "Unable to load questions.");
    }
  },
  loadAdminQuestions: async (contestId) => {
    set({ adminQuestionsLoading: true });
    try {
      const data = await api.get(
        `/contests/${contestId}/questions/manage`,
        adminQuestionsResponseSchema
      );
      if (get().activeContestId === contestId) {
        set({ adminQuestions: data.questions, adminQuestionsLoading: false });
      }
    } catch (error) {
      set({ adminQuestionsLoading: false });
      notifyError(error, "Unable to load contest questions.");
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
          ? {
              ...state.progress,
              score: data.score,
              attemptedCount: state.progress.attemptedCount + 1,
            }
          : { score: data.score, rank: null, attemptedCount: 1 },
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
      if (isApiError(error) && error.code === "NOT_A_PARTICIPANT") {
        return;
      }
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


