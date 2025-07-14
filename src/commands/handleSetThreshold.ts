import { ChatInputCommandInteraction } from 'discord.js';
import { saveConfig } from '../utils/config';

export async function handleSetThreshold(interaction: ChatInputCommandInteraction, guildConfig: any) {
  const tempo = interaction.options.getInteger('tempo');
  if (!tempo) return;

  guildConfig.inactivityThresholdHours = tempo;
  saveConfig();
  await interaction.reply({ content: `🕒 Tempo de inatividade definido para ${tempo} horas.`, flags: 64 });
}
