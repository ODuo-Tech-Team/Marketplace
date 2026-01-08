-- ============================================================================
-- DEBUG: Verificar IDs de usuários entre auth.users e profiles
-- ============================================================================

-- 1. Ver todos os usuários na tabela auth.users
SELECT
  'AUTH.USERS' as tabela,
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC;

-- 2. Ver todos os profiles
SELECT
  'PROFILES' as tabela,
  id,
  email,
  full_name,
  tipo_usuario,
  nome_empresa,
  created_at
FROM public.profiles
ORDER BY created_at DESC;

-- 3. Encontrar usuários sem profile correspondente
SELECT
  'USUÁRIO SEM PROFILE' as status,
  au.id as auth_id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 4. Encontrar profiles sem usuário correspondente
SELECT
  'PROFILE SEM USUÁRIO' as status,
  p.id as profile_id,
  p.email,
  p.created_at
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL;
