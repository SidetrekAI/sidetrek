export const validateLowerKebabCase = (value: any) => {
  if (value && value.search(/^[a-z0-9-]+$/) === -1) {
    return 'Only lowercase alphaneumeric characters and hyphen are allowed.'
  }
}
