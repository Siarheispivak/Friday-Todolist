import axios from "axios"

export const instance = axios.create({
  baseURL: "https://social-network.samuraijs.com/api/1.1/",
  withCredentials: true,
      headers: {
        "API-KEY": "4af8540c-fb7f-4846-aa94-372b8dfecddf",
      }
})






