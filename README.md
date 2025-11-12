# VatPLS

VatPLS is a webapp for keeping track of controller/position staffing, mainly during "live" events, inspired by PLS (PositionsLedningsSystem) used by LFV in Sweden. A WS panel is also available under the endpoint `/ws`.

## Controller cards layout

![image](https://github.com/user-attachments/assets/81ac962d-0792-424e-8f9a-dc057f5893f7)

## Contributing

Contributions of any kind are most welcome.

-   Please file bug reports and/or feature requests as [issues](https://github.com/minsulander/vatpls/issues).
-   Pull requests are welcome.

## For developers

It's a fairly straight-forward [Vue3](https://vuejs.org) + [Vuetify](https://vuetifyjs.com) + [Vue-draggable-plus](https://github.com/Alfred-Skyblue/vue-draggable-plus) project.

### Frontend

The frontend requires an env variable to be set. Copy the `.env.example` file, rename it to `.env`, and change the password to your desired value. This password is used to login in the ws panel. Then install and start the frontend:

```sh
npm install
npm start
```

### Backend

The backend API must be run separately using the provided PostgreSQL Docker image. Detailed setup instructions are available in the API/ directory.
