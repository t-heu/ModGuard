import { EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import fs from 'fs';
import path from 'path';

import { config } from '../utils/config';

const activityPath = path.resolve(__dirname, '../../data/activity.json');

const activity: Record<string, number> = fs.existsSync(activityPath)
  ? JSON.parse(fs.readFileSync(activityPath, 'utf-8'))
  : {}; 

export async function handleStatusStaff(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild;
  if (!guild) return;

  const guildConfig = config.guildConfigs[guild.id] || {};
  const staffRoles = guildConfig.staffRoles || config.configDefault.staffRoles;
  const thresholdHours = guildConfig.inactivityThresholdHours || config.configDefault.inactivityThresholdHours;
  const threshold = Date.now() - thresholdHours * 60 * 60 * 1000;

  const members = await guild.members.fetch();

  let inativos = 0;
  let acoesModeracao = 0; // Ajuste conforme sua implementação real
  let mensagensEnviadas = 0;
  let atividadeGeral = 0;

  members.forEach(member => {
    let isStaff = false;
    if (staffRoles === 'all') {
      isStaff = member.roles.cache.some(role => !role.managed && role.name !== '@everyone');
    } else {
      isStaff = member.roles.cache.some(role => staffRoles.includes(role.name));
    }

    if (!isStaff) return;

    const lastSeen = activity[member.id] || 0;
    if (lastSeen < threshold) inativos++;
    mensagensEnviadas++; // Simulação - adapte se tiver contagem real
  });

  atividadeGeral = mensagensEnviadas + acoesModeracao;

  const embed = new EmbedBuilder()
    .setColor('#2C2F33')
    .setTitle('🛡️ Monitoramento da Staff')
    .addFields(
      { name: '👥 Membros inativos', value: `${inativos}`, inline: false },
      { name: '🛠️ Ações de moderação', value: `${acoesModeracao}`, inline: false },
      { name: '💬 Mensagens enviadas', value: `${mensagensEnviadas}`, inline: false },
      { name: '🔎 Atividade geral', value: `${atividadeGeral}`, inline: false }
    )
    .setTimestamp()
    .setFooter({ text: 'ModGuard', iconURL: 'https://raw.githubusercontent.com/t-heu/ModGuard/refs/heads/main/docs/logo.png' });

  await interaction.reply({
    embeds: [embed],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: 'Ver detalhes',
            style: 1,
            custom_id: 'ver_detalhes'
          }
        ]
      }
    ]
  });
}
