import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
    const sobrenome = typeof body?.sobrenome === "string" ? body.sobrenome.trim() : "";
    const telefone = typeof body?.telefone === "string" ? body.telefone.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const senha = typeof body?.senha === "string" ? body.senha.trim() : "";
    const role = typeof body?.role === "string" ? body.role : "aluno";
    const signature = typeof body?.signature === "string" ? body.signature : "ativo";
    const emailpai = typeof body?.emailpai === "string" ? body.emailpai.trim().toLowerCase() : "";
    const emailaluno = typeof body?.emailaluno === "string" ? body.emailaluno.trim().toLowerCase() : "";

    if (!nome || !telefone) {
      return new Response(JSON.stringify({ error: "Nome e telefone são obrigatórios." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (senha && !email) {
      return new Response(JSON.stringify({ error: "Informe o e-mail para criar senha de acesso." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Configuração do Supabase ausente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    let userId = "";

    if (email && senha) {
      const { data: existingProfile, error: existingError } = await supabase
        .from("tbf_controle_user")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existingError) {
        return new Response(JSON.stringify({ error: "Erro ao verificar e-mail." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (existingProfile) {
        return new Response(JSON.stringify({ error: "E-mail já cadastrado." }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: createdAuth, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
        user_metadata: {
          first_name: nome,
          last_name: sobrenome,
        },
      });

      if (authError || !createdAuth.user) {
        return new Response(JSON.stringify({ error: "Erro ao criar usuário no Auth." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = createdAuth.user.id;
    } else {
      userId = crypto.randomUUID();
    }

    const { data: createdProfile, error: profileError } = await supabase
      .from("tbf_controle_user")
      .insert({
        id: userId,
        nome,
        sobrenome,
        email,
        telefone,
        signature,
        role,
        emailpai,
        emailaluno,
      })
      .select("id, nome, sobrenome, email, telefone, signature, role, created_at")
      .single();

    if (profileError || !createdProfile) {
      return new Response(JSON.stringify({ error: "Erro ao salvar perfil do usuário." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ user: createdProfile }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Erro ao processar solicitação." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
