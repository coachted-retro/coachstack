# CoachPilot

A lean, flat-rate training platform for independent personal trainers and
coaches — client roster, program assignment, and workout logging, without
the gym-management weight (no staff scheduling, HR, inventory, or
multi-location tooling) that platforms like Trainerize and TrueCoach bundle
in and charge for either way.

Built to directly attack the pain point most coaching-software pricing has:
per-client tiering that punishes a trainer for growing their roster. One
flat rate, unlimited clients.

## Phase 1 (current)
- Trainer signup/login
- Client roster (add, view)
- Assign a program from the shared bundle catalog (`bundles-library.js`)
- Client login, view assigned program, log workouts

## Stack
- Cloudflare Worker (`worker.js`) + D1 (`coachpilot-db`)
- Static frontend on GitHub Pages, deployed automatically on push to `main`
- Worker auto-deploys on push via `.github/workflows/deploy-worker.yml`
  (needs `CLOUDFLARE_API_TOKEN` set as a repo secret)

## Not yet built
Trainer billing (Square), client messaging, logo/branding upload, AI
coaching layer -- see project notes for the phased plan.
