import { ChatInputCommandInteraction } from 'discord.js';
import { saveConfig } from '../utils/config';

export async function handleRemoveChannel(interaction: ChatInputCommandInteraction, guildConfig: any) {
  const canal = interaction.options.getChannel('canal');
  if (!canal) return;

  guildConfig.logChannelIds = guildConfig.logChannelIds.filter((id: string) => id !== canal.id);
  saveConfig();
  await interaction.reply({ content: `❌ Canal <#${canal.id}> removido.`, flags: 64 });
}
