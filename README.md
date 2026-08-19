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
* **Storage:** Browser Local Storage (No backend required)

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

3. **Run the development server:**

    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```

    The application should now be running on `http://localhost:3434`.

## Features

* **Local Storage First:** All data is safely stored in your browser without requiring server connections.
* **List Hymns:** View all hymns in a sortable and searchable table.
* **Log Usage:** Record the date when a hymn was sung.
* **View History:** See the recent usage history for each hymn (up to 6 entries).
* **Add Hymns:** Add new hymns to the database.
* **Edit Hymn Titles:** Modify the title of existing hymns.
* **Delete Hymns:** Permanently remove hymns and their associated history.
* **Import / Export:** Easily download your local data as a JSON file and restore it on other devices.
* **Responsive Design:** Adapts to different screen sizes.

## Data Persistence

This application has been migrated from a PostgreSQL / Prisma setup to a purely local-storage-based architecture. 
There is no database to configure or host, making deployment to static hosts like Vercel entirely free and frictionless.
Use the built-in **Export** and **Import** functionality to share your choir tracking data between devices or create backups.

## Deployment

This application is configured for deployment on [Vercel](https://vercel.com/) or any static hosting provider.

* Because it uses local storage, no environment variables or database connections are needed.
* Vercel will handle the build and deployment process automatically when connected to your Git repository.

## Deployment

This application is configured for deployment on [Vercel](https://vercel.com/).

* Ensure your production environment variables (especially `DATABASE_URL` and `DIRECT_URL` if using Supabase) are correctly set in your Vercel project settings. Remember to use the URL-encoded format without quotes for Vercel.
* The build command (`npm run build` or equivalent) includes `prisma generate`.
* Vercel will typically handle the build and deployment process automatically when connected to your Git repository.
