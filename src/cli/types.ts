export interface ShellResponse {
  response?: any
  error?: {
    code: number
    message?: string
    stdout: string
    stderr: string
  }
}

export interface ToolInitResponse extends ShellResponse {
  id: string
  name: string
}

export type PromiseFactory = () => Promise<any>