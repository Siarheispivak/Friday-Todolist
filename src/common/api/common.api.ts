import axios from "axios"

export const instance = axios.create({
  baseURL: "https://social-network.samuraijs.com/api/1.1/",
  withCredentials: true,
      headers: {
        "API-KEY": "133c8341-3ac2-4b32-8eb4-b1aabac621c8",
      }
})






