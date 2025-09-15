# Akademion Backend v3 (author/mentor only)
- Register -> PendingUser; real User created on `/auth/verify-email` then auto login.
- Roles: author & mentor.
- Profile avatar: `PATCH /users/me` (multipart field `avatar`).
- Articles: submit (author), filter, export; mentor review; status update.
- Assigned vs Done for mentors: `/articles/assigned?done=false|true`.
- Edit allowed when status is **submitted** or **rejected**.
