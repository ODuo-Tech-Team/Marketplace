-- ============================================================================
-- FIX: Trigger para criar profile automaticamente ao cadastrar usuário
-- ============================================================================

-- 1. Criar função que será chamada pelo trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, tipo_usuario, nome_empresa)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'locatario'),
    COALESCE(NEW.raw_user_meta_data->>'nome_empresa', NULL)
  );
  RETURN NEW;
END;
$$;

-- 2. Criar trigger que dispara após inserção na tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Popular profiles para usuários existentes que não têm profile
INSERT INTO public.profiles (id, email, full_name, tipo_usuario)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  COALESCE(au.raw_user_meta_data->>'tipo_usuario', 'locatario')
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 4. Verificar se funcionou
SELECT
  '✅ Total de usuários: ' || COUNT(*) as usuarios_auth
FROM auth.users;

SELECT
  '✅ Total de profiles: ' || COUNT(*) as usuarios_profiles
FROM public.profiles;

-- Se os números forem iguais, está OK!
