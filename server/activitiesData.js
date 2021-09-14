let activityThreeErrorMarker = 0
let activityFourUpdateMarker = 0
const initialActivity = {
  1: {
    id: 1,
    name: 'some activity',
    person: 'some person',
    place: 'some place',
    cost: 99,
    rides: [
      {
        id: '5e3960cc-50d4-428b-ab82-bcae8d698d40',
        description: 'red car',
        sequence: 1
      },
      {
        id: '79d89f69-f953-4228-b68b-9dfff4ef2d93',
        description: 'ferry',
        sequence: 2
      },
    ],
    versionToken: '1',
  },
  2: {
    id: 2,
    name: 'slow',
    person: 'snail',
    place: 'leaf',
    cost: 8,
    rides: [],
    versionToken: '1',
  },
  3: {
    id: 3,
    name: 'error for two thirds',
    person: 'resolver',
    place: 'happy',
    cost: 3838,
    rides: [],
    versionToken: '1',
  },
  4: {
    id: 4,
    name: 'might update',
    person: 'chance',
    place: 'casino',
    cost: Math.floor(activityFourUpdateMarker / 3) + 1,
    rides: [],
    versionToken: (Math.floor(activityFourUpdateMarker / 3) + 1).toString(),
  }
}

let activities = { ...initialActivity }

let nextId = Math.max(...Object.keys(activities)) + 1

module.exports.reset = () => {
  activityThreeErrorMarker = 0
  activityFourUpdateMarker = 0
  activities = { ...initialActivity }
  nextId = Math.max(...Object.keys(activities)) + 1
}

//#region utilities for first four activities
function incrementActivityFourUpdateMarker() {
  activityFourUpdateMarker = activityFourUpdateMarker + 1
  if (activities[4]) {
    activities = {
      ...activities,
      4: {
        id: 4,
        name: 'might update',
        person: 'chance',
        place: 'casino',
        cost: (Math.floor(activityFourUpdateMarker / 3) + 1),
        versionToken: (Math.floor(activityFourUpdateMarker / 3) + 1).toString(),
      }
    }
  }
}

module.exports.callingGetActivities = () => {
  incrementActivityFourUpdateMarker()
}

module.exports.callingGetActivity = (id) => {
  if (id === 3) {
    activityThreeErrorMarker = activityThreeErrorMarker + 1
  } else if (id === 4) {
    incrementActivityFourUpdateMarker()
  }
}

module.exports.getIsThreeError = () => activityThreeErrorMarker % 3 !== 0
//#endregion utilities for tirst four activities

module.exports.getActivities = () => {
  return Object.values(activities).map(a => ({
    id: a.id,
    name: a.name,
    versionToken: a.versionToken,
  }))
}

module.exports.getActivity = (id) => {
  return activities[id]
}

const getNextIdAndIncrement = () => {
  const result = nextId
  nextId = nextId + 1
  return result
}

module.exports.addActivity = (activity) => {
  const id = getNextIdAndIncrement()
  const activityWithId = {
    ...activity,
    id,
    versionToken: '1'
  }
  activities[id] = activityWithId
  return activityWithId
}

module.exports.updateActivity = (activity) => {
  const previousActivity = activities[activity.id]
  if (!previousActivity) {
    return { status: 'not found' }
  }
  if (previousActivity.versionToken !== activity.versionToken) {
    return { status: 'version condition failed', activity: previousActivity }
  }
  const updatedActivity = {
    ...activity,
    versionToken: (parseInt(previousActivity.versionToken) + 1).toString()
  }
  activities[activity.id] = updatedActivity
  return { status: 'done', updatedActivity }
}

module.exports.deleteActivity = (id) => {
  const { [id]: deleteActivity, ...remainingActivities } = activities
  activities = remainingActivities
}