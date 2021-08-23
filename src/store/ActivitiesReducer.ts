import {
  createReducer,
  EntityState
} from '@reduxjs/toolkit'
import {
  getActivitiesSucceeded,
  getSingleActivitySucceeded,
} from './actions'

type ActivitiesState = EntityState<{
  id: number,
  name: string,
  person?: string,
  place?: string,
  cost?: number
}>

const activitiesInitialState: ActivitiesState = {
  ids: [],
  entities: {},
}

export const activitiesReducer = createReducer(activitiesInitialState, (builder) => {
  builder
    .addCase(getActivitiesSucceeded, (state, action) => {
      const { payload: { activityHeaders } } = action

      const toRemoveIds = state.ids.filter(sId => !activityHeaders.some(ah => ah.id === sId))
      const hasRemoved = toRemoveIds.length > 0
      for (const removeId of toRemoveIds) {
        delete state.entities[removeId]
      }

      let hasCreated = false
      for (const eventHeader of activityHeaders) {
        if (!(eventHeader.id in state.entities)) {
          hasCreated = true
          const newEntity = {
            id: eventHeader.id,
            name: eventHeader.name
          }
          state.entities[eventHeader.id] = newEntity
        } else {
          state.entities[eventHeader.id]!.id = eventHeader.id
          state.entities[eventHeader.id]!.name = eventHeader.name
        }
      }

      state.ids = hasCreated
        ? activityHeaders.map(eh => eh.id)
        : hasRemoved
          ? state.ids.filter((id) => id in state.entities)
          : state.ids
    })
    .addCase(getSingleActivitySucceeded, (state, action) => {
      const { payload: activity } = action
      const index = state.ids.findIndex(sId => sId === activity.id)
      if (index === -1) {
        state.ids.push(activity.id)
        state.entities[activity.id] = {
          id: activity.id,
          name: activity.name,
          person: activity.person,
          place: activity.place,
          cost: activity.cost
        }
      }
      else {
        state.entities[activity.id]!.id = activity.id
        state.entities[activity.id]!.name = activity.name
        state.entities[activity.id]!.person = activity.person
        state.entities[activity.id]!.place = activity.place
        state.entities[activity.id]!.cost = activity.cost
      }
    })
})