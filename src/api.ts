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

export async function getSingleActivityApiAsync(id: number) {
  let responseBody
  try {
    const url = template.parse('/api/activities/{id}').expand({ id })
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

export async function createActivityApiAsync(activity: Partial<Activity>) {
  let responseBody
  try {
    const init = {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(activity)
    }
    const response = await fetch('/api/activities', init)
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

export type UpdateActivityResponseBody = {
  status: 'done' | 'not found' | 'version condition failed'
  activity?: Activity //activity after update, or latest activity if versionConditionFailed
  updatedActivity?: Activity
}

export async function updateActivityApiAsync(id: number, activity: Activity) {
  let responseBody: UpdateActivityResponseBody
  try {
    const url = template.parse('/api/activities/{id}').expand({ id })
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

export async function deleteActivityApiAsync(id: number) {
  try {
    const url = template.parse('/api/activities/{id}').expand({ id })
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