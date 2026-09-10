The VATPLS api runs on a **postgres** database and uses **pgadmin** to make server administration more easy. These services are run in a container and therefore requires:

-   Docker compose.

Launching the database:

1. Navigate to the `api/` folder, copy `.env.example` to `.env`, and replace every
   `replace-with-...` value. You can generate passwords with `openssl rand -base64 32`.

```
POSTGRES_PASSWORD=replace-with-a-strong-random-password
POSTGRES_USER=postgres
POSTGRES_DB=vatpls
PGADMIN_DEFAULT_EMAIL=vatpls@vatpls.se
PGADMIN_DEFAULT_PASSWORD=replace-with-a-different-strong-random-password
PGUSER=postgres
PGPASSWORD=use-the-same-value-as-POSTGRES_PASSWORD
PGDATABASE=vatpls
PLS_PASSWORD=replace-with-a-strong-random-password
```

Protect the file after creating it:

```sh
chmod 600 .env
```

For an existing database volume, changing `POSTGRES_PASSWORD` in `.env` does not
change the stored database password. Rotate it interactively first:

```sh
docker exec -it postgres_container psql -U postgres -d vatpls -c '\password postgres'
```

Then put the same new value in `POSTGRES_PASSWORD` and `PGPASSWORD`. Change an
existing pgAdmin password through pgAdmin's user menu; its environment variable
also only initializes a new pgAdmin volume.

2. Run `docker compose up -d`. This downloads the pinned images, initializes the
   database when needed, and launches both services.

3. Both published ports listen only on `127.0.0.1`. On the same machine, pgAdmin
   is available at `http://127.0.0.1:15433`.

   From another machine, connect through SSH:

```sh
ssh -L 15433:127.0.0.1:15433 your-user@your-vps
```

   Keep that session open and browse to `http://127.0.0.1:15433` locally.

4. To connect the admin panel to postgres database click on "Add New Server" and fill in a name. In the connection tab:
    - host name/address = `postgres_db`
    - port = `5432`
    - username = postgres (or as you filled in .env POSTGRES_USER)
    - password = the value in `.env` POSTGRES_PASSWORD

Database should now be running locally.
