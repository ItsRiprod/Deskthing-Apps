# Deskthing Discord App

### v0.10.0

#### Code by: Ankziety

#### Based on code by: Riprod

**How to Make a Discord Developer Team and App**

Follow these steps to create a Discord Developer Team, set up an app for it, and set up the OAuth settings. This guide will allow you to connect your discord client to deskthing via local RPC.

---

### 1. Make a Discord Developer Team

1. Open your web browser and go to the Discord Developer Teams page:
   - [Discord Developer Teams](https://discord.com/developers/teams)
2. Log in to your Discord account. If you don’t have one, you’ll need to make one by signing up.
3. Click on **Create Team**. This will open a page where you can give your team a name and fill out some simple details.
4. Type in a name for your team. Pick something that makes sense for what you’re working on.
5. That’s it! Your team is now set up and ready.

---

### 2. Create a New App for Your Team

1. Go to the Discord Developer Applications page:
   - [Discord Developer Applications](https://discord.com/developers/applications)
2. Log in if it asks you to.
3. Click **New Application**. A screen will pop up asking for some information.
4. Enter a name for your app. After that, make sure to choose your team, as the owner, instead of your personal account.
5. Click **Create** to finish setting up the app under your team.

---

### 3. Add Yourself as a Tester

1. In your app’s settings, look for the **App Testers** section in the menu.
2. Add your Discord account as a tester. Type in your username or ID.
3. Check your email for an invite. Open the email and accept the invitation.
4. Once accepted, your account is now set as a tester for the app.

---

### 4. Set Up OAuth Settings

1. Go to the **OAuth2** section in the app’s settings.
2. Find the field for **Redirects** or **Callback URLs**. Add the correct URL here, which should come from the project you’re working on.
3. After setting the redirect, click the option to reset your client secret. This will show you a new secret key.
4. Copy and paste both the **Client ID** and **Client Secret** into your project’s settings or wherever it’s needed. Make sure to save these somewhere safe.

---

### 5. Troubleshooting and Support

> [!TIP]
> You can try pausing and unpausing the app in the Developer Portal to restart it. This might fix some bugs.

> [!IMPORTANT]
> You must be an app tester registered with the team application for RPC to connect.
