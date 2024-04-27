import { $ } from 'bun'
import chalk from 'chalk'
import type { ShellResponse } from '../types'
import { clackLog } from '../utils'
import { colors } from '../constants'

const log = console.log

export const installPoetry = async (): Promise<ShellResponse> => {
  try {
    let counter = 0

    for await (let line of $`pip install poetry`.lines()) {
      if (counter === 0) {
        clackLog('', { prefix: '\n' })
      }

      clackLog(colors.lightGray(line))
      counter++
    }

    return {
      response: 'Poetry successfully installed!',
    }
  } catch (err: any) {
    return {
      error: {
        code: err.exitCode,
        stderr: err.stderr.toString(),
        stdout: err.stdout.toString(),
      },
    }
  }
}

export const buildProject = async (dataStack: string[]): Promise<void> => {
  // Run poetry new

  // Initialize each tool in the data stack


}

export const initTool = async (tool: string): Promise<boolean> => {
  // Run `poetry add`

  // Create a docker-compose.yml file

  // Edit Dockerfile (if required)

  return false
}