# app-and-editor
Proof of concept of job-shop-collection's Job Set Editor's edit history and interactions with other parts of the app.

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
  the form loads data from a server.
- read-only mode\
  the user might want to view only.
- edit history\
  allow the users to undo or redo. (Does not save versions on the server)
- multiple users editing at the same time\
  when the user saves, detect if the data was changed by other users and have means to resolve conflicts.

Note: does not include real-time auto-saving or real-time collaboration.

## Concurrency Handling
Detect changes using `versionToken`, that updates everytime the data is saved.

Merge changes, manully resolve conflicts, and save again.

### Comparison: block saving
Block saving if data was updated by someone else would lose all local changes.

### Comparison: naive last save wins
If any save just overrides other user's changes, user might miss important changes.

This project's implementation is also "last save wins", but the experience is improved by notifying the user, and providing change merging and conflict resolution.

//////////////////////////////////

### Example: use local

### Example: merge changes

### Example: merge changes with conflict resolution(apply/unapply + manual edit)

### Example: discard local changes

## Specialized form solution
I did no attempt to make a generic form solution.

E.g. hard-code the path of each field is much easier than calculating the paths from an unknown JSON object.

// todo lifecycle flow of refreshed
// todo lifecycle flow of create