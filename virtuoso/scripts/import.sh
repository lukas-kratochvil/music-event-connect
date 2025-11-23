#!/bin/bash
# See: https://vos.openlinksw.com/owiki/wiki/VOS/VirtBulkRDFLoader

ISQL_PORT=$1
# It is recommended a maximum of num_cpu_cores/2.5, to optimally parallelize the data load and hence maximize load speed.
# See section "Running multiple Loaders" in https://vos.openlinksw.com/owiki/wiki/VOS/VirtBulkRDFLoader.
PARALLEL_LOADERS=$2

SCRIPT_DIR="/import/scripts"
HELPERS_DIR="$SCRIPT_DIR/import-helpers"

echo "--- IMPORT STARTED ---"

echo "-------------------------------------"
echo "1. Preparing database..."
echo "-------------------------------------"
isql "$ISQL_PORT" dba "$DBA_PASSWORD" < "$HELPERS_DIR/prepare.sql"

echo "-------------------------------------"
echo "2. Starting parallel load..."
echo "-------------------------------------"
bash "$HELPERS_DIR/run_parallel.sh" $ISQL_PORT $PARALLEL_LOADERS

echo "-------------------------------------"
echo "3. Finalizing..."
echo "-------------------------------------"
isql "$ISQL_PORT" dba "$DBA_PASSWORD" < "$HELPERS_DIR/finalize.sql"

echo "--- IMPORT FINISHED ---"
