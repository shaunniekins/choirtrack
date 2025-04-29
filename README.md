# ChoirTrack

A digital solution for tracking physical choir sheet music and recording when songs have been performed during church services.

## Overview

ChoirTrack helps choir directors maintain an inventory of physical sheet music distributed to choir members while keeping a historical record of when each song was performed in church. This eliminates the need for manual record-keeping and makes it easy to answer questions like "When was the last time we sang this song?".

## Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) (v15 with Turbopack)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **UI:** [React](https://react.dev/) (v19)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) (v4)
* **UI Components:** [Shadcn/ui](https://ui.shadcn.com/) (built on Radix UI primitives)
* **Database ORM:** [Prisma](https://www.prisma.io/)
* **Database:** [PostgreSQL](https://www.postgresql.org/) (via Supabase or Docker)

## Getting Started

1. **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd choirtrack
    ```

2. **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3. **Set up environment variables:**
    * Create a `.env` file in the root of the project.
    * Configure your database connection string(s) as described in the [Database Setup](#database-setup) section.
    * Add the following authentication and seeding variables:

        ```properties
        # Generate a secret using: npx auth secret
        AUTH_SECRET=your_generated_auth_secret

        # Credentials for the initial user created by seeding (if applicable)
        SEED_USER_EMAIL=admin@example.com
        SEED_USER_PASSWORD=your_secure_password
        ```

4. **Apply database migrations:**
    * Ensure your database server is running (either Supabase or your local Docker container).
    * Run the Prisma migrations:

        ```bash
        npx prisma migrate dev
        ```

    * *(Optional)* Seed the database if a seed script exists:

        ```bash
        npx prisma db seed
        ```

5. **Run the development server:**

    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```

    The application should now be running on `http://localhost:3434`.

## Features

* **List Hymns:** View all hymns in a sortable and searchable table.
* **Log Usage:** Record the date when a hymn was sung.
* **View History:** See the recent usage history for each hymn (up to 6 entries).
* **Add Hymns:** Add new hymns to the database.
* **Edit Hymn Titles:** Modify the title of existing hymns.
* **Delete Hymns:** Permanently remove hymns and their associated history.
* **Responsive Design:** Adapts to different screen sizes.

## Database Setup

This application can be configured to connect to a database in two ways. Modify the `.env` file and ensure the Prisma schema (`prisma/schema.prisma`) points to the correct datasource URLs to switch configurations.

1. **Supabase (Current):** Connects to a PostgreSQL database hosted on Supabase.
    * Supabase will display your connection strings with quotes like this:

        ```properties
        # Connect to Supabase via connection pooling.
        DATABASE_URL="postgresql://postgres.pcallbqcmnepevjwqnar:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

        # Direct connection to the database. Used for migrations.
        DIRECT_URL="postgresql://postgres.pcallbqcmnepevjwqnar:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
        ```

    * However, for Vercel deployment and local development (`npm run dev`), you should format your `.env` file **without quotes** and with properly URL-encoded special characters in the password:

        ```properties
        # Connect to Supabase via connection pooling.
        DATABASE_URL=postgresql://postgres.[YOUR_PROJECT_ID]:[URL_ENCODED_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true

        # Direct connection to the database. Used for migrations.
        DIRECT_URL=postgresql://postgres.[YOUR_PROJECT_ID]:[URL_ENCODED_PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
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

## Deployment

This application is configured for deployment on [Vercel](https://vercel.com/).

* Ensure your production environment variables (especially `DATABASE_URL` and `DIRECT_URL` if using Supabase) are correctly set in your Vercel project settings. Remember to use the URL-encoded format without quotes for Vercel.
* The build command (`npm run build` or equivalent) includes `prisma generate`.
* Vercel will typically handle the build and deployment process automatically when connected to your Git repository.
