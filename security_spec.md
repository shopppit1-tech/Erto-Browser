# Erto Browser Firestore Security Specification

## 1. Data Invariants
1. All user profiles (`users/{userId}`), bookmarks (`users/{userId}/bookmarks/{bookmarkId}`), and history (`users/{userId}/history/{historyId}`) are strictly private to the authenticated owner (`request.auth.uid == userId`).
2. Every write requires `request.auth != null` and `request.auth.token.email_verified == true`.
3. `ownerId` / `uid` in incoming payloads MUST match `request.auth.uid` and remain immutable on update.
4. `createdAt`, `updatedAt`, and `visitedAt` MUST equal `request.time`.
5. No unvalidated ghost fields are allowed (`keys().hasAll(...)` + `keys().hasOnly(...)` on create, `affectedKeys().hasOnly(...)` on update).

## 2. Dirty Dozen Attack Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated read of `/users/uid1`.
2. Unauthenticated write to `/users/uid1/bookmarks/bm1`.
3. Cross-user read of `/users/uid2/bookmarks/bm1` by `uid1`.
4. Cross-user list of `/users/uid2/history` by `uid1`.
5. Unverified email (`email_verified: false`) writing `/users/uid1`.
6. Identity spoofing: `uid1` creating `/users/uid1/bookmarks/bm1` with `ownerId: "uid2"`.
7. Shadow field injection: `uid1` creating `/users/uid1` with extra `isAdmin: true`.
8. Oversized ID injection (`bookmarkId` > 128 chars or invalid chars like `../`).
9. Client-forged timestamp (`createdAt` != `request.time`).
10. Oversized URL string (`url.size() > 1024`).
11. Mutating `ownerId` during bookmark update.
12. Mutating `createdAt` during bookmark update.
