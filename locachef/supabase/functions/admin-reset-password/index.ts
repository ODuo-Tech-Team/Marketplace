// Edge Function para admin resetar senha de usuário
// Deploy: supabase functions deploy admin-reset-password

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Emails autorizados como admin
const ADMIN_EMAILS = [
  'mauricio.reis@oduo.com.br',
  'maumaureis0404@gmail.com'
]

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Criar cliente Supabase com service_role (tem permissão total)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Criar cliente com token do usuário para verificar quem está chamando
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } }
      }
    )

    // Verificar quem está chamando
    const { data: { user: callerUser }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se é admin
    if (!callerUser.email || !ADMIN_EMAILS.includes(callerUser.email)) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem resetar senhas.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Pegar dados do body
    const { userId, novaSenha } = await req.json()

    if (!userId || !novaSenha) {
      return new Response(
        JSON.stringify({ error: 'userId e novaSenha são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (novaSenha.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Senha deve ter pelo menos 6 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Atualizar senha do usuário usando admin client
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: novaSenha }
    )

    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError)
      return new Response(
        JSON.stringify({ error: `Erro ao atualizar senha: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Marcar senha_temporaria = true no profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ senha_temporaria: true })
      .eq('id', userId)

    if (profileError) {
      console.error('Erro ao marcar senha temporária:', profileError)
      // Não falha, senha já foi alterada
    }

    // 3. Deslogar o usuário (invalidar sessões)
    // Nota: Isso vai forçar o usuário a logar novamente
    await supabaseAdmin.auth.admin.signOut(userId, 'global')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Senha resetada com sucesso. Usuário foi deslogado.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro inesperado:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
