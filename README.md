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

## The Web App

### List and item views
The list view `Activities` lists the activities' name. The item view `Activity` shows the detail of the selected item.

### Routing
The pages are properly routed
- can navigate to the `Activities` page with [/activity](http://localhost:3000/activities).
- can navigate to an `Activity` detail page with [/activity/1](http://localhost:3000/activities/2).

## Specialized form solution
I used only redux, and did not use pre-built form solutions.

This is a specific solution, not a generic form solution.
I found it easier to
- develop a specific solution for the required end-user funtionailties, than to
- learn the ins and outs of a generic form solution, just to work around it to implement an unusual requirement.

I believe specific solutions to handle complex and unique scenarios, could be easier to understand and easier to extend. 

E.g. hard-code the path of each field, is much easier than calculating the paths of an unknown JSON object or a JSON schema.

### Form has a separate redux store
The app's redux store keeps the result of api requests and is used to show the list page.

The form has a separate redux store, primarily to organize the code, and also allows middlewares that works with editor's dispatches.

The app's store and the form's store are coordinated by the lifecycle hooks of `<ActivityEditor/>`.

## Edit history: undo redo
Customized undo and redo, and able to view the edit history of the current session (not persisted).

## Concurrency Handling
Detect changes using `versionToken`, that updates everytime the data is saved.

Merge changes, manully resolve conflicts, and save again.

### Comparison: block saving
Block saving if data was updated by someone else, would lose all local changes.

### Comparison: naive last save wins
If any save just overrides other user's changes, user might miss important changes.

### Solution
This project's implementation is also "last save wins", but the experience is improved by notifying the user, and providing change merging and conflict resolution.

## Edit history: merge and conflict resolution
see link [edit history README](./src/ActivityEditor/store/editHistory/editHistory.README.md)
