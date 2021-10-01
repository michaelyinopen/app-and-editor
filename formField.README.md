# Changes required to add a form field

App store state
API types
- setActivityFromAppStore(not loaded)
- setActivityFromAppStore (loaded) (hasDetail)
  - formData
  - initialized
  - versions
- edit
  - formData update
  - step
    - combine field changes
    - undo
    - redo
- refreshed setActivityFromAppStore (initialized)
  - merge/ reverse local
  - related to conflict
- save

- refreshed data
  - refreshed step(different local/remote changes)

Check the [edit pattern](./src/ActivityEditor/store/editHistory/editHistory.README.md#edit-patterns)