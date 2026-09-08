# RWPH v1.1.455 — Cloudflare Worker + Aiven MySQL

This build targets a single Cloudflare Worker project backed by **Aiven MySQL through Cloudflare Hyperdrive**. The stateful RWPH Express/calculation engine is routed through one Cloudflare Durable Object while persistent licence/payment/cache state is stored in Aiven.

Public backend URL configured in the userscript:

`https://rwph-backend.evilpanda2612.workers.dev`

Start with **START_HERE.txt**.

## Important private files

`PRIVATE_MIGRATION/` contains existing RWPH database state and private secret values. Keep that folder off public GitHub. `.gitignore` already excludes it.
