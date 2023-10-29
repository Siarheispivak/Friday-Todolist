import { TaskPriorities, TaskStatuses, TaskType, todolistsAPI, UpdateTaskModelType } from "api/todolists-api"
import { AppDispatch, AppRootStateType, AppThunk } from "app/store"
import { handleServerAppError, handleServerNetworkError } from "utils/error-utils"
import { appActions } from "app/app-reducer"
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { todolistActions } from "features/TodolistsList/todolists-reducer"
import { clearTasksAndTodolists } from "common/actions/common.actions"
import { createAppAsyncThunk } from "utils/createAppAsyncThunk"

const slice = createSlice({
  name: "tasks",
  initialState: {} as TasksStateType,
  reducers: {
    removeTask: (state, action: PayloadAction<{ taskId: string; todolistId: string }>) => {
      // return { ...state, [action.todolistId]: state[action.todolistId].filter((t) => t.id != action.taskId) }
      const tasksForCurrentTodolist = state[action.payload.todolistId]
      const index = tasksForCurrentTodolist.findIndex((task) => task.id === action.payload.taskId)
      if (index !== -1) tasksForCurrentTodolist.splice(index, 1)
    },
    addTask: (state, action: PayloadAction<{ task: TaskType }>) => {
      // return { ...state, [action.task.todoListId]: [action.task, ...state[action.task.todoListId]] }
      const tasksForCurrentTodolist = state[action.payload.task.todoListId]
      tasksForCurrentTodolist.unshift(action.payload.task)
    },
    updateTask: (
      state,
      action: PayloadAction<{ taskId: string; model: UpdateDomainTaskModelType; todolistId: string }>,
    ) => {
      // return { ...state, [action.task.todoListId]: [action.task, ...state[action.task.todoListId]] }

      const tasksForCurrentTodolist = state[action.payload.todolistId]
      const index = tasksForCurrentTodolist.findIndex((task) => task.id === action.payload.taskId)
      if (index != -1) {
        tasksForCurrentTodolist[index] = { ...tasksForCurrentTodolist[index], ...action.payload.model }
      }
      // ??????????????????????????????????????????????????????????????????????????????????????????
      // let task = state.tasksForCurrentTodolist.find((task) => task.id === action.payload.taskId)
      // if(task){
      //   task = {...task,...action.payload.model}
      // }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(todolistActions.addTodolist, (state, action) => {
      state[action.payload.todolist.id] = []
    })
    builder.addCase(todolistActions.removeTodolist, (state, action) => {
      delete state[action.payload.id]
    })
    builder.addCase(todolistActions.setTodolists, (state, action) => {
      action.payload.todolists.forEach((tl) => {
        state[tl.id] = []
      })
    })
    builder.addCase(clearTasksAndTodolists, () => {
      return {}
    })
    builder.addCase(fetchTasks.fulfilled, (state, action) => {
      state[action.payload.todolistId] = action.payload.tasks
    })
  },
})

// thunks
const fetchTasks = createAppAsyncThunk(`${slice.name}/fetchTasks`, async (todolistId: string, thunkAPI) => {
  const { dispatch, rejectWithValue } = thunkAPI
  try {
    dispatch(appActions.setAppStatus({ status: "loading" }))
    const res = await todolistsAPI.getTasks(todolistId)
    const tasks = res.data.items
    dispatch(appActions.setAppStatus({ status: "succeeded" }))
    return { tasks, todolistId }
  } catch (error: any) {
    handleServerNetworkError(error, dispatch)
    return rejectWithValue(null)
  }
})
export const removeTaskTC =
  (taskId: string, todolistId: string): AppThunk =>
  (dispatch) => {
    todolistsAPI.deleteTask(todolistId, taskId).then((res) => {
      dispatch(tasksActions.removeTask({ taskId, todolistId }))
    })
  }
export const addTaskTC =
  (title: string, todolistId: string): AppThunk =>
  (dispatch) => {
    dispatch(appActions.setAppStatus({ status: "loading" }))
    todolistsAPI
      .createTask(todolistId, title)
      .then((res) => {
        if (res.data.resultCode === 0) {
          dispatch(tasksActions.addTask({ task: res.data.data.item }))
          dispatch(appActions.setAppStatus({ status: "succeeded" }))
        } else {
          handleServerAppError(res.data, dispatch)
        }
      })
      .catch((error) => {
        handleServerNetworkError(error, dispatch)
      })
  }
export const updateTaskTC =
  (taskId: string, domainModel: UpdateDomainTaskModelType, todolistId: string): AppThunk =>
  (dispatch, getState) => {
    const state = getState()
    const task = state.tasks[todolistId].find((t) => t.id === taskId)
    if (!task) {
      //throw new Error("task not found in the state");
      console.warn("task not found in the state")
      return
    }

    const apiModel: UpdateTaskModelType = {
      deadline: task.deadline,
      description: task.description,
      priority: task.priority,
      startDate: task.startDate,
      title: task.title,
      status: task.status,
      ...domainModel,
    }

    todolistsAPI
      .updateTask(todolistId, taskId, apiModel)
      .then((res) => {
        if (res.data.resultCode === 0) {
          const action = tasksActions.updateTask({ taskId, model: domainModel, todolistId })
          dispatch(action)
        } else {
          handleServerAppError(res.data, dispatch)
        }
      })
      .catch((error) => {
        handleServerNetworkError(error, dispatch)
      })
  }

// types
export type UpdateDomainTaskModelType = {
  title?: string
  description?: string
  status?: TaskStatuses
  priority?: TaskPriorities
  startDate?: string
  deadline?: string
}
export type TasksStateType = {
  [key: string]: Array<TaskType>
}
export const tasksReducer = slice.reducer
export const tasksActions = slice.actions
export const tasksThunks = { fetchTasks }