import { ChatInputCommandInteraction } from 'discord.js';
import { saveConfig } from '../utils/config';

export async function handleAddChannel(interaction: ChatInputCommandInteraction, guildConfig: any) {
  const canal = interaction.options.getChannel('canal');
  if (!canal) return;

  if (!guildConfig.logChannelIds.includes(canal.id)) {
    guildConfig.logChannelIds.push(canal.id);
    saveConfig();
    await interaction.reply({ content: `✅ Canal <#${canal.id}> adicionado.`, flags: 64 });
  } else {
    await interaction.reply({ content: `⚠️ Esse canal já está na lista.`, flags: 64 });
  }
}
