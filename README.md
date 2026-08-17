# CTG Internal Finance Portal — deploy mirror

This repo exists **only to serve the portal's sign-in page over GitHub Pages**. It is public
because GitHub's free plan cannot serve Pages from a private repo.

**It is not where development happens.** The source of truth is the private
`ctg-internal-finance-portal` repo. Edits made directly here will be overwritten by the next
publish.

## What is in here, and why it is safe to be public

Only the static frontend: the sign-in page and the JavaScript that calls the API. Every
browser that opens the portal already downloads these exact files, so nothing here is
secret.

Deliberately **not** in this repo: the backend edge functions, the database schema and
migrations, company records, and every credential. Those stay private. The one URL in
`shared/config.js` is the public API endpoint, which rejects every request that does not
carry a valid session.

## Publishing an update

From a checkout of the private repo:

```bash
./scripts/publish-frontend.sh
```

That copies `frontend/` here, commits, and pushes. GitHub Pages rebuilds within a minute.
