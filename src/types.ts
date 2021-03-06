export type ActivityHeader = {
  id: number,
  name: string,
  versionToken: string,
}

export type Activity = {
  id: number,
  name: string,
  person: string,
  place: string,
  cost: number,
  rides: Ride[],
  versionToken: string,
}

export type Ride = {
  id: string,
  description: string,
  sequence: number
}