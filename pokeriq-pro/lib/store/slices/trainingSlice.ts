import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TrainingState, TrainingSession, TrainingScenario, AIRecommendation } from '@/types';
import { trainingAPI } from '@/lib/api/training';

// 初始状态
const initialState: TrainingState = {
  currentSession: null,
  scenarios: [],
  currentScenario: null,
  aiRecommendation: null,
  loading: false,
  error: null,
};

// 异步 actions
export const fetchScenarios = createAsyncThunk(
  'training/fetchScenarios',
  async ({ difficulty, category }: { difficulty?: string; category?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await trainingAPI.getScenarios({ difficulty, category });
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || '获取场景失败');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const startTrainingSession = createAsyncThunk(
  'training/startSession',
  async ({ scenarioId, difficulty }: { scenarioId: string; difficulty: string }, { rejectWithValue }) => {
    try {
      const response = await trainingAPI.startSession(scenarioId, difficulty);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || '开始训练失败');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const endTrainingSession = createAsyncThunk(
  'training/endSession',
  async (sessionId: string, { rejectWithValue }) => {
    try {
      const response = await trainingAPI.endSession(sessionId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || '结束训练失败');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const submitDecision = createAsyncThunk(
  'training/submitDecision',
  async ({ 
    sessionId, 
    scenarioId, 
    decision, 
    timeSpent 
  }: { 
    sessionId: string; 
    scenarioId: string; 
    decision: string; 
    timeSpent: number; 
  }, { rejectWithValue }) => {
    try {
      const response = await trainingAPI.submitDecision(sessionId, scenarioId, decision, timeSpent);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || '提交决策失败');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const getAIRecommendation = createAsyncThunk(
  'training/getAIRecommendation',
  async (scenarioId: string, { rejectWithValue }) => {
    try {
      const response = await trainingAPI.getAIRecommendation(scenarioId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || '获取AI建议失败');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTrainingHistory = createAsyncThunk(
  'training/fetchHistory',
  async ({ page = 1, limit = 10 }: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await trainingAPI.getTrainingHistory(page, limit);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || '获取训练历史失败');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const getScenarioById = createAsyncThunk(
  'training/getScenario',
  async (scenarioId: string, { rejectWithValue }) => {
    try {
      const response = await trainingAPI.getScenario(scenarioId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || '获取场景详情失败');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const trainingSlice = createSlice({
  name: 'training',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentScenario: (state, action: PayloadAction<TrainingScenario | null>) => {
      state.currentScenario = action.payload;
    },
    clearCurrentScenario: (state) => {
      state.currentScenario = null;
    },
    clearAIRecommendation: (state) => {
      state.aiRecommendation = null;
    },
    updateSessionStats: (state, action: PayloadAction<Partial<TrainingSession>>) => {
      if (state.currentSession) {
        state.currentSession = { ...state.currentSession, ...action.payload };
      }
    },
    resetTrainingState: (state) => {
      state.currentSession = null;
      state.currentScenario = null;
      state.aiRecommendation = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // 获取场景列表
    builder
      .addCase(fetchScenarios.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchScenarios.fulfilled, (state, action) => {
        state.loading = false;
        state.scenarios = action.payload;
        state.error = null;
      })
      .addCase(fetchScenarios.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 开始训练会话
    builder
      .addCase(startTrainingSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startTrainingSession.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSession = action.payload;
        state.error = null;
      })
      .addCase(startTrainingSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 结束训练会话
    builder
      .addCase(endTrainingSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(endTrainingSession.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSession = null;
        state.currentScenario = null;
        state.aiRecommendation = null;
        state.error = null;
      })
      .addCase(endTrainingSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 提交决策
    builder
      .addCase(submitDecision.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitDecision.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentSession) {
          state.currentSession.handsPlayed += 1;
          state.currentSession.totalDecisions += 1;
          if (action.payload.isCorrect) {
            state.currentSession.correctDecisions += 1;
          }
          state.currentSession.score = Math.round(
            (state.currentSession.correctDecisions / state.currentSession.totalDecisions) * 100
          );
        }
        state.error = null;
      })
      .addCase(submitDecision.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 获取AI建议
    builder
      .addCase(getAIRecommendation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAIRecommendation.fulfilled, (state, action) => {
        state.loading = false;
        state.aiRecommendation = action.payload;
        state.error = null;
      })
      .addCase(getAIRecommendation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 获取场景详情
    builder
      .addCase(getScenarioById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getScenarioById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentScenario = action.payload;
        state.error = null;
      })
      .addCase(getScenarioById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 获取训练历史
    builder
      .addCase(fetchTrainingHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrainingHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchTrainingHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setCurrentScenario,
  clearCurrentScenario,
  clearAIRecommendation,
  updateSessionStats,
  resetTrainingState,
} = trainingSlice.actions;

export default trainingSlice.reducer;