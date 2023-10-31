import {authActions} from "features/auth/auth.reducer"
import {createSlice, PayloadAction} from "@reduxjs/toolkit"
import {AppThunk} from "app/store"
import {authApi} from "features/auth/auth.api";

const slice = createSlice({
  name: "app",
  initialState: {
    status: "idle" as RequestStatusType,
    error: null as string | null,
    isInitialized: false,
  },
  reducers: {
    setAppError: (state, action: PayloadAction<{ error: string | null }>) => {
      state.error = action.payload.error
    },
    setAppStatus: (state, action: PayloadAction<{ status: RequestStatusType }>) => {
      state.status = action.payload.status
    },
    setAppInitialized: (state, action: PayloadAction<{ value: boolean }>) => {
      state.isInitialized = action.payload.value
    },
  },
})

export const initializeAppTC = (): AppThunk => (dispatch) => {
  authApi.me().then((res) => {
    if (res.data.resultCode === 0) {
      // dispatch(setIsLoggedInAC(true))
      dispatch(authActions.setIsLoggedIn({ isLoggedIn: true }))
    } else {
    }
    dispatch(appActions.setAppInitialized({ value: true }))
  })
}

export const appReducer = slice.reducer
export const appActions = slice.actions
//types
export type InitialStateType = ReturnType<typeof slice.getInitialState>
export type RequestStatusType = "idle" | "loading" | "succeeded" | "failed"
