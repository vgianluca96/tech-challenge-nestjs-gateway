# Tech Challenge - Gatweway Application

This is a backend application that acts as a Gateway that redirects requests to a target backend application, whose URL can be configured in environment variables.

## Quick setup

* Clone the repo
* run `npm install`
* set the .env file as follows (**IMPORTANT**: a MongoDB Atlas instance is required)

```
PORT=<the port you prefer, if omitted the default will be 8080>
MONGODB_URI=mongodb+srv://<user_username>:<user_password>@<your_cluster>.mongodb.net/<database_name>
JWT_SECRET=<put a secret key for JWT validation>
AUTH_SERVICE_URL=<the URL assigned to the auth microservice>
```

* run `npm run start:dev` for local/development environment, or `npm run build && npm run start:prod` for production build


## Techonologies

* Nestjs to build the app
* MongoDB for data persistence
