import template from 'url-template'

export async function getActivitiesApiAsync() {
  let responseBody
  try {
    const response = await fetch('/api/activities')
    if (!response.ok) {
      return [false]
    }
    responseBody = await response.json()
  }
  catch (e) {
    return [false]
  }
  return [true, responseBody]
}


export const getSingleActivityUrlTemplate = '/api/job-sets/{id}'
export async function getJobSetApiAsync(id: number) {
  const url = template.parse(getSingleActivityUrlTemplate).expand({ id })
  let responseBody
  try {
    const response = await fetch(url)
    if (!response.ok) {
      return [false]
    }
    responseBody = await response.json()
  }
  catch (e) {
    return [false]
  }
  return [true, responseBody]
}
