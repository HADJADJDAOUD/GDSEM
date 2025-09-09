import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/api";

/**
 * Assumes POST /login returns { token, user }.
 * If your backend returns different shape, adapt here.
 */
export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }, thunkAPI) => {
    try {
      
      const res = await api.post("/login", { email, password });
      
      // expected: res.data = { token, user }
      console.log("login response:", res.data.data.user);
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Login failed";
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

const initialState = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("token") || null,
  status: "idle",
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.status = "idle";
      state.error = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        // The API response is nested, so we access the data.
        const { token, data } = action.payload;
        const { user } = data;

        // Extract specific fields you want to store
        const { username, email, endDate } = user;

        state.status = "succeeded";
        state.token = token;
        // You can store the full user object in the Redux state if needed
        state.user = user;
        state.error = null;

        // Persist data to local storage
        if (token) {
          localStorage.setItem("token", token);
        }
        if (username) {
          localStorage.setItem("username", username);
        }
        if (email) {
          localStorage.setItem("email", email);
        }
        if (endDate) {
          localStorage.setItem("endDate", endDate);
        }

        // Also, update the main user object in local storage to be safe
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Login failed";
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
