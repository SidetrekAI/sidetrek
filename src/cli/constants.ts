import chalk from 'chalk'
import isUnicodeSupported from 'is-unicode-supported'

export const colors = {
  sidetrekPink: chalk.hex('#fd6795'),
  sidetrekYellow: chalk.hex('#ffcc5a'),
  sidetrekPurple: chalk.hex('#9c85fc'),
  lightGray: chalk.hex('#a1a1a1'),
}

const unicode = isUnicodeSupported()
const s = (c: string, fallback: string) => (unicode ? c : fallback)
export const S_BAR = s('│', '|')
