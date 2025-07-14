import { ChatInputCommandInteraction } from 'discord.js';

export async function handleHelp(interaction: ChatInputCommandInteraction) {
  const helpMessage = `
    **ModGuard - Comandos**

    /setup - Ativa o bot no servidor com canal, cargo e tempo
    /addchannel - Adiciona um canal de log
    /removechannel - Remove um canal de log
    /addrole - Adiciona um cargo da staff
    /removerole - Remove um cargo da staff
    /setthreshold - Define o tempo de inatividade (24/48/72h)
    /help - Mostra essa mensagem
  `;
  await interaction.reply({ content: helpMessage, flags: 64 });
}
