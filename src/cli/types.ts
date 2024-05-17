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

export interface EnvFileObj {
  [key: string]: string
}

export interface SidetrekConfig {
  [key: string]: SidetrekConfigServices
}

export interface SidetrekConfigServices {
  [key: string]: SidetrekConfigService
}

export interface SidetrekConfigService {
  title: string
  description?: string
  port?: string
}
