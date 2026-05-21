UPDATE "users"
SET "role" = 'SUPER_ADMIN'
WHERE "id" = (
  SELECT "id"
  FROM "users"
  ORDER BY "created_at" ASC
  LIMIT 1
)
AND NOT EXISTS (
  SELECT 1
  FROM "users"
  WHERE "role" = 'SUPER_ADMIN'
);
