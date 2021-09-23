export type FormData = {
  name: string,
  who: string,
  where: string,
  howMuch?: number,
  rides: {
    ids: string[],
    entities: {
      [id: string]: {
        id: string,
        description: string
      }
    }
  }
}

export type FieldChange = {
  path: string,
  previousValue: any,
  newValue: any,
}

export type GroupedFieldChanges = FieldChange[]

export type Operation = {
  type: 'edit' | 'merge' | 'conflict' | 'reverse local',
  fieldChanges: FieldChange[],
  conflictName?: string,
  conflictApplied?: boolean, // need this to preserve the selection when toggling 'merge' and 'discard local changes',
  applied: boolean,
}

export type Step = {
  name: string,
  operations: Operation[],
  versionToken?: string,
  mergeBehaviour?: 'merge' | 'discard local changes',
  saveStatus?: 'saving' | 'saved',
}