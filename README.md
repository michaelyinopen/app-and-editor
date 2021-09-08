# app-and-editor
Proof of concept of job-shop-collection's Job Set Editor's interactions with other parts of the app.

## Run with MSW mocked responses
Can query but will not save.
```
npm start
```

## Run with a server
Can query and save.
```
npm run start-server
npm run start-web
```

## Motivation
A business application's form should be different from a questionaire input form.
The situation of concern is a form that displays information, while allowing user to edit the data.

Features beyond inputting data:

- load data\
  the form loads data from a server
- read-only mode\
  the user might want to view only
- edit history\
  allow the users to undo or redo. (Does not save versions on the server)
- multiple users editing at the same time\
  when the user saves, detect if the data was changed by other users and have means to resolve

Note: does not include real-time auto-saving or real-time collaboration.

## Concurrency Handling
Detect changes using `versionToken`, that updates everytime the data is saved.

Merge changes, manully resolve conflicts, and save again.

### Vs block saving

### Vs naive last save wins

## Collaborative Editing?

### Version Token
Token for a specific version. If data changed, version token will change, therefore can detect change by comparing the version tokens.

### Field

#### Collection Field

### Operation
Field change (might be merged, e.g.typing)

### Special Steps
insert
delete
re-order

### Step

### Merge steps
reorder might merge multiple operations

### Operational Transformation
before and after states -> operations