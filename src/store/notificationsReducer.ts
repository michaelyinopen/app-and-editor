import { createReducer } from "@reduxjs/toolkit";
import { addNotification, clearNotifications } from "./actions";

export const notificationsReducer = createReducer([] as string[], (builder) => {
  builder
    .addCase(addNotification, (state, { payload }) => {
      state.push(payload)
    })
    .addCase(clearNotifications, () => {
      return []
    })
})