import {
  createReducer,
  EntityState
} from '@reduxjs/toolkit'
import {
  deletedActivity,
  getActivitiesSucceeded,
  fetchedActivity,
} from './actions'

export type ActivitiesState = EntityState<{
  id: number,
  name: string,
  versionToken: string,
  person?: string,
  place?: string,
  cost?: number,
  hasDetail: boolean,
}>

const activitiesInitialState: ActivitiesState = {
  ids: [],
  entities: {},
}

export const activitiesReducer = createReducer(activitiesInitialState, (builder) => {
  builder
    .addCase(getActivitiesSucceeded, (state, { payload: { activityHeaders } }) => {
      const toRemoveIds = state.ids.filter(sId => !activityHeaders.some(ah => ah.id === sId))
      const hasRemoved = toRemoveIds.length > 0
      for (const removeId of toRemoveIds) {
        delete state.entities[removeId]
      }

      let hasCreated = false
      for (const activityHeader of activityHeaders) {
        if (!(activityHeader.id in state.entities)) {
          hasCreated = true
          const newEntity = {
            id: activityHeader.id,
            name: activityHeader.name,
            versionToken: activityHeader.versionToken,
            hasDetail: false
          }
          state.entities[activityHeader.id] = newEntity
        } else if (activityHeader.versionToken !== state.entities[activityHeader.id]!.versionToken) {
          state.entities[activityHeader.id]!.id = activityHeader.id
          state.entities[activityHeader.id]!.name = activityHeader.name
          state.entities[activityHeader.id]!.versionToken = activityHeader.versionToken
          state.entities[activityHeader.id]!.person = undefined
          state.entities[activityHeader.id]!.place = undefined
          state.entities[activityHeader.id]!.cost = undefined
          state.entities[activityHeader.id]!.hasDetail = false
        }
      }

      state.ids = hasCreated || hasRemoved
        ? activityHeaders.map(eh => eh.id)
        : state.ids
    })
    .addCase(fetchedActivity, (state, { payload: activity }) => {
      const index = state.ids.findIndex(sId => sId === activity.id)
      if (index === -1) {
        state.ids.push(activity.id)
        const newEntity = {
          id: activity.id,
          name: activity.name,
          versionToken: activity.versionToken,
          person: activity.person,
          place: activity.place,
          cost: activity.cost,
          hasDetail: true,
        }
        state.entities[activity.id] = newEntity
      }
      else {
        state.entities[activity.id]!.id = activity.id
        state.entities[activity.id]!.name = activity.name
        state.entities[activity.id]!.versionToken = activity.versionToken
        state.entities[activity.id]!.person = activity.person
        state.entities[activity.id]!.place = activity.place
        state.entities[activity.id]!.cost = activity.cost
        state.entities[activity.id]!.hasDetail = true
      }
    })
    .addCase(deletedActivity, (state, action) => {
      const { payload: id } = action
      const index = state.ids.findIndex(sId => sId === id)
      if (index !== -1) {
        state.ids.splice(index, 1)
        delete state.entities[id]
      }
    })
})