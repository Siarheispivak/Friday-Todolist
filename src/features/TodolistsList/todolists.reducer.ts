import {appActions, RequestStatusType} from "app/app-reducer"
import {handleServerNetworkError} from "common/utils/handle-server-network-error"
import {createSlice, PayloadAction} from "@reduxjs/toolkit"
import {todolistsAPI, TodolistType, UpdateTodolistTitleArgType} from "./todolist.api";
import {createAppAsyncThunk, handleServerAppError} from "../../common/utils";
import {ResultCode} from "../../common/enum";

const slice = createSlice({
    name: "todolist",
    initialState: [] as TodolistDomainType[],
    reducers: {
        removeTodolist: (state, action: PayloadAction<{ id: string }>) => {
            // return state.filter((tl) => tl.id != action.payload.id)
            const index = state.findIndex((todo) => todo.id === action.payload.id)
            if (index !== -1) state.splice(index, 1)
        },
        addTodolist: (state, action: PayloadAction<{ todolist: TodolistType }>) => {
            // const a = current(state)
            // debugger
            state.unshift({...action.payload.todolist, filter: "all", entityStatus: "idle"})
        },
        changeTodolistTitle: (state, action: PayloadAction<{ id: string; title: string }>) => {
            // return state.map((tl) => (tl.id === action.id ? { ...tl, title: action.title } : tl))
            //variant 1
            const index = state.findIndex((todo) => todo.id === action.payload.id)
            if (index !== -1) state[index].title = action.payload.title
            //variant 2
            const todolist = state.find((todo) => todo.id === action.payload.id)
            if (todolist) {
                todolist.title = action.payload.title
            }
        },
        changeTodolistFilter: (state, action: PayloadAction<{ id: string; filter: FilterValuesType }>) => {
            // return state.map((tl) => (tl.id === action.id ? { ...tl, filter: action.filter } : tl))
            const index = state.findIndex((todo) => todo.id === action.payload.id)
            if (index !== -1) state[index].filter = action.payload.filter
        },
        changeTodolistEntityStatus: (state, action: PayloadAction<{ id: string; status: RequestStatusType }>) => {
            // return state.map((tl) => (tl.id === action.id ? { ...tl, entityStatus: action.status } : tl))
            const index = state.findIndex((todo) => todo.id === action.payload.id)
            if (index !== -1) state[index].entityStatus = action.payload.status
        },
    },
    extraReducers: (builder) => {
        builder.addCase(todosThunks.fetchTodolists.fulfilled, (state, action) => {
            action.payload.todolists.forEach((tl: any) => {
                state.push({...tl, filter: "all", entityStatus: "idle"})
            })
        })
        builder.addCase(todosThunks.removeTodolist.fulfilled, (state, action) => {
            // return state.filter((tl) => tl.id != action.payload.id)
            const index = state.findIndex((todo) => todo.id === action.payload.id)
            if (index !== -1) state.splice(index, 1)
        })
        builder.addCase(todosThunks.addTodolist.fulfilled, (state, action) => {
            state.unshift({...action.payload.todolist, filter: "all", entityStatus: "idle"})
        })
    }
})
// thunks
export const fetchTodolists = createAppAsyncThunk<{
    todolists: TodolistType[]
}, void>(`${slice.name}/fetchTodolists`, async (_, thunkAPI) => {
    const {dispatch, rejectWithValue} = thunkAPI
    try {
        dispatch(appActions.setAppStatus({status: "loading"}));
        const res = await todolistsAPI.getTodolists();
        dispatch(appActions.setAppStatus({status: "succeeded"}));
        return {todolists: res.data};
    } catch (e) {
        handleServerNetworkError(e, dispatch);
        return rejectWithValue(null);
    }
})

export const removeTodolist = createAppAsyncThunk<{
    id: string
}, string>(`${slice.name}/removeTodolists`, async (todolistId: string, thunkAPI) => {
    const {dispatch, rejectWithValue} = thunkAPI
    try {
        dispatch(appActions.setAppStatus({status: "loading"}))
        dispatch(todolistActions.changeTodolistEntityStatus({id: todolistId, status: "loading"}))
        const res = await todolistsAPI.deleteTodolist(todolistId)
        dispatch(appActions.setAppStatus({status: "succeeded"}))
        return {id: todolistId}
    } catch (error) {
        handleServerNetworkError(error, dispatch)
        return rejectWithValue(null)
    }
})


export const addTodolist = createAppAsyncThunk<{
    todolist: TodolistType
}, string>(`${slice.name}/addTodolists`, async (title, thunkAPI) => {
    const {dispatch, rejectWithValue} = thunkAPI
    try {
        dispatch(appActions.setAppStatus({status: "loading"}))
        const res = await todolistsAPI.createTodolist(title)
        if (res.data.resultCode === ResultCode.Success) {
            dispatch(appActions.setAppStatus({status: "succeeded"}))
            return {todolist: res.data.data.item}
        } else {
            handleServerAppError(res.data, dispatch)
            return rejectWithValue(null)
        }
    } catch (error) {
        handleServerNetworkError(error, dispatch)
        return rejectWithValue(null)
    }


})

export const changeTodolistTitle = createAppAsyncThunk<UpdateTodolistTitleArgType, UpdateTodolistTitleArgType>(`${slice.name}/updateTodolistTitle`, async (arg, thunkAPI) => {
    const {dispatch, rejectWithValue} = thunkAPI
    try {
        dispatch(appActions.setAppStatus({status: "loading"}))
        const res = await todolistsAPI.updateTodolist(arg)
        if(res.data.resultCode === ResultCode.Success){
            dispatch(appActions.setAppStatus({status: "succeeded"}))
        return arg
        }else{
            handleServerAppError(res.data, dispatch)
            return rejectWithValue(null)
        }
    } catch (error) {
        handleServerNetworkError(error, dispatch)
        return rejectWithValue(null)
    }
})
export const todolistsReducer = slice.reducer
export const todolistActions = slice.actions
export const todosThunks = {fetchTodolists, removeTodolist, addTodolist,changeTodolistTitle}


// types
export type FilterValuesType = "all" | "active" | "completed"
export type TodolistDomainType = TodolistType & {
    filter: FilterValuesType
    entityStatus: RequestStatusType
}
