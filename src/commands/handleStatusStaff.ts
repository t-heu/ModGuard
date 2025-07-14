import { EmbedBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import { config, activity } from '../utils/config';

export async function handleStatusStaff(interaction: ChatInputCommandInteraction, client: Client) {
  const guild = interaction.guild;
  if (!guild) return;
  if (!client.user) return;

  const botId = client.user.id;

  const guildConfig = config.guildConfigs[guild.id] || {};
  const staffRoles = guildConfig.staffRoles || config.configDefault.staffRoles;
  const thresholdHours = guildConfig.inactivityThresholdHours || config.configDefault.inactivityThresholdHours;
  const threshold = Date.now() - thresholdHours * 60 * 60 * 1000;

  const membersCollection = await guild.members.fetch();

  // ❗ Ignora o próprio bot e outros bots
  const members = membersCollection.filter(member => !member.user.bot || member.id === botId);

  let inativos = 0;
  let acoesModeracao = 0; // Ajuste conforme sua implementação real
  let mensagensEnviadas = 0;
  let atividadeGeral = 0;

  members.forEach(member => {
    if (member.id === botId) return; // Ignora o próprio bot

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
