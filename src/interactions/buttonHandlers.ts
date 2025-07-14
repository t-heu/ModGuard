import { ButtonInteraction, Client } from 'discord.js';

import { config, activity } from '../utils/config';
import { generateInactivityReport } from '../utils/generateInactivityReport';

export async function handleVerDetalhes(interaction: ButtonInteraction, client: Client) {
  try {
    if (!client.user) return;

    const botId = client.user.id;

    const guildConfig = config.guildConfigs[interaction.guild!.id] || config.configDefault;
    const staffRoles = guildConfig.staffRoles || [];
    const thresholdHours = guildConfig.inactivityThresholdHours || 24;
    const threshold = Date.now() - thresholdHours * 60 * 60 * 1000;

    const membersCollection = await interaction.guild!.members.fetch();

    // ❗ Ignora o próprio bot e outros bots
    const members = membersCollection.filter(member => !member.user.bot || member.id === botId);

    const { lista } = generateInactivityReport(
      interaction.guild!,
      members,
      activity,
      threshold,
      staffRoles,
      botId
    );

    await interaction.reply({
      content: `📋 **Detalhes dos membros inativos:**\n${lista}`,
      flags: 64,
    });
  } catch (err) {
    console.error('Erro no botão ver_detalhes:', err);
    if (!interaction.replied) {
      await interaction.reply({
        content: '❌ Ocorreu um erro ao buscar os dados.',
        flags: 64,
      });
    }
  }
}
