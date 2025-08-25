import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import trainingSlice from './slices/trainingSlice';
import achievementsSlice from './slices/achievementsSlice';
import { apiMiddleware } from './middleware/apiMiddleware';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    training: trainingSlice,
    achievements: achievementsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(apiMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;