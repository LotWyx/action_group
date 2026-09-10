import axios from 'axios'

// Pre-wired axios client for the future FastAPI backend. Not used yet —
// every src/api/*Service.ts currently talks to the localStorage mock layer.
// Swapping a service to real HTTP later means replacing its body with calls
// through this client; consuming stores/components stay untouched.
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
