import nodemailer from "nodemailer";

export async function enviarEmail(destinatario, assunto, mensagem) {
  try {
    console.log("==== Iniciando envio de email ====");
    console.log("Destinatário:", destinatario);
    console.log("Assunto:", assunto);
    console.log("Mensagem:", mensagem);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log("Transporte criado, testando conexão...");
    await transporter.verify();
    console.log("Conexão com SMTP verificada com sucesso!");

    const mailOptions = {
      from: `"TutorWay" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: assunto,
      html: mensagem,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Email enviado com sucesso! Informações:", info);
    console.log("==== Fim do envio de email ====");
  } catch (error) {
    console.error("Erro no envio do email:", error);
    throw error; 
  }
}
