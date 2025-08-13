import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

import { enviarEmail } from './email.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const PORT = process.env.PORT || 3000;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const app = express();
app.use(cors());
app.use(express.json());

//== USUÁRIOS ==\\

// Listar usuários
app.get("/api/usuarios", async (req, res) => {
  const { data, error } = await supabase.from("usuarios").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Criar usuário e enviar email de boas-vindas
app.post("/api/usuarios/criar", async (req, res) => {
  try {
    let { email, nome, senha, tipo } = req.body;
    console.log("Recebido no backend:", req.body);

    // Tipo padrão
    tipo = tipo || "usuario";

    // Validação de campos obrigatórios
    if (!email || !nome || !senha) {
      return res.status(400).json({ error: "Nome, email e senha são obrigatórios" });
    }

    // Criptografar senha
    const hashedSenha = await bcrypt.hash(senha, 10);

    // Inserir usuário no Supabase
    const { data, error } = await supabase.from("usuarios").insert([
      { nome, email, senha: hashedSenha, tipo }
    ]);

    console.log("Resultado do insert:", { data, error });

    if (error) {
      console.error("❌ Erro Supabase:", error);
      if (error.message.includes("duplicate key value")) {
        return res.status(409).json({ error: "E-mail já cadastrado." });
      }
      return res.status(500).json({ error: "Erro ao inserir usuário no banco", detalhes: error.message });
    }

    // Enviar email de boas-vindas (não bloqueia o envio da resposta)
    const mensagem = `
      <h2>Bem-vindo(a), ${nome}</h2>
      <p>Seu cadastro foi realizado com sucesso!</p>
      <p>Estamos felizes em tê-lo(a) conosco.</p>
    `;
    enviarEmail(email, "Boas-vindas ao TutorWay", mensagem)
      .then(() => console.log("📧 Email enviado com sucesso"))
      .catch(err => console.error("❌ Falha ao enviar email:", err));

    res.status(201).json({ message: "Usuário criado com sucesso!" });
  } catch (err) {
    console.error("Erro inesperado:", err);
    res.status(500).json({ error: "Erro ao criar usuário", detalhes: err.message });
  }
});

// Login
app.post("/api/usuarios/login", async (req, res) => {
  const { email, senha } = req.body;

  const { data: usuarios, error } = await supabase.from("usuarios").select("*").eq("email", email);

  if (error || !usuarios || usuarios.length === 0) {
    return res.status(401).json({ error: "Email ou senha incorretos." });
  }

  const usuario = usuarios[0];
  const senhaValida = await bcrypt.compare(senha, usuario.senha);

  if (!senhaValida) {
    return res.status(401).json({ error: "Email ou senha incorretos." });
  }

  const { senha: _, ...usuarioSemSenha } = usuario;
  res.json(usuarioSemSenha);
});

// Atualizar usuário
app.put("/api/usuarios/atualizar/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, email, senha, dataNascimento, tipo } = req.body;

  try {
    let fieldsToUpdate = { nome, email, dataNascimento, tipo };

    if (senha && senha.trim() !== "") {
      fieldsToUpdate.senha = await bcrypt.hash(senha, 10);
    }

    const { data, error } = await supabase.from("usuarios").update(fieldsToUpdate).eq("id", Number(id)).select();

    if (error) return res.status(400).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Usuário não encontrado." });

    res.json(data[0]);
  } catch (err) {
    console.error("Erro ao atualizar usuário:", err);
    res.status(500).json({ error: "Erro ao atualizar usuário.", detalhes: err.message });
  }
});

// Deletar usuário
app.delete("/api/usuarios/apagar/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("usuarios").delete().eq("id", id);
  if (error) return res.status(400).json({ error: error.message });

  res.json({ message: "Usuário excluído com sucesso." });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
});
