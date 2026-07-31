-- 启用 pgcrypto（gen_random_uuid 用）+ trigram（模糊搜索用，未来）
CREATE EXTENSION IF NOT EXISTS pgcrypto;
