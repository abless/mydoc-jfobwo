# WHY - Vision and Purpose

I want you to build a React native app that allows users to talk to a LLM as if it were their personal doctor. It will be better tailored to them since the app will have a lot of context about the user's health data. Users will use the app to get health advice that takes into account their personal health and offer insights on how to better take care of their bodies.

# WHAT - Core Requirements

The system should:

- allow users to input their personal health data - meals they've been taking, lab results they've received, symptoms they've had. 

- allow users to search through their previously submitted health data

- allow users to chat with a LLM about their health data

- implement authentication via email and password

There are two components to this product:

1. a react native app - this is the frontend app that users will interact with.

2. a backend service - this should be written in Express using typescript. 

## React native app

This application should use a bottom navigation tab that looks like this:

Chat | Health Log | + (big button) | Insights | Profile

The default screen should be the chat tab. This should display a chat interface that allows users to talk to a LLM. The + button is the hero action and should bring up a couple of different ways a user might want to add health data: they might want to add a meal (by taking a picture of the food) or they might want to add a lab test (again by taking a picture), or they might want to tell the LLM (via voice) how they're feeling (for example, they might want to say that they've been sick for the last copule days and describe the symptoms). The health log screen should capture what users previously input. It should feature a date picker on top and a search bar and should display the data that was logged for that day. The insights tab should be empty for now. The profile tab should indicate general user information as well as an option to log out. The whole app should be wrapped in an authz workflow that force users to login/signup before proceeding. Authentication will communicate with the backend service (described below) and use JWT tokens for authentication. 

## Backend service

This should be written in Express. Data should be stored in MongoDB. APIs to expose are:

POST /api/authz/signup - takes an email and password and creates a user if the email doesn't already exist

POST /api/authz/login - authenticates a user via email and password

POST /api/health - adds a new health information for a given user (identified via bearer token) to the database. This health information could be a meal, a symptom or a lab result.

GET /api/health - returns a user's health data in a paginated fashion, while allowing to jump to a given date.

POST /api/chat - starts a new chat with the LLM doctor