import 'dotenv/config';
import { enviarEmail } from './email.js';

(async () => {
  try {
    await enviarEmail(
      'juanmateus565@gmail.com',
      'Teste envio email - TutorWay',
      '<h1>Esse é um teste de email</h1><p>Se você recebeu, está funcionando!</p>'
    );
    console.log("Teste concluído com sucesso!");
  } catch (error) {
    console.error("Erro no teste de envio:", error);
  }
})();
