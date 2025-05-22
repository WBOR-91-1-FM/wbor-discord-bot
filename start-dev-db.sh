# starts a docker postgres container on postgresql://postgres:mysecretpassword@127.0.0.1:5432/postgres
docker start wbor-dev-postgres || docker run --name wbor-dev-postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgres:latest
bun run db:push