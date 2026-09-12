import { http } from './http'

export interface TranscribeMeetingResult {
  transcript: string
  summaryMarkdown: string
}

export const aiService = {
  async transcribeMeeting(employeeId: string, audio: File): Promise<TranscribeMeetingResult> {
    const form = new FormData()
    form.append('employeeId', employeeId)
    form.append('audio', audio)
    const { data } = await http.post<TranscribeMeetingResult>('/ai/meetings/transcribe', form, {
      timeout: 5 * 60 * 1000, // CPU-only Whisper on a small server can take a while
    })
    return data
  },
}
