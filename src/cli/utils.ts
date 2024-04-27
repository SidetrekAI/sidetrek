import * as R from 'ramda'
import chalk from 'chalk'
import { S_BAR } from './constants'

export const startStopwatch = (): number => {
  return new Date().getTime()
};

export const endStopwatch = (startTime: number): number => {
  const endTime = new Date().getTime()
  const timeDiff = endTime - startTime
  return parseFloat(timeDiff.toFixed(2))
}

interface NormalizeEntitiesOptionArgs {
  selectId?: (selector: any) => any
}

// [{ id: '', ... }] -> { ids: [], entities: { [id]: entity, ... } }
// Takes optional selectId fn to specify which key should be the id (defaults to id)
export const normalizeEntities = (
  data: any[],
  { selectId = ({ id }) => id }: NormalizeEntitiesOptionArgs = {}
): any => {
  if (!data) return null

  if (R.isEmpty(data)) {
    return { ids: [], entities: {} }
  }

  return {
    ids: R.map(selectId, data),
    entities: R.reduce((prev, curr: any) => R.mergeAll([prev, { [selectId(curr)]: curr }]), {})(data),
  }
}

interface ClackLogOptions {
  prefix?: string
  suffix?: string
}

export const applyClackStyle = (str: string, options?: ClackLogOptions): string => {
  const { prefix, suffix } = options || {}

  const clackStyleStr = chalk.gray(S_BAR) + `  ${str}`

  if (prefix && suffix) {
    return `${prefix}${clackStyleStr}${suffix}`
  }

  if (prefix) {
    return `${prefix}${clackStyleStr}`
  }

  if (suffix) {
    return `${clackStyleStr}${suffix}`
  }

  return clackStyleStr
}

export const clackLog = (str: string, options?: ClackLogOptions): void => {
  console.log(applyClackStyle(str, options))
}