export const checkIsValidPythonVarName = (value: string): boolean => {
  if (!value) return false

  return /^[a-z_]$/.test(value[0]) && /^[a-z0-9_]+$/.test(value)
}

export const validateLowerKebabCase = (value: any) => {
  if (value && value.search(/^[a-z0-9-]+$/) === -1) {
    return 'Only lowercase alphaneumeric characters and hyphen are allowed.'
  }
}

export const validateProjectName = (value: any) => {
  if (!value) {
    return 'Project name is required.'
  }

  if (value && !checkIsValidPythonVarName(value)) {
    return 'Only lowercase alphaneumeric characters and underscore are allowed.'
  }
}
