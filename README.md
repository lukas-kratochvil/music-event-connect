# Music-Event-Connect

## Table of contents
- [Initial setup](#initial-setup)
  - [Apps](#apps)
  - [Virtuoso triple store](#virtuoso-triple-store)
    - [Import data from MusicBrainz and OpenStreetMap](#import-data-from-musicbrainz-and-openstreetmap)
    - [Create users](#create-users)
    - [Clearing RDF graphs](#clearing-rdf-graphs)

## Initial setup

### Apps
More in app-specific READMEs:
- [Scraper](./apps/scraper/README.md)
- [Handler](./apps/handler/README.md)
- [API](./apps/api/README.md)
- [Web](./apps/web/README.md)

### Virtuoso triple store
#### Import data from MusicBrainz and OpenStreetMap
Firstly, adjust the values of the env variables `VIRT_Parameters_NumberOfBuffers` and `VIRT_Parameters_MaxDirtyBuffers` in the `docker-compose.yml`. Set `VIRT_Parameters_MaxDirtyBuffers` to a max of 50 % of total buffers (value `VIRT_Parameters_NumberOfBuffers`) and a max of 1 GB. Then restart the `virtuoso` service. After successful import, change these env vars back to one of the recommended settings listed in the `virtuoso.ini` and restart `virtuoso`.

There is [import.sh](./virtuoso/scripts/import.sh) script to load initial data which uses [import-helpers](./virtuoso/scripts/import-helpers/). **Please, change the parameters, graph names etc. as you need.**
The command below can be used to load Virtuoso with initial RDF data (MusicBrainz, OSM CZE, etc.).
For `<NUM_OF_PARALLEL_LOADERS>` is recommended a maximum of **num_cpu_cores/2.5**, to optimally parallelize the data load and hence maximize load speed. See section [Running multiple Loaders](https://vos.openlinksw.com/owiki/wiki/VOS/VirtBulkRDFLoader).
You should specify RDF files to be loaded to Virtuoso in the [prepare-import](./virtuoso/scripts/import-helpers/prepare.sql) file.
```bash
docker compose exec -it virtuoso bash //import/scripts/import.sh <ISQL_PORT> <NUM_OF_PARALLEL_LOADERS>
```

Virtuoso may display warnings like the one shown below, but there is no need to worry. It simply means that Virtuoso attempted to preload data pages from disk into RAM, but the operation failed, and these pages will be loaded normally later.
```
*** read-ahead of a free or out of range page dp L=147624, database not necessarily corrupted.
```

To check if all the RDF files were successfully loaded, SQL command below can be run in the **Virtuoso Conductor** (Web UI):
```sql
SELECT * FROM DB.DBA.LOAD_LIST
```

#### Create users

Use **Virtuoso ISQL interface** to create users that will access the triple store:
1. `MEC_HANDLER` - updates and queries

```sql
-- Create the user
DB.DBA.USER_CREATE('MEC_HANDLER', '<PASSWORD>');

-- Grant roles
GRANT "SPARQL_SELECT" TO "MEC_HANDLER";
GRANT "SPARQL_UPDATE" TO "MEC_HANDLER";

-- Set RDF graphs permissions (1 = Read, 2 = Write, 4 = Sponge)
DB.DBA.RDF_GRAPH_USER_PERMS_SET('http://music-event-connect.cz/events/goout', 'MEC_HANDLER', 3);
DB.DBA.RDF_GRAPH_USER_PERMS_SET('http://music-event-connect.cz/events/ticketmaster', 'MEC_HANDLER', 3);
DB.DBA.RDF_GRAPH_USER_PERMS_SET('http://music-event-connect.cz/events/ticketportal', 'MEC_HANDLER', 3);
DB.DBA.RDF_GRAPH_USER_PERMS_SET('http://music-event-connect.cz/links', 'MEC_HANDLER', 3);
DB.DBA.RDF_GRAPH_USER_PERMS_SET('http://music-event-connect.cz/musicbrainz', 'MEC_HANDLER', 1);
```
- Go to **Virtuoso Conductor** (Web UI) and in the `"System Admin" -> "User Accounts" -> "Users"` set MEC_HANDLER's `"User type"` to `SQL/ODBC and WebDAV` (required for SPARQL Update).

2. `MEC_API` - only queries

```sql
-- Create the user
DB.DBA.USER_CREATE ('MEC_API', '<PASSWORD>');

-- Grant roles
GRANT "SPARQL_SELECT" TO "MEC_API";
GRANT "SPARQL_SELECT_FED" TO "MEC_API";

-- Set RDF graphs permissions (1 = Read, 2 = Write, 4 = Sponge)
DB.DBA.RDF_GRAPH_USER_PERMS_SET('http://music-event-connect.cz/events/goout', 'MEC_API', 1);
DB.DBA.RDF_GRAPH_USER_PERMS_SET('http://music-event-connect.cz/events/ticketmaster', 'MEC_API', 1);
DB.DBA.RDF_GRAPH_USER_PERMS_SET('http://music-event-connect.cz/events/ticketportal', 'MEC_API', 1);
DB.DBA.RDF_GRAPH_USER_PERMS_SET('http://music-event-connect.cz/links', 'MEC_API', 1);
DB.DBA.RDF_GRAPH_USER_PERMS_SET('http://music-event-connect.cz/musicbrainz', 'MEC_API', 1);
DB.DBA.RDF_GRAPH_USER_PERMS_SET('http://music-event-connect.cz/osm/cze', 'MEC_API', 1);
```

To delete user permissions use (in the **Virtuoso Conductor** (Web UI)):
```sql
DB.DBA.RDF_GRAPH_USER_PERMS_DEL('<GRAPH_IRI>', '<USER_NAME>');
```

#### Clearing RDF graphs
In the **Virtuoso ISQL interface** run:
```sql
SPARQL CLEAR GRAPH <GRAPH_IRI>
```
