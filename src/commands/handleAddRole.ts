import { ChatInputCommandInteraction } from 'discord.js';
import { saveConfig } from '../utils/config';

export async function handleAddRole(interaction: ChatInputCommandInteraction, guildConfig: any) {
  const cargo = interaction.options.getRole('cargo');
  if (!cargo) return;

  if (!guildConfig.staffRoles.includes(cargo.name)) {
    guildConfig.staffRoles.push(cargo.name);
    saveConfig();
    await interaction.reply({ content: `✅ Cargo "${cargo.name}" adicionado.`, flags: 64 });
  } else {
    await interaction.reply({ content: `⚠️ Cargo já está na lista.`, flags: 64 });
  }
}
