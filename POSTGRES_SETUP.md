# PostgreSQL Local Setup Guide for Windows

Follow these steps to download, install, and run PostgreSQL locally on your Windows machine, and create the database for **Health Go**.

---

## Step 1: Download the Installer
1. Open your browser and go to the official [EnterpriseDB Download Page](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads).
2. Download the installer for **Windows x86-64** (PostgreSQL version 15 or 16 is recommended).

---

## Step 2: Install PostgreSQL
1. Run the downloaded `.exe` installer.
2. Click **Next** on the Welcome screen.
3. Keep the default installation directory and click **Next**.
4. In the **Select Components** screen, ensure all four components are checked:
   *   **PostgreSQL Server**
   *   **pgAdmin 4** (The database visual admin interface)
   *   **Stack Builder**
   *   **Command Line Tools**
5. Click **Next**.
6. **Choose a Password**: Enter a password for the database superuser `postgres`.
   > [!TIP]
   > We recommend using `postgres` as the password for local development so that it matches our default connection strings.
7. Click **Next**.
8. **Port Selection**: Keep the default port `5432` and click **Next**.
9. **Locale Selection**: Keep `[Default locale]` and click **Next**.
10. Click **Next** through the summaries to begin installation. This will take 2–3 minutes.
11. Uncheck "Launch Stack Builder at exit" and click **Finish**.

---

## Step 3: Create the Database
We need to create the database called `health_go_db` using **pgAdmin 4**:

1. Click the Windows Start menu, search for **pgAdmin 4**, and open it.
2. A browser window or standalone desktop app will open. If it asks you to set a Master Password, enter any password you'll remember.
3. In the left sidebar, click on **Servers** to expand it.
4. Expand **PostgreSQL 15** (or the version you installed). It will prompt you for the password. Enter the password you set during installation (e.g. `postgres`).
5. Right-click on **Databases**, select **Create**, then click **Database...**.
6. In the modal that pops up:
   *   Enter Database name: `health_go_db`
   *   Ensure Owner is set to: `postgres`
7. Click **Save**.

The database is now created and listening locally on port `5432`!

---

## Step 4: Connection Configuration
The backend application reads database credentials from a `.env` file in the backend directory. The default connection URL will be:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/health_go_db
JWT_SECRET=supersecretkeyhealthgo2026
```
*(If you set a different password than `postgres`, replace the second `postgres` in the URL with your password: `postgresql://postgres:YOUR_PASSWORD@localhost:5432/health_go_db`)*
