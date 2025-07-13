const fs = require('fs');
const path = '../activity.json';
const config = require('../config.json');

let activity = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {};

function trackActivity(member) {
  if (!member || !member.id) return;

  activity[member.id] = Date.now();
  fs.writeFileSync(path, JSON.stringify(activity, null, 2));
}

function checkInactivity(guild) {
  const guildConfig = config.guildConfigs[guild.id];

  // Configuração padrão se não existir
  const logChannelIds = guildConfig?.logChannelIds || config.configDefault.logChannelId;
  const staffRoles = guildConfig?.staffRoles || config.configDefault.staffRoles;
  const thresholdHours = guildConfig?.inactivityThresholdHours || config.configDefault.inactivityThresholdHours;

  const threshold = Date.now() - thresholdHours * 60 * 60 * 1000;

  // Decidir canais para logs
  let channelsToLog;
  if (logChannelIds === 'all') {
    // Todos canais de texto visíveis
    channelsToLog = guild.channels.cache.filter(c => c.type === 0 && c.viewable);
  } else {
    // Apenas canais configurados
    channelsToLog = logChannelIds
      .map(id => guild.channels.cache.get(id))
      .filter(ch => ch && ch.type === 0 && ch.viewable);
  }

  // Filtrar membros staff
  guild.members.fetch().then(members => {
    const inativos = members.filter(member => {
      // Se staffRoles é "all", aceitar qualquer cargo exceto @everyone e bots
      let isStaff;
      if (staffRoles === 'all') {
        isStaff = member.roles.cache.some(role => !role.managed && role.name !== '@everyone');
      } else {
        isStaff = member.roles.cache.some(role => staffRoles.includes(role.name));
      }
      const lastSeen = activity[member.id] || 0;
      return isStaff && lastSeen < threshold;
    });

    if (inativos.size > 0) {
      const list = inativos.map(m => `- ${m.user.tag}`).join('\n');
      // Enviar mensagem em todos canais selecionados
      channelsToLog.forEach(channel => {
        channel.send(`⚠️ Membros da staff inativos há mais de ${thresholdHours}h:\n${list}`);
      });
    }
  });
}

module.exports = { trackActivity, checkInactivity };
