import {createAppAsyncThunk, handleServerAppError, handleServerNetworkError} from "common/utils"
import {appActions} from "app/app-reducer"
import {createSlice} from "@reduxjs/toolkit"
import {todosThunks} from "features/TodolistsList/todolists.reducer"
import {clearTasksAndTodolists} from "common/actions/common.actions"
import {ArgAddTask, ArgRemoveTask, ArgUpdateTask, TaskType, todolistsAPI, UpdateTaskModelType} from "./todolist.api";
import {TaskPriorities, TaskStatuses} from "common/enum";

const slice = createSlice({
    name: "tasks",
    initialState: {} as TasksStateType,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(todosThunks.addTodolist.fulfilled, (state, action) => {
            state[action.payload.todolist.id] = []
        })
        builder.addCase(todosThunks.removeTodolist.fulfilled, (state, action) => {
            delete state[action.payload.id]
        })
        builder.addCase(todosThunks.fetchTodolists.fulfilled, (state, action) => {
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
        builder.addCase(addTask.fulfilled, (state, action) => {
            const tasksForCurrentTodolist = state[action.payload.task.todoListId]
            tasksForCurrentTodolist.unshift(action.payload.task)
        })
        builder.addCase(removeTask.fulfilled,(state, action)=>{
            const tasksForCurrentTodolist = state[action.payload.todolistId]
            const index = tasksForCurrentTodolist.findIndex((task) => task.id === action.payload.taskId)
            if (index !== -1) tasksForCurrentTodolist.splice(index, 1)
        })
        builder.addCase(updateTask.fulfilled, (state, action) => {
            const tasksForCurrentTodolist = state[action.payload.todolistId]
            const index = tasksForCurrentTodolist.findIndex((task) => task.id === action.payload.taskId)
            if (index != -1) {
                tasksForCurrentTodolist[index] = {...tasksForCurrentTodolist[index], ...action.payload.domainModel}
            }
        })
    },
})

// thunks
const fetchTasks = createAppAsyncThunk(`${slice.name}/fetchTasks`, async (todolistId: string, thunkAPI) => {
    const {dispatch, rejectWithValue} = thunkAPI
    try {
        dispatch(appActions.setAppStatus({status: "loading"}))
        const res = await todolistsAPI.getTasks(todolistId)
        const tasks = res.data.items
        dispatch(appActions.setAppStatus({status: "succeeded"}))
        return {tasks, todolistId}
    } catch (error) {
        handleServerNetworkError(error, dispatch)
        return rejectWithValue(null)
    }
})

const addTask = createAppAsyncThunk<{ task: TaskType }, ArgAddTask>(`${slice.name}/addTask`, async (arg, thunkAPI) => {
    const {dispatch, rejectWithValue} = thunkAPI
    try {
        dispatch(appActions.setAppStatus({status: "loading"}))
        const res = await todolistsAPI.createTask(arg)
        if (res.data.resultCode === 0) {
            const task = res.data.data.item
            dispatch(appActions.setAppStatus({status: "succeeded"}))
            return {task}
        } else {
            handleServerAppError(res.data, dispatch)
            return rejectWithValue(null)
        }
    } catch (error) {
        handleServerNetworkError(error, dispatch)
        return rejectWithValue(null)
    }
})

const updateTask = createAppAsyncThunk<ArgUpdateTask, ArgUpdateTask>(`${slice.name}/updateTask`, async (arg, thunkAPI) => {
    const {dispatch, rejectWithValue, getState} = thunkAPI
    try {
    const state = getState()
    const task = state.tasks[arg.todolistId].find((t) => t.id === arg.taskId)
    if (!task) {
        //throw new Error("task not found in the state");
        console.warn("task not found in the state")
        return rejectWithValue(null)
    }
    const apiModel: UpdateTaskModelType = {
        deadline: task.deadline,
        description: task.description,
        priority: task.priority,
        startDate: task.startDate,
        title: task.title,
        status: task.status,
        ...arg.domainModel,
    }


        const res = await todolistsAPI.updateTask(arg.todolistId, arg.taskId, apiModel)

        if (res.data.resultCode === 0) {
            return arg
        } else {
            handleServerAppError(res.data, dispatch)
            return rejectWithValue(null)
        }
    } catch (error: any) {
        handleServerNetworkError(error, dispatch)
        return rejectWithValue(null)
    }
})
const removeTask = createAppAsyncThunk<ArgRemoveTask,ArgRemoveTask>(`${slice.name}/removeTask`,async (arg, thunkAPI) =>{
    const {dispatch, rejectWithValue} = thunkAPI
    try{
        dispatch(appActions.setAppStatus({status: "loading"}))
        const res = await todolistsAPI.deleteTask(arg.todolistId, arg.taskId)
        if (res.data.resultCode === 0) {
            // const task = res.data
            dispatch(appActions.setAppStatus({status: "succeeded"}))
            return { taskId: arg.taskId, todolistId:arg.todolistId }
        } else {
            handleServerAppError(res.data, dispatch)
            return rejectWithValue(null)
        }

    }catch (error: any) {
        handleServerNetworkError(error, dispatch)
        return rejectWithValue(null)
    }
})

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
export const tasksThunks = {fetchTasks, addTask, updateTask,removeTask}
