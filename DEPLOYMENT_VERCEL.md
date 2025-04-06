# Vercel Deployment Guide

This guide provides step-by-step instructions for deploying the Quote Tool Deluxe application to Vercel.

## Prerequisites

Before you begin, ensure you have the following:

1.  **Vercel Account:** Sign up or log in at [vercel.com](https://vercel.com/).
2.  **Git Repository:** Your application code should be hosted on a Git provider supported by Vercel (GitHub, GitLab, or Bitbucket).
3.  **Node.js and pnpm:** While Vercel handles the build, having them locally can be useful for testing.

## Deployment Steps

1.  **Import Project:**
    *   Log in to your Vercel dashboard.
    *   Click on "Add New..." -> "Project".
    *   Select the Git provider where your repository is hosted and connect your account if you haven't already.
    *   Choose your repository from the list and click "Import".

2.  **Configure Project:**
    *   **Framework Preset:** Vercel should automatically detect "Next.js". If not, select it manually.
    *   **Build and Output Settings:** Vercel typically configures these correctly for Next.js:
        *   **Build Command:** Should default to `pnpm build` or similar (Vercel detects pnpm).
        *   **Output Directory:** Should default to `.next`.
        *   **Install Command:** Should default to `pnpm install`.
    *   **Environment Variables:** This is the most crucial step. You need to add the necessary environment variables from your `.env` or `.env.example` file. Navigate to the "Environment Variables" section in your project settings on Vercel and add the following:
        *   `NEXTAUTH_SECRET`: **Required.** Generate a strong, unique secret for your production deployment. You can use `npx auth secret` locally to generate one.
        *   `NEXTAUTH_URL`: **Required.** The **full public URL** of your deployed Vercel application (e.g., `https://your-app-name.vercel.app`).
        *   `DATABASE_URL`: **Required.** The connection string for your **production** PostgreSQL database. **Do not use your local development database URL.** Ensure your production database allows connections from Vercel's IP ranges if necessary.
        *   `NEXT_PUBLIC_APP_URL`: **Required.** Set this to the same value as `NEXTAUTH_URL`.

        *Note: Treat `NEXTAUTH_SECRET` and `DATABASE_URL` as sensitive secrets.* 

3.  **Deploy:**
    *   Click the "Deploy" button.
    *   Vercel will clone your repository, install dependencies, build the application, and deploy it.
    *   You can monitor the build logs in the Vercel dashboard.

4.  **Verify Deployment:**
    *   Once the deployment is complete, Vercel will provide you with one or more URLs (e.g., `your-app-name.vercel.app`).
    *   Visit the URL in your browser.
    *   Test the application thoroughly, especially login/signup functionality and features that interact with the database.

## Automatic Deployments

By default, Vercel will automatically redeploy your application whenever you push changes to your connected Git branch (usually `main` or `master`). You can also configure preview deployments for other branches or pull requests.

## Troubleshooting

*   **Build Failures:** Check the Vercel build logs for specific errors. Common issues include missing dependencies or incorrect environment variable configuration.
*   **Runtime Errors:** Use Vercel's runtime logs (accessible from the deployment details) to diagnose issues occurring after deployment.
*   **Database Connection Issues:** Ensure your `DATABASE_URL` is correct and that your database firewall allows connections from Vercel.
*   **Authentication Errors:** Double-check `NEXTAUTH_SECRET` and `NEXTAUTH_URL` environment variables. 