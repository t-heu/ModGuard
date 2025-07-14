import { ButtonInteraction } from 'discord.js';
import fs from 'fs';
import path from 'path';

import { config } from '../utils/config';

const activityPath = path.resolve(__dirname, '../data/activity.json');
const activity: Record<string, number> = fs.existsSync(activityPath)
  ? JSON.parse(fs.readFileSync(activityPath, 'utf-8'))
  : {};

export async function handleVerDetalhes(interaction: ButtonInteraction) {
  try {
    const guildConfig = config.guildConfigs[interaction.guild!.id] || config.configDefault;
    const staffRoles = guildConfig.staffRoles || [];
    const thresholdHours = guildConfig.inactivityThresholdHours || 24;
    const threshold = Date.now() - thresholdHours * 60 * 60 * 1000;

    const members = await interaction.guild!.members.fetch();

    const inativos = members.filter(member => {
      let isStaff: boolean;
      if (staffRoles === 'all') {
        isStaff = member.roles.cache.some(role => !role.managed && role.name !== '@everyone');
      } else {
        isStaff = member.roles.cache.some(role => staffRoles.includes(role.name));
      }
      const lastSeen = activity[member.id] || 0;
      return isStaff && lastSeen < threshold;
    });

    const lista = inativos.size > 0
      ? inativos.map(m => `- ${m.user.tag}`).join('\n')
      : 'Nenhum membro inativo.';

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
