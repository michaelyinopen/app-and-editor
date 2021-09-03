import template from 'url-template'
import { Activity, ActivityHeader } from './types'

export async function resetServer() {
  await fetch('/api/reset', {
    method: "POST",
  })
}

export async function getActivitiesApiAsync() {
  let responseBody: ActivityHeader[]
  try {
    const response = await fetch('/api/activities')
    if (!response.ok) {
      return [false]
    }
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

export type UpdateActivityResponseBody = {
  status: 'done' | 'not found' | 'version condition failed'
  activity?: Activity //activity after update, or latest activity if versionConditionFailed
  updatedActivity?: Activity
}

export const updateActivityUrlTemplate = '/api/activities/{id}'
export async function updateActivityApiAsync(id: number, activity: Activity) {
  const url = template.parse(updateActivityUrlTemplate).expand({ id })
  let responseBody: UpdateActivityResponseBody
  try {
    const init = {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(activity)
    }
    const response = await fetch(url, init)
    if (!response.ok) {
      return [false, undefined]
    }
    responseBody = await response.json()
  }
  catch (e) {
    return [false]
  }
  return [true, responseBody]
}

export const deleteActivityUrlTemplate = '/api/activities/{id}'
export async function deleteActivityApiAsync(id: number) {
  const url = template.parse(deleteActivityUrlTemplate).expand({ id })
  try {
    const init = {
      method: "DELETE"
    }
    const response = await fetch(url, init)
    if (!response.ok) {
      return false
    }
  }
  catch (e) {
    return false
  }
  return true
}