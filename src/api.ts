import template from 'url-template'

export async function getActivitiesApiAsync() {
  let responseBody
  try {
    const response = await fetch('/api/activities')
    if (!response.ok) {
      return [false]
    }
    // console.log(await response.text())
    responseBody = await response.json()
  }
  catch (e) {
    alert(e)
    return [false]
  }
  return [true, responseBody]
}

export const getSingleActivityUrlTemplate = '/api/activities/{id}'
export async function getSingleActivityApiAsync(id: number) {
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
