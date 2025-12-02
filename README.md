# Music-Event-Connect

## Initial setup


### Virtuoso
#### Import data from MusicBrainz and OpenStreetMap
Firstly, adjust the values of the env variables `VIRT_Parameters_NumberOfBuffers` and `VIRT_Parameters_MaxDirtyBuffers` in the `docker-compose.yml`. Set `VIRT_Parameters_MaxDirtyBuffers` to a max of 50 % of total buffers (value `VIRT_Parameters_NumberOfBuffers`) and a max of 1 GB. Then restart the `virtuoso` service. After successful import, change these env vars back to one of the recommended settings listed in the `virtuoso.ini` and restart `virtuoso`.

There is [import.sh](./virtuoso/scripts/import.sh) script to load initial data which uses [import-helpers](./virtuoso/scripts/import-helpers/). **Please, change the parameters, graph names etc. as you need.**
The command below can be used to load Virtuoso with initial RDF data (MusicBrainz, OSM CZE, etc.).
For `<NUM_OF_PARALLEL_LOADERS>` is recommended a maximum of **num_cpu_cores/2.5**, to optimally parallelize the data load and hence maximize load speed. See section [Running multiple Loaders](https://vos.openlinksw.com/owiki/wiki/VOS/VirtBulkRDFLoader).
You should specify RDF files to be loaded to Virtuoso in the [prepare-import](./virtuoso/scripts/import-helpers/prepare.sql) file.
```bash
docker exec -it <VIRTUOSO_CONTAINER> bash //import/scripts/import.sh <ISQL_PORT> <NUM_OF_PARALLEL_LOADERS>
```

Virtuoso may display warnings like the one shown below, but there is no need to worry. It simply means that Virtuoso attempted to preload data pages from disk into RAM, but the operation failed, and these pages will be loaded normally later.
```
*** read-ahead of a free or out of range page dp L=147624, database not necessarily corrupted.
```

To check if all the RDF files were successfully loaded, SQL command below can be run in the **Virtuoso Conductor** (Web UI):
```sql
SELECT * FROM DB.DBA.LOAD_LIST
```

You can check database integrity but it might be a long-running process:
```bash
docker exec -i <VIRTUOSO_CONTAINER> isql <ISQL_PORT> dba <DBA_PASSWORD> exec="DB.DBA.integrity();"
```

#### Create app user
1. In the **Virtuoso Conductor** (Web UI), create a new application user (**System Admin** -> **User Accounts**) with the `SQL/ODBC and WebDAV` user type and the `SPARQL_UPDATE` role.
2. Allow RDF graph-level permissions (read, write, sponge) for Events RDF graph:
```sql
DB.DBA.RDF_GRAPH_USER_PERMS_SET ('http://music-event-connect.cz/events/cze', <USER_NAME>, 7);
```

Created user will be used by backend apps to access and query the triple store.
