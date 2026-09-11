import axios from 'axios'

// Axios client for the FastAPI backend. In dev, Vite proxies /api to the
// backend (see vite.config.ts); in the Docker image, nginx does the same
// proxying in front of the built static files — so the default baseURL
// works unchanged in both environments.
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  const raw = localStorage.getItem('prz:v1:session')
  if (raw) {
    try {
      const { token } = JSON.parse(raw) as { token: string }
      config.headers.Authorization = `Bearer ${token}`
    } catch {
      // ignore malformed session
    }
  }
  return config
})

// FastAPI's HTTPException responses look like {"detail": "..."}. Promoting
// that into the error's `message` means every existing
// `e instanceof Error ? e.message : '...'` call site across the app already
// shows the backend's friendly Russian message without any further changes.
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error?.response?.data?.detail
    if (typeof detail === 'string') {
      error.message = detail
    }
    return Promise.reject(error)
  },
)
