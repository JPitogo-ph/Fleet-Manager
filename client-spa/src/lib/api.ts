import axios from "axios";

export const api = axios.create({ baseURL: "/" });

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = "/auth/login";
    }

    return Promise.reject(err);
  },
);
