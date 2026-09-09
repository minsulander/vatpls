# VatPLS

VatPLS is a webapp for keeping track of controller/position staffing, mainly during "live" events, inspired by PLS (PositionsLedningsSystem) used by LFV in Sweden. A WS panel is also available under the endpoint `/ws`.

## Controller cards layout

![image](https://github.com/user-attachments/assets/81ac962d-0792-424e-8f9a-dc057f5893f7)

## Contributing

Contributions of any kind are most welcome.

-   Please file bug reports and/or feature requests as [issues](https://github.com/minsulander/vatpls/issues).
-   Pull requests are welcome.

## For developers

The repository contains two independently installable applications: the Vue frontend in `web/` and the Express backend in `api/`.

### Frontend

The frontend requires an env variable to be set. From `web/`, copy `.env.example` to `.env` and change the password to your desired value. This password is used to log in to the WS panel. Then install and start the frontend:

```sh
cd web
npm install
npm start
```

### Backend

The backend must be run separately using the provided PostgreSQL Docker image. Detailed setup instructions are available in [`api/`](api/README.md).
