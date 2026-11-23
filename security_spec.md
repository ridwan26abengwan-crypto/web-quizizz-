# Security Specification — WEB QUIZIZZ

## 1. Data Invariants
1. **Role Isolation & Anti-Privilege Escalation**: A newly registered user in `/users/{userId}` can only create a document with `role == 'siswa'` (unless verified as the bootstrapped admin email). Normal users cannot modify their own `role` field.
2. **PII Isolation**: Email addresses live exclusively in `/users/{userId}`, readable only by the owning user or an admin. Public leaderboard queries read `/students/{studentId}` which contains zero PII (no email, phone, or address).
3. **Quiz Answer-Key Protection**: `/questions/{questionId}` stores only prompts, options, points, and an opaque HMAC-sealed key. Plaintext `correctAnswer` and `explanation` reside in `/questions/{questionId}/answer_key/{keyId}` and are strictly readable only by `guru` and `admin`.
4. **Student Result Ownership**: A student can only create and read `/quiz_results/{resultId}` where `studentUid == request.auth.uid`, and cannot tamper with `quiz_results` created by other students.
5. **Catalog Integrity**: Only verified `admin` users can create/update/delete `/books/{bookId}` and `/achievements/{achievementId}`, and book URLs must start with `https://` or `http://`. Only `guru` or `admin` can create/update/delete `/quizzes/{quizId}` and `/questions/{questionId}`.
6. **Strict Timestamps & Immutable Ownership**: `createdAt` and `uid`/`studentUid`/`createdBy` are immutable on update, and timestamps must equal `request.time`.

## 2. Dirty Dozen Payloads (Must Return PERMISSION_DENIED)
1. **Self-Assigned Admin Role on Signup**: Creating `/users/u1` with `role: 'admin'` by non-admin email.
2. **Shadow Field Injection on User**: Creating `/users/u1` with extra ghost field `isVerifiedAdmin: true`.
3. **PII Snooping Across Users**: User A calling `get` on `/users/userB`.
4. **Unverified Email Spoofing**: Admin email with `email_verified: false` attempting admin write on `/books/b1`.
5. **Student Reading Answer Key**: Student calling `get` or `list` on `/questions/q1/answer_key/key`.
6. **Student Creating Quiz**: User with `role: 'siswa'` attempting to create `/quizzes/qz1`.
7. **Student Deleting Book**: User with `role: 'siswa'` attempting to delete `/books/ppkn-kelas-5`.
8. **Cross-Student Result Spoofing**: Student A creating `/quiz_results/r1` with `studentUid: 'studentB'`.
9. **Result Score Tampering After Completion**: Student updating `/quiz_results/r1` after creation to set `score: 100`.
10. **Oversized ID Poisoning**: Creating `/books/<200-char-invalid-id!@#>` violating `isValidId()`.
11. **Fake Timestamp Injection**: Creating `/quiz_results/r1` with client-supplied `createdAt` not equal to `request.time`.
12. **Role Mutation by Owner**: User updating their own `/users/u1` changing `role` from `'siswa'` to `'guru'`.
