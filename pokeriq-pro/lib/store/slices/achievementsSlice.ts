import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AchievementState, Achievement, UserAchievement } from '@/types';
import { achievementsAPI } from '@/lib/api/achievements';

// 初始状态
const initialState: AchievementState = {
  achievements: [],
  userAchievements: [],
  loading: false,
  error: null,
};

// 异步 actions
export const fetchAchievements = createAsyncThunk(
  'achievements/fetchAchievements',
  async (_, { rejectWithValue }) => {
    try {
      const response = await achievementsAPI.getAllAchievements();
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || '获取成就列表失败');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserAchievements = createAsyncThunk(
  'achievements/fetchUserAchievements',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await achievementsAPI.getUserAchievements(userId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || '获取用户成就失败');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const unlockAchievement = createAsyncThunk(
  'achievements/unlockAchievement',
  async ({ userId, achievementId }: { userId: string; achievementId: string }, { rejectWithValue }) => {
    try {
      const response = await achievementsAPI.unlockAchievement(userId, achievementId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || '解锁成就失败');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateAchievementProgress = createAsyncThunk(
  'achievements/updateProgress',
  async ({ 
    userId, 
    achievementId, 
    progress 
  }: { 
    userId: string; 
    achievementId: string; 
    progress: number;
  }, { rejectWithValue }) => {
    try {
      const response = await achievementsAPI.updateProgress(userId, achievementId, progress);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || '更新成就进度失败');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const checkAchievements = createAsyncThunk(
  'achievements/checkAchievements',
  async ({ userId, actionType, actionData }: { 
    userId: string; 
    actionType: string; 
    actionData: any;
  }, { rejectWithValue }) => {
    try {
      const response = await achievementsAPI.checkAchievements(userId, actionType, actionData);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || '检查成就失败');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const getAchievementStats = createAsyncThunk(
  'achievements/getStats',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await achievementsAPI.getAchievementStats(userId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || '获取成就统计失败');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const achievementsSlice = createSlice({
  name: 'achievements',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addAchievement: (state, action: PayloadAction<Achievement>) => {
      state.achievements.push(action.payload);
    },
    updateUserAchievement: (state, action: PayloadAction<UserAchievement>) => {
      const index = state.userAchievements.findIndex(
        ua => ua.achievementId === action.payload.achievementId
      );
      if (index !== -1) {
        state.userAchievements[index] = action.payload;
      } else {
        state.userAchievements.push(action.payload);
      }
    },
    markAchievementAsCompleted: (state, action: PayloadAction<{ achievementId: string; completedAt: string }>) => {
      const userAchievement = state.userAchievements.find(
        ua => ua.achievementId === action.payload.achievementId
      );
      if (userAchievement) {
        userAchievement.isCompleted = true;
        userAchievement.completedAt = action.payload.completedAt;
        userAchievement.progress = userAchievement.maxProgress;
      }
    },
    incrementAchievementProgress: (state, action: PayloadAction<{ achievementId: string; increment: number }>) => {
      const userAchievement = state.userAchievements.find(
        ua => ua.achievementId === action.payload.achievementId && !ua.isCompleted
      );
      if (userAchievement) {
        userAchievement.progress = Math.min(
          userAchievement.progress + action.payload.increment,
          userAchievement.maxProgress
        );
        
        // 检查是否完成
        if (userAchievement.progress >= userAchievement.maxProgress) {
          userAchievement.isCompleted = true;
          userAchievement.completedAt = new Date().toISOString();
        }
      }
    },
    resetAchievements: (state) => {
      state.achievements = [];
      state.userAchievements = [];
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // 获取成就列表
    builder
      .addCase(fetchAchievements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAchievements.fulfilled, (state, action) => {
        state.loading = false;
        state.achievements = action.payload;
        state.error = null;
      })
      .addCase(fetchAchievements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 获取用户成就
    builder
      .addCase(fetchUserAchievements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserAchievements.fulfilled, (state, action) => {
        state.loading = false;
        state.userAchievements = action.payload;
        state.error = null;
      })
      .addCase(fetchUserAchievements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 解锁成就
    builder
      .addCase(unlockAchievement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unlockAchievement.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.userAchievements.findIndex(
          ua => ua.achievementId === action.payload.achievementId
        );
        if (index !== -1) {
          state.userAchievements[index] = action.payload;
        } else {
          state.userAchievements.push(action.payload);
        }
        state.error = null;
      })
      .addCase(unlockAchievement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 更新成就进度
    builder
      .addCase(updateAchievementProgress.pending, (state) => {
        state.error = null;
      })
      .addCase(updateAchievementProgress.fulfilled, (state, action) => {
        const index = state.userAchievements.findIndex(
          ua => ua.achievementId === action.payload.achievementId
        );
        if (index !== -1) {
          state.userAchievements[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateAchievementProgress.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // 检查成就
    builder
      .addCase(checkAchievements.pending, (state) => {
        state.error = null;
      })
      .addCase(checkAchievements.fulfilled, (state, action) => {
        // 更新可能解锁的成就
        if (action.payload.unlockedAchievements) {
          action.payload.unlockedAchievements.forEach((achievement: UserAchievement) => {
            const index = state.userAchievements.findIndex(
              ua => ua.achievementId === achievement.achievementId
            );
            if (index !== -1) {
              state.userAchievements[index] = achievement;
            } else {
              state.userAchievements.push(achievement);
            }
          });
        }
        
        // 更新进度变化的成就
        if (action.payload.updatedProgress) {
          action.payload.updatedProgress.forEach((achievement: UserAchievement) => {
            const index = state.userAchievements.findIndex(
              ua => ua.achievementId === achievement.achievementId
            );
            if (index !== -1) {
              state.userAchievements[index] = achievement;
            }
          });
        }
        
        state.error = null;
      })
      .addCase(checkAchievements.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // 获取成就统计
    builder
      .addCase(getAchievementStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAchievementStats.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(getAchievementStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  addAchievement,
  updateUserAchievement,
  markAchievementAsCompleted,
  incrementAchievementProgress,
  resetAchievements,
} = achievementsSlice.actions;

export default achievementsSlice.reducer;