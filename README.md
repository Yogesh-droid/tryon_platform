# Virtual Try-On Platform

A comprehensive Virtual Try-On platform featuring a Django backend, a React business dashboard, a React customer storefront, and an automated Gemini AI pipeline using Playwright.

## Project Structure
- `tryon_platform/` - The Django backend API and Celery tasks.
- `tryon_business/` - The React frontend for shop owners to manage catalogs.
- `tryon_frontend/` - The React frontend for customers to virtually try on garments.

---

## How to Run the Project

You will need to open **4 separate terminal windows** to run the full stack.

### 1. Start the Backend (Django)
Open Terminal 1:
```bash
cd tryon_platform
source venv/bin/activate
python manage.py runserver
```
*(Runs on http://localhost:8000)*

### 2. Start the Background Worker (Celery)
Open Terminal 2:
```bash
cd tryon_platform
source venv/bin/activate
celery -A tryon_platform worker --loglevel=info
```
*(Handles the Playwright automation and AI image generation in the background)*

### 3. Start the Business Dashboard
Open Terminal 3:
```bash
cd tryon_business
npm run dev
```
*(Handles catalog management and AI prompt editing)*

### 4. Start the Customer Storefront
Open Terminal 4:
```bash
cd tryon_frontend
npm run dev
```
*(Where customers upload selfies and select sizes)*

---

## Troubleshooting

### Google Gemini "Browser is not secure" Login Issue
The AI image generation runs via a real Google Chrome browser controlled by Playwright. To do this, it uses a persistent profile saved at `tryon_platform/gemini_user_profile`. 

If your session expires and you are prompted to log in, Google will block you from typing your password while Playwright is actively automating the browser (saying *"This browser or app may not be secure"*).

**To bypass this and log in safely:**

1. **Stop your Celery worker** (Press `Ctrl+C` in Terminal 2).
2. **Launch the profile manually** by pasting this exact command into your terminal:
   ```bash
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --user-data-dir="$(pwd)/tryon_platform/gemini_user_profile"
   ```
3. In the Chrome window that opens, navigate to [https://gemini.google.com/app](https://gemini.google.com/app) and log in with your Google account.
4. Once you are successfully logged in and see the chat screen, completely **Quit** Chrome (Cmd + Q).
5. **Restart your Celery worker.** Playwright will now automatically use the saved login session and bypass the login screen completely!

