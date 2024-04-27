export interface ShellResponse {
  response?: string
  error?: {
    code: number
    stdout: string
    stderr: string
  }
}