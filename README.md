# HR Assessment Forms

Online HR assessment platform: share a form link, collect resumes, convert answers to PDF, and email both files to a configured HR inbox.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**HR login:** `admin` / `admin123`

## What you get

| Page | Purpose |
|---|---|
| `/` | Public careers page listing published forms |
| `/apply/hr-assessment` | Default job application / assessment form |
| `/apply/internship` | Sample internship form |
| `/login` | Admin sign-in |
| `/admin` | Dashboard |
| `/admin/forms` | Create multiple forms, copy links |
| `/admin/forms/[id]` | Field customization builder |
| `/admin/submissions` | All responses, PDF + resume download |
| `/admin/settings` | Company branding, notify email, SMTP |

## Email

In **Settings**, set:

1. **Send submissions to** — HR inbox
2. SMTP host, port, user, password, from address

Each submit sends one email with:

1. PDF of the filled form
2. The original resume (PDF, Word, HTML, etc.) as a second attachment

If SMTP is not configured, submissions are still saved. You can download the PDF and send later from the submission page.

## Data

Stored locally in `data/db.json`. Uploads live in `uploads/`.
