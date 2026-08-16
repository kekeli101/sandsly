-- Idempotent catalog seed for the external Supabase database.
-- This contains menu/catalog content only; it does not create customer, order, or review data.

INSERT INTO "categories" ("slug", "name", "sortOrder", "isActive") VALUES
  ('boba', 'Boba', 1, true),
  ('yogurt', 'Yogurt', 2, true),
  ('ice-cream', 'Ice cream', 3, true),
  ('pizza', 'Pizza', 4, true),
  ('fries', 'Fries', 5, true),
  ('pork', 'Pork', 6, true)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive" = EXCLUDED."isActive";

INSERT INTO "products" ("id", "categoryId", "name", "description", "pricePesewas", "imageUrl", "badge", "crunchLevel", "sortOrder", "isActive") VALUES
  ('matcha-cloud-boba', (SELECT "id" FROM "categories" WHERE "slug" = 'boba'), 'Matcha Cloud Boba', 'Ceremonial matcha, brown sugar pearls, and a savory cheese cloud foam.', 7500, 'https://lh3.googleusercontent.com/aida-public/AB6AXuAToXdghCpHEt6Iqomv0rjpXB_iBHWVSReD5ScUnPNZPRo3xV2ftA6AraKr5btDpTAIKLgfGBBHpZGs0dUAZ02eAOmhPYZ-nzERM8QEi7NWGoLl5Db1aKln_PNAmYo8kupJFr4N7o3kcMFAUSZirL3YSBCSZzkITC4N1qBRWTjiIRdhaKTz1Xm5ZRul-lf8TuETwfFI6JCLu0x9Ccu3_u5lymZHjXhYaAmI16vU4EErLYqWCZ3gJny2', 'New', 1, 1, true),
  ('tiger-sugar-boba', (SELECT "id" FROM "categories" WHERE "slug" = 'boba'), 'Tiger Sugar Crunch Boba', 'Brown sugar pearls, cold brew tea, and a toasted caramel cream cap.', 6500, 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=900&q=85', NULL, 2, 2, true),
  ('mango-crunch-yogurt', (SELECT "id" FROM "categories" WHERE "slug" = 'yogurt'), 'Mango Crunch Yogurt', 'Creamy Greek-style yogurt, bright mango, toasted granola, and a honey finish.', 5500, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=85', 'Fresh', 3, 1, true),
  ('black-sesame-ice-cream', (SELECT "id" FROM "categories" WHERE "slug" = 'ice-cream'), 'Black Sesame Ice Cream', 'Silky black sesame ice cream with caramel crunch and roasted peanut dust.', 4500, 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=900&q=85', 'Cold drop', 2, 1, true),
  ('spicy-honey-pepperoni', (SELECT "id" FROM "categories" WHERE "slug" = 'pizza'), 'Spicy Honey Pepperoni', 'Thick crust, charred cups, and our signature hot honey drizzle.', 14000, 'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1400&q=85', 'Hot', 3, 1, true),
  ('neon-fries', (SELECT "id" FROM "categories" WHERE "slug" = 'fries'), 'Neon Fries', 'Crinkle cut fries drenched in liquid gold cheddar, candied bacon dust, and scallions.', 8000, 'https://lh3.googleusercontent.com/aida-public/AB6AXuBD1g8cR6ue6JCeBkt6u9ODvJsS-FICRFkLycvoNUPZFUv4SGzHgUVQgLTwQK8eXHHz6zS3Apnrwi4Gm8key5WUb0KlvSCIkrriI_24iNlQVgWCCGuOiy9oIY8RPwyDWN0evy5Lfe7uHxiJGLGNbqSQyNmKi00vaqkGYDa_8QeB0OuuWBRHH1LojnvOkKoWaic5wM4Opxf_Xs2lqXsoe0Wor4BrD44-HtT5C8Bzrf-B5U7ZO8CY4I_S', 'New', 4, 1, true),
  ('crunchy-garlic-pork', (SELECT "id" FROM "categories" WHERE "slug" = 'pork'), 'Crunchy Garlic Pork', 'Twice-fried pork belly tossed in sticky garlic soy glaze and chili flakes.', 12000, 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_72Dmatc8j1YIhJh-UIrX3bRp8O7J94Jig4st1SSYVNQXZk09vOgOVnBpz0Jk1QIv3gBw6rJnJv4Voe6iYuG7mNFCFUqKYhL0_7jhy54KS8Ww7sSOEFkDZdIOqJRHyiSAnGEQJuokxbRZN5U1L5AsLoZ-BaxAIVFig85vPGbdoDHz29S3sWSRPPD4WktksuEJJ181RxGTxlaZFlAKxKN5IDBPAbJNqIwGCjMOHf5fZ6dxT3EjF7R9d', NULL, 5, 1, true)
ON CONFLICT ("id") DO UPDATE SET
  "categoryId" = EXCLUDED."categoryId",
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "pricePesewas" = EXCLUDED."pricePesewas",
  "imageUrl" = EXCLUDED."imageUrl",
  "badge" = EXCLUDED."badge",
  "crunchLevel" = EXCLUDED."crunchLevel",
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive" = EXCLUDED."isActive";


INSERT INTO "products" ("id", "categoryId", "name", "description", "pricePesewas", "imageUrl", "badge", "crunchLevel", "sortOrder", "isActive") VALUES
  ('brown-sugar-milk-tea', (SELECT "id" FROM "categories" WHERE "slug" = 'boba'), 'Brown Sugar Milk Tea', 'Cold black tea, brown sugar pearls, and a creamy caramel finish.', 7000, '/manus-storage/brown-sugar-milk-tea_a7631cbd.jpg', 'Popular', 2, 3, true),
  ('strawberry-yogurt-crunch', (SELECT "id" FROM "categories" WHERE "slug" = 'yogurt'), 'Strawberry Yogurt Crunch', 'Creamy yogurt, ripe strawberries, toasted granola, and honey.', 6000, '/manus-storage/strawberry-yogurt-crunch_5082f823.jpg', 'Fresh', 2, 2, true),
  ('mango-coconut-ice-cream', (SELECT "id" FROM "categories" WHERE "slug" = 'ice-cream'), 'Mango Coconut Ice Cream', 'Golden mango ice cream with toasted coconut and mango pieces.', 5000, '/manus-storage/mango-coconut-ice-cream_0713cdef.jpg', 'Cold drop', 1, 2, true),
  ('suya-pizza', (SELECT "id" FROM "categories" WHERE "slug" = 'pizza'), 'Ghanaian Suya Pizza', 'Blistered crust, spicy suya beef, peppers, onions, and melted cheese.', 15000, '/manus-storage/suya-pizza_05506e0e.jpg', 'Hot', 4, 2, true),
  ('loaded-plantain-fries', (SELECT "id" FROM "categories" WHERE "slug" = 'fries'), 'Loaded Plantain Fries', 'Golden plantain fries with cheddar sauce, scallions, and smoky crumble.', 8500, '/manus-storage/loaded-plantain-fries_ae72a2e5.jpg', 'New', 4, 2, true),
  ('sticky-bbq-pork-bites', (SELECT "id" FROM "categories" WHERE "slug" = 'pork'), 'Sticky BBQ Pork Bites', 'Caramelized pork belly bites with barbecue glaze, sesame, and chili.', 13000, '/manus-storage/sticky-bbq-pork-bites_225d22b3.jpg', 'New', 5, 2, true)
ON CONFLICT ("id") DO UPDATE SET
  "categoryId" = EXCLUDED."categoryId",
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "pricePesewas" = EXCLUDED."pricePesewas",
  "imageUrl" = EXCLUDED."imageUrl",
  "badge" = EXCLUDED."badge",
  "crunchLevel" = EXCLUDED."crunchLevel",
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive" = EXCLUDED."isActive";
