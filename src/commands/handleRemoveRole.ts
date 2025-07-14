import { ChatInputCommandInteraction } from 'discord.js';
import { saveConfig } from '../utils/config';

export async function handleRemoveRole(interaction: ChatInputCommandInteraction, guildConfig: any) {
  const cargo = interaction.options.getRole('cargo');
  if (!cargo) return;

  guildConfig.staffRoles = guildConfig.staffRoles.filter((role: string) => role !== cargo.name);
  saveConfig();
  await interaction.reply({ content: `❌ Cargo "${cargo.name}" removido.`, flags: 64 });
}
