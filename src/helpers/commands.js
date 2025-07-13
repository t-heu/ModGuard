const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

const { config } = require('../utils/config');

function saveConfig() {
  fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
}

const path = './activity.json';
const activity = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {};

// Funções para os comandos
async function handleSetup(interaction, guildConfig, member, client) {
  if (!member.permissions.has('Administrator')) {
    return interaction.reply({ content: 'Você precisa ser administrador para usar este comando.', flags: 64 });
  }

  const canal = interaction.options.getChannel('canal');
  const cargo = interaction.options.getRole('cargo');
  const tempo = interaction.options.getInteger('tempo') || 24;

  guildConfig.logChannelIds = canal ? [canal.id] : 'all';
  guildConfig.staffRoles = cargo ? [cargo.name] : 'all';
  guildConfig.inactivityThresholdHours = tempo;
  guildConfig.active = true;
  saveConfig();

  client.user.setPresence({
    status: 'online',
    activities: [{ name: 'Monitorando a staff', type: 0 }]
  });

  await interaction.reply({
    content: `✅ Bot configurado com sucesso!\n• Canal: ${canal ? `<#${canal.id}>` : 'Todos os canais'}\n• Cargo: ${cargo ? cargo.name : 'Todos os cargos'}\n• Inatividade: ${tempo}h`,
    flags: 64
  });
}

async function handleHelp(interaction) {
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

async function handleAddChannel(interaction, guildConfig) {
  const canal = interaction.options.getChannel('canal');
  if (!guildConfig.logChannelIds.includes(canal.id)) {
    guildConfig.logChannelIds.push(canal.id);
    saveConfig();
    await interaction.reply({ content: `✅ Canal <#${canal.id}> adicionado.`, flags: 64 });
  } else {
    await interaction.reply({ content: `⚠️ Esse canal já está na lista.`, flags: 64 });
  }
}

async function handleRemoveChannel(interaction, guildConfig) {
  const canal = interaction.options.getChannel('canal');
  guildConfig.logChannelIds = guildConfig.logChannelIds.filter(id => id !== canal.id);
  saveConfig();
  await interaction.reply({ content: `❌ Canal <#${canal.id}> removido.`, flags: 64 });
}

async function handleAddRole(interaction, guildConfig) {
  const cargo = interaction.options.getRole('cargo');
  if (!guildConfig.staffRoles.includes(cargo.name)) {
    guildConfig.staffRoles.push(cargo.name);
    saveConfig();
    await interaction.reply({ content: `✅ Cargo "${cargo.name}" adicionado.`, flags: 64 });
  } else {
    await interaction.reply({ content: `⚠️ Cargo já está na lista.`, flags: 64 });
  }
}

async function handleRemoveRole(interaction, guildConfig) {
  const cargo = interaction.options.getRole('cargo');
  guildConfig.staffRoles = guildConfig.staffRoles.filter(role => role !== cargo.name);
  saveConfig();
  await interaction.reply({ content: `❌ Cargo "${cargo.name}" removido.`, flags: 64 });
}

async function handleSetThreshold(interaction, guildConfig) {
  const tempo = interaction.options.getInteger('tempo');
  guildConfig.inactivityThresholdHours = tempo;
  saveConfig();
  await interaction.reply({ content: `🕒 Tempo de inatividade definido para ${tempo} horas.`, flags: 64 });
}

async function statusStaff(interaction) {
  const guild = interaction.guild;
  const guildConfig = config.guildConfigs[guild.id] || {};
  const staffRoles = guildConfig.staffRoles || config.configDefault.staffRoles;
  const thresholdHours = guildConfig.inactivityThresholdHours || config.configDefault.inactivityThresholdHours;
  const threshold = Date.now() - thresholdHours * 60 * 60 * 1000;

  const members = await guild.members.fetch();
  let inativos = 0;
  let acoesModeracao = 0; // Suponha que você possa rastrear isso
  let mensagensEnviadas = 0;
  let atividadeGeral = 0;

  members.forEach(member => {
    let isStaff;
    if (staffRoles === 'all') {
      isStaff = member.roles.cache.some(role => !role.managed && role.name !== '@everyone');
    } else {
      isStaff = member.roles.cache.some(role => staffRoles.includes(role.name));
    }

    if (!isStaff) return;

    const lastSeen = activity[member.id] || 0;
    if (lastSeen < threshold) inativos++;
    mensagensEnviadas++; // Simulação, adapte se você tem contagem real
  });

  atividadeGeral = mensagensEnviadas + acoesModeracao;

  const embed = new EmbedBuilder()
    .setColor('#2C2F33')
    .setTitle('🛡️ Monitoramento da Staff')
    .addFields(
      { name: '👥 Membros inativos', value: `${inativos}`, inline: false },
      { name: '🛠️ Ações de moderação', value: `${acoesModeracao}`, inline: false },
      { name: '💬 Mensagens enviadas', value: `${mensagensEnviadas}`, inline: false },
      { name: '🔎 Atividade geral', value: `${atividadeGeral}`, inline: false },
    )
    .setTimestamp()
    .setFooter({ text: 'ModGuard', iconURL: 'https://i.imgur.com/yourIcon.png' }); // Use o ícone do bot aqui

  await interaction.reply({ embeds: [embed], components: [{
    type: 1,
    components: [{
      type: 2,
      label: 'Ver detalhes',
      style: 1,
      custom_id: 'ver_detalhes'
    }]
  }] });
}

module.exports = {
  handleAddChannel,
  handleAddRole,
  handleHelp,
  handleSetThreshold,
  handleSetup,
  handleRemoveChannel,
  handleRemoveRole,
  statusStaff
}
