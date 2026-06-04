# NWD Central Hub — Database Schema

This document describes the deployed database schema for the NWD Central Hub: tables, columns, relationships, and Row-Level Security policies. It is the source of truth for the current production database.

Read this alongside `docs/architecture.md`, which covers how these tables are queried and how RLS interacts with the two Supabase clients.

> **This document reflects the schema as of the merge of PR #50 ([#21] Improve Proposal Lifecycle & Status Handling).** Tables not yet fully built are marked with their blocking issue. `docs/database-setup.md` is superseded by this document and should be deleted.

---

## Tables Overview

| Table | Status | Description |
|---|---|---|
| `profiles` | ✅ Complete | Application users — extends `auth.users` |
| `proposals` | ✅ Complete (as of PR #50) | Project proposals submitted by clients |
| `projects` | ⚠️ Stub | Approved proposals promoted to projects — full schema pending #54 |
| `proposal_requests` | ❌ Not built | Contractor request-to-join flow — pending #40 |
| `project_messages` | ❌ Not built | In-project messaging — pending #56 |

---

## Table: `profiles`

Stores application users. Every row corresponds to a row in `auth.users` and is created atomically alongside it by the `createUser` server action in `actions.ts`.

```sql
id                    uuid         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
email                 text
name                  text
role                  text         CHECK (role IN ('admin', 'client', 'contractor'))
is_temporary_password boolean
created_at            timestamp    DEFAULT now()
```

**Notes:**
- `id` is the Supabase auth UID — not generated independently. The `profiles` row is deleted automatically if the corresponding `auth.users` row is deleted.
- `role` is assigned by an admin at creation and is not user-editable.
- `is_temporary_password` is set to `true` on creation and to `false` after the user completes the forced password change flow. `RouteGuard` reads this field on every protected page load.
- `name` is set at creation but is not currently reflected in the `UserProfile` TypeScript type. Add `name?: string` to `types/auth.ts` before implementing workspace or messaging features that display user names.
- NULL rows in this table indicate orphaned auth records — users created outside the `createUser` action. These are inert but should be cleaned up via a future migration.

**Source of truth:** `app/login/admin/users/create/actions.ts`

---

## Table: `proposals`

Stores project proposals created and submitted by client users.

```sql
id            uuid       PRIMARY KEY DEFAULT gen_random_uuid()
client_id     uuid       NOT NULL REFERENCES profiles(id)
title         text
description   text
budget        text
status        text       CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'))
created_at    timestamp  DEFAULT now()
```

**Status lifecycle:**

```
draft → submitted → approved
                 └→ rejected
```

| Status | Meaning |
|---|---|
| `draft` | Created by client, not yet submitted |
| `submitted` | Submitted for admin review |
| `approved` | Admin approved — triggers project creation |
| `rejected` | Admin rejected — terminal state |

`approved` and `rejected` are terminal states. A proposal cannot be moved out of either once set. This is enforced in the UI via `canAdminReviewProposal()` in `lib/proposals.ts`, which gates the Approve and Reject buttons to `submitted` proposals only. Database-level enforcement via CHECK constraint or trigger is a post-MVP hardening task.

**Notes:**
- `budget` is a freeform text field. It is required in the client submission form but has no numeric constraint at the database level.
- `client_id` references `profiles.id`, not `auth.users.id` directly.
- New proposals are created with `status: 'submitted'` by the client form (`proposals/new/page.tsx`). The `draft` status exists in the type system for future use (e.g., save-for-later before submission) but is not currently written by any UI flow.
- Status transition logic, display helpers, and badge CSS classes live in `lib/proposals.ts`.

> **Persistence note:** As of PR #50, the proposal submission form and admin review page still read and write from `localStorage`, not Supabase. The status values and type definitions are correct; the persistence layer migration to Supabase is the scope of issue #51. Do not assume proposals are in the database until #51 is merged.

**Source of truth:** `lib/proposals.ts`, `app/proposals/new/page.tsx`

---

## Table: `projects` ⚠️ Stub

Created when an admin approves a proposal. Currently a stub pending the full schema design in issue #54.

```sql
proposal_id   uuid    -- only confirmed column as of this writing
```

**Planned schema (target state after #54):**

```sql
id            uuid       PRIMARY KEY DEFAULT gen_random_uuid()
proposal_id   uuid       NOT NULL REFERENCES proposals(id)
title         text
description   text
client_id     uuid       REFERENCES profiles(id)
status        text
created_at    timestamp  DEFAULT now()
```

Contractor linkage will be handled via a join table (`contractor_projects` or equivalent) added as part of #54 or #40. Do not build features that depend on the current stub schema — coordinate with the team before writing any migrations against this table.

---

## Table: `proposal_requests` ❌ Not Built

Required for the contractor request-to-join flow (#40). Does not exist yet.

**Planned schema:**

```sql
id              uuid       PRIMARY KEY DEFAULT gen_random_uuid()
proposal_id     uuid       NOT NULL REFERENCES proposals(id)
contractor_id   uuid       NOT NULL REFERENCES profiles(id)
status          text       CHECK (status IN ('pending', 'approved', 'rejected'))
created_at      timestamp  DEFAULT now()
```

---

## Table: `project_messages` ❌ Not Built

Required for in-project messaging (#56). Does not exist yet.

**Planned schema:**

```sql
id          uuid       PRIMARY KEY DEFAULT gen_random_uuid()
project_id  uuid       NOT NULL REFERENCES projects(id)
sender_id   uuid       NOT NULL REFERENCES profiles(id)
content     text       NOT NULL
created_at  timestamp  DEFAULT now()
```

---

## Relationships

```
auth.users
    │
    └── profiles (id → auth.users.id)
            │
            ├── proposals (client_id → profiles.id)
            │       │
            │       ├── projects (proposal_id → proposals.id)  [stub]
            │       │       │
            │       │       └── project_messages (project_id → projects.id)  [not built]
            │       │
            │       └── proposal_requests (proposal_id → proposals.id)  [not built]
            │
            ├── proposal_requests (contractor_id → profiles.id)  [not built]
            │
            └── project_messages (sender_id → profiles.id)  [not built]
```

---

## Row-Level Security (RLS)

RLS is enabled on all tables. The browser Supabase client (`lib/supabase.ts`, anon key) is always subject to these policies. The server admin client (`lib/supabase-admin.ts`, service role key) bypasses RLS entirely and must only be used in server actions.

**Never disable RLS on a table to fix a query bug.** If a query fails due to RLS, the correct fix is to adjust the policy or move the query to a server action using `supabaseAdmin`.

### `profiles`

| Operation | Who | Policy |
|---|---|---|
| SELECT | Authenticated user | Own row only (`auth.uid() = id`) |
| SELECT | Admin | All rows |
| INSERT | Server action only | Via `supabaseAdmin` in `createUser` — not client-initiated |
| UPDATE | Authenticated user | Own row only |
| UPDATE | Admin | Any row |

### `proposals`

| Operation | Who | Policy |
|---|---|---|
| SELECT | Client | Own proposals only (`auth.uid() = client_id`) |
| SELECT | Admin | All proposals |
| SELECT | Contractor | Proposals with `status = 'approved'` only |
| INSERT | Client | Own proposals only (`auth.uid() = client_id`) |
| UPDATE | Admin | Status on any proposal |
| UPDATE | Client | Not permitted — status changes are admin-only |

### `projects` (policies pending #54)

RLS policies for `projects` will be defined when the full schema lands in #54. Until then, treat this table as admin-write only via `supabaseAdmin`.

---

## Known Gaps

| Gap | Impact | Resolved by |
|---|---|---|
| `projects` table is a stub | Blocks workspace, messaging, and contractor assignment | #54 |
| `UserProfile` type missing `name` | TypeScript friction when workspace/messaging display user names | Add `name?: string` to `types/auth.ts` before #55/#56 |
| Proposals persist to `localStorage`, not Supabase | Admin and client proposal surfaces are disconnected | #51 |
| `proposal_requests` table not built | Contractor self-service join flow blocked | #40 |
| `project_messages` table not built | In-project messaging blocked | #56 |
| NULL rows in `profiles` | Orphaned auth records from out-of-flow user creation | Future cleanup migration (non-blocking) |
| `budget` has no numeric constraint | Freeform text — no validation beyond form `type="number"` | Post-MVP hardening |

---

*Last updated: [Update on commit]*