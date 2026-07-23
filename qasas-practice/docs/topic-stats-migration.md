# Topic Stats Historical Migration

Use this once after deploying the `users/{userId}/topicStats/{category_subtopic}`
Strength Map model.

The migration reads every `answerEvents` document, folds each user's events in
chronological order, and writes:

```
users/{userId}/topicStats/{category_subtopic}
```

It is safe to run more than once because it recomputes each topic stat from the
event log and writes the same document IDs.

## Manual Firebase Step

Create a service account key:

1. Open Firebase Console.
2. Click the gear icon next to **Project Overview**.
3. Open **Project settings**.
4. Open **Service accounts**.
5. Click **Generate new private key**.
6. Save the downloaded JSON somewhere outside the repo, for example:
   `~/Downloads/alimiyyah-service-account.json`

Do not commit this JSON file.

## Dry Run

From `qasas-practice/`:

```bash
GOOGLE_APPLICATION_CREDENTIALS="$HOME/Downloads/alimiyyah-service-account.json" npm run migrate:topic-stats
```

Expected output:

```text
Read N answerEvents.
Prepared M topicStats documents for U users.
users/exampleUid/topicStats/fiqh_WUD: attempts=...
Dry run only. Re-run with --apply to write topicStats.
```

## Apply

Run this when students are not actively submitting quizzes:

```bash
GOOGLE_APPLICATION_CREDENTIALS="$HOME/Downloads/alimiyyah-service-account.json" npm run migrate:topic-stats -- --apply
```

Expected output ends with:

```text
Wrote M topicStats documents.
```

## Verify

1. Open Firebase Console.
2. Go to **Firestore Database**.
3. Open `users`.
4. Open a user who has historical quiz attempts.
5. Confirm the `topicStats` subcollection exists.
6. Open documents such as `fiqh_WUD` or `arabic_IRB`.
7. Confirm each document has `attempts`, `correct`, `lastAttempted`, and `ewmaScore`.
8. Refresh the app's Strength Map and Admin Strength Map.

## Migration Result — July 23, 2026

Applied successfully from `answerEvents` into `users/{userId}/topicStats`.

- Read `142` historical `answerEvents`.
- Wrote `36` `topicStats` documents.
- Covered `4` users.
- Category split: `26` fiqh docs, `10` arabic docs.

Verified with a Firestore `collectionGroup("topicStats")` read that migrated docs include
`attempts`, `correct`, `lastAttempted`, and `ewmaScore`.
