The VATPLS api runs on a **postgres** database and uses **pgadmin** to make server administration more easy. These services are run in a container and therefore requires:

- Docker compose.

Launching the database:

1. navigate to /API folder and copy following to a .env file:

```
POSTGRES_PASSWORD=password
POSTGRES_USER=postgres
POSTGRES_DB=vatpls
PGADMIN_DEFAULT_EMAIL=vatpls@vatpls.se
PGADMIN_DEFAULT_PASSWORD=vatpls01
```

(You can change any of these values)

2. run `docker compose up`, this will download the database and launch it.

3. in a browser go to: "localhost:15433", this will open the pgadmin panel, if you have entered the same values as above the login is: "vatpls@vatpls.se" and "vatpls01" for the email and password respectivly.

4. To connect the admin panel to postgres database click on add server and fill in a name and for the connection fill in the values. 

Getting the host ip: run following command in terminal: `docker inspect postgres_container`, look for the IPAddress value. 