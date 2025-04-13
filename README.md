# ChoirTrack

A digital solution for tracking physical choir sheet music and recording when songs have been performed during church services.

## Overview

ChoirTrack helps choir directors maintain an inventory of physical sheet music distributed to choir members while keeping a historical record of when each song was performed in church. This eliminates the need for manual record-keeping and makes it easy to answer questions like "When was the last time we sang this song?".

## Database Setup

This application can be configured to connect to a database in two ways. Modify the `.env` file and ensure the Prisma schema (`prisma/schema.prisma`) points to the correct datasource URLs to switch configurations.

1. **Supabase (Current):** Connects to a PostgreSQL database hosted on Supabase.
    * Ensure the following variables are set in your `.env` file (replace placeholders with your actual credentials, remembering to URL-encode special characters in the password):

        ```properties
        # Connect to Supabase via connection pooling.
        DATABASE_URL="postgresql://postgres.[YOUR_PROJECT_ID]:[URL_ENCODED_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

        # Direct connection to the database. Used for migrations.
        DIRECT_URL="postgresql://postgres.[YOUR_PROJECT_ID]:[URL_ENCODED_PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
        ```

    * Your `prisma/schema.prisma` file should use the datasource block that includes `directUrl`:

        ```prisma
        datasource db {
          provider  = "postgresql"
          url       = env("DATABASE_URL")
          directUrl = env("DIRECT_URL") // For migrations
        }
        ```

2. **Docker (Alternative):** Run a local PostgreSQL database using Docker.
    * You would need a `docker-compose.yml` file (not included in this project yet) to define the PostgreSQL service. Uncomment and configure the following variables in your `.env` file:

        ```properties
        DATABASE_URL="postgresql://user:password123@localhost:5432/choirtrack" # Adjust port if needed

        POSTGRES_USER=user
        POSTGRES_PASSWORD=password123
        POSTGRES_DB=choirtrack
        ```

    * Your `prisma/schema.prisma` file should use the simpler datasource block:

        ```prisma
        datasource db {
          provider = "postgresql"
          url      = env("DATABASE_URL")
        }
        ```

    *Note: The `DIRECT_URL` environment variable and the `directUrl` field in the schema are typically not needed for a local Docker setup unless you configure a separate pooling mechanism.*
