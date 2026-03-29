import { createSlice } from "@reduxjs/toolkit";

let tokenFromStorage = null;
let userFromStorage = null;

if (typeof window !== "undefined") {
  tokenFromStorage = window.localStorage.getItem("edutrack_token");

  const rawUser = window.localStorage.getItem("edutrack_user");
  if (rawUser && rawUser !== "undefined") {
    try {
      userFromStorage = JSON.parse(rawUser);
    } catch {
      userFromStorage = null;
      window.localStorage.removeItem("edutrack_user");
    }
  }
}

const initialState = {
  token: tokenFromStorage || null,
  user: userFromStorage
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess(state, action) {
      state.token = action.payload.token;
      state.user = action.payload.user;

      if (typeof window !== "undefined") {
        window.localStorage.setItem("edutrack_token", state.token);
        window.localStorage.setItem(
          "edutrack_user",
          JSON.stringify(state.user)
        );
      }
    },
    logout(state) {
      state.token = null;
      state.user = null;

      if (typeof window !== "undefined") {
        window.localStorage.removeItem("edutrack_token");
        window.localStorage.removeItem("edutrack_user");
      }
    }
  }
});

export const { loginSuccess, logout } = authSlice.actions;

export default authSlice.reducer;