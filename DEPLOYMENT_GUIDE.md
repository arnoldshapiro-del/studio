# WellTrack Daily: From Studio to Live on Firebase

This guide provides the exact steps to take your WellTrack Daily application code from Firebase Studio, get it into your own GitHub repository, and deploy it live to the web using Firebase App Hosting.

---

### **Step 1: Get Your Code into GitHub**

First, we need to get all the code from this environment into a new GitHub repository that you own.

1.  **Create a New GitHub Repository:**
    *   Go to [GitHub](https://github.com/new) and create a new, empty repository. You can name it `welltrack-daily-app` or anything you like.
    *   Do **not** initialize it with a `README`, `.gitignore`, or `license` file. It should be completely empty.
    *   After creating it, copy the repository's URL (it will look something like `https://github.com/your-username/welltrack-daily-app.git`).

2.  **Initialize Git and Push Your Code:**
    *   Open the terminal in this development environment.
    *   Copy and paste the following commands one at a time, pressing `Enter` after each one.

    **Command 1: Initialize the project**
    ```bash
    git init -b main
    ```

    **Command 2: Add all files**
    ```bash
    git add .
    ```

    **Command 3: Save a snapshot of your work**
    ```bash
    git commit -m "Initial commit of my WellTrack Daily app"
    ```

    **Command 4: Connect to your GitHub repository**
    *(Remember to replace `PASTE_YOUR_GITHUB_URL_HERE` with the real URL you copied!)*
    ```bash
    git remote add origin PASTE_YOUR_GITHUB_URL_HERE
    ```

    **Command 5: Push your code to GitHub**
    ```bash
    git push -u origin main
    ```

    After running the last command, you may be prompted for your GitHub username and password. For the password, you will need to use a **Personal Access Token** which you can generate from your GitHub account's developer settings.

    Once finished, refresh your GitHub repository page. All of your app's files will be there!

---

### **Step 2: Deploy to Firebase App Hosting**

Now that your code is on GitHub, you can deploy it to Firebase.

1.  **Go to the Firebase Console:**
    *   Navigate to the [Firebase Console](https://console.firebase.google.com/).
    *   Use the **same Firebase project** that is associated with this Studio workspace. The project ID is: `studio-4865781067-c8917`.

2.  **Navigate to App Hosting:**
    *   In the Firebase console, look for the "Build" section in the left-hand menu.
    *   Click on **App Hosting**.

3.  **Connect Your GitHub Repository:**
    *   You will see a setup wizard. Click **"Get Started"**.
    *   When prompted, connect your GitHub account and select the `welltrack-daily-app` repository you just created.
    *   Follow the on-screen instructions to authorize Firebase to access your repository.

4.  **Configure and Deploy:**
    *   The wizard will guide you through the deployment settings. For the most part, the default settings will work perfectly because the `apphosting.yaml` file is already included in your project.
    *   Confirm the settings and start the deployment. Firebase App Hosting will automatically build your Next.js application and deploy it.

5.  **You're Live!**
    *   Once the deployment is complete (it may take a few minutes), Firebase will provide you with a public URL (e.g., `your-app-name.web.app`).

Your WellTrack Daily application is now live on the internet!
