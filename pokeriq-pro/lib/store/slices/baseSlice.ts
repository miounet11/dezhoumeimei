import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LoadingState } from '@/types';

// 通用状态结构
export interface BaseState {
  loading: boolean;
  error: string | null;
  lastUpdated?: string;
}

// 通用reducer生成器
export function createBaseReducers<T extends BaseState>() {
  return {
    setLoading: (state: T, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setError: (state: T, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearError: (state: T) => {
      state.error = null;
    },
    setLastUpdated: (state: T) => {
      state.lastUpdated = new Date().toISOString();
    },
  };
}

// 通用异步action的extraReducers生成器
export function createAsyncExtraReducers<T extends BaseState>(builder: any, asyncThunk: any) {
  return builder
    .addCase(asyncThunk.pending, (state: T) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(asyncThunk.fulfilled, (state: T, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = null;
      state.lastUpdated = new Date().toISOString();
      return { ...state, ...action.payload };
    })
    .addCase(asyncThunk.rejected, (state: T, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    });
}