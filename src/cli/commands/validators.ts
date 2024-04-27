export const validateProjectName = (value: any) => {
  if (!value) {
    return 'Project name is required.'
  }

  if (value && value.search(/^[a-z0-9-]+$/) === -1) {
    return 'Only lowercase alphaneumeric characters and hyphen are allowed.'
  }
}
