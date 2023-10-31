import React, {useCallback, useEffect} from "react"
import {useSelector} from "react-redux"
import {FilterValuesType, todolistActions, todosThunks,} from "./todolists.reducer"
import {tasksThunks} from "./tasks.reducer"
import {Grid, Paper} from "@mui/material"
import {Todolist} from "./Todolist/Todolist"
import {Navigate} from "react-router-dom"
import {useAppDispatch} from "common/hooks/useAppDispatch"
import {AddItemForm} from "common/components";
import {TaskStatuses} from "common/enum";
import {selectTodolists} from "./todolist.selectors";
import {selectTasks} from "./tasks.selectors";
import {selectIsLoggedIn} from "../auth/auth.selectors";

type PropsType = {
  demo?: boolean
}

export const TodolistsList: React.FC<PropsType> = ({ demo = false }) => {
  const todolists = useSelector(selectTodolists)
  const tasks = useSelector(selectTasks)
  const isLoggedIn = useSelector(selectIsLoggedIn)
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (demo || !isLoggedIn) {
      return
    }
    dispatch(todosThunks.fetchTodolists())
  }, [])

  const removeTask = useCallback(function (taskId: string, todolistId: string) {
    dispatch(tasksThunks.removeTask({taskId, todolistId}))
  }, [])

  const addTask = useCallback(function (title: string, todolistId: string) {
    dispatch(tasksThunks.addTask({title, todolistId}))
  }, [])

  const changeStatus = useCallback(function (taskId: string, status: TaskStatuses, todolistId: string) {
    dispatch(tasksThunks.updateTask({taskId,domainModel:{status},todolistId}))
  }, [])

  const changeTaskTitle = useCallback(function (taskId: string, title: string, todolistId: string) {
    dispatch(tasksThunks.updateTask({taskId,domainModel:{title},todolistId}))
  }, [])

  const changeFilter = useCallback(function (value: FilterValuesType, todolistId: string) {
    dispatch(todolistActions.changeTodolistFilter({ id: todolistId, filter: value }))
  }, [])

  const removeTodolist = useCallback(function (id: string) {
    dispatch(todosThunks.removeTodolist(id))
  }, [])

  const changeTodolistTitle = useCallback(function (id: string, title: string) {
    dispatch(todosThunks.changeTodolistTitle({id, title}))
  }, [])

  const addTodolist = useCallback(
    (title: string) => {
      dispatch(todosThunks.addTodolist(title))
    },
    [dispatch],
  )

  if (!isLoggedIn) {
    return <Navigate to={"/login"} />
  }

  return (
    <>
      <Grid container style={{ padding: "20px" }}>
        <AddItemForm addItem={addTodolist} />
      </Grid>
      <Grid container spacing={3}>
        {todolists.map((tl) => {
          let allTodolistTasks = tasks[tl.id]

          return (
            <Grid item key={tl.id}>
              <Paper style={{ padding: "10px" }}>
                <Todolist
                  todolist={tl}
                  tasks={allTodolistTasks}
                  removeTask={removeTask}
                  changeFilter={changeFilter}
                  addTask={addTask}
                  changeTaskStatus={changeStatus}
                  removeTodolist={removeTodolist}
                  changeTaskTitle={changeTaskTitle}
                  changeTodolistTitle={changeTodolistTitle}
                  demo={demo}
                />
              </Paper>
            </Grid>
          )
        })}
      </Grid>
    </>
  )
}
