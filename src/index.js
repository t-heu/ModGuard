require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');

const { trackActivity, checkInactivity } = require('./tracker');
const { registerCommands } = require('./helpers/registerCommands');
const { 
  handleAddChannel, 
  handleAddRole, 
  handleHelp, 
  handleRemoveChannel, 
  handleRemoveRole, 
  handleSetThreshold, 
  handleSetup,
  statusStaff
} = require('./helpers/commands');

const { config } = require('./utils/config');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.User, Partials.Message, Partials.Channel],
  presence: {
    status: 'invisible',
    activities: []
  }
});

client.on('guildCreate', guild => {
  console.log(`✅ Registrados no servidor ${guild.name} ${guild.id}`);
  registerCommands(client.user.id, guild.id);
});

client.once('ready', async () => {
  console.log(`✅ ModGuard ativo como ${client.user.tag}`);

  // Verifica se há pelo menos uma guild ativa
  const temGuildaAtiva = Object.values(config.guildConfigs).some(cfg => cfg.active === true);
  
  if (temGuildaAtiva) {
    client.user.setPresence({
      status: 'online',
      activities: [{ name: 'Monitorando a staff', type: 0 }] 
    });
  }

  // Registrar comandos em todos os servidores já existentes
  for (const [guildId] of client.guilds.cache) {
    await registerCommands(client.user.id, guildId);
  }

  // Rodar checagem só para guildas ativas
  setInterval(() => {
    for (const [guildId, guildConfig] of Object.entries(config.guildConfigs)) {
      if (guildConfig.active) {
        const guild = client.guilds.cache.get(guildId);
        if (guild) checkInactivity(guild);
      }
    }
  }, 1000 * 60 * 60); // a cada 1 hora
});

// Rastrear mensagens só se guild ativa
client.on('messageCreate', message => {
  if (message.author.bot) return;

  const guildId = message.guildId;
  const guildConfig = config.guildConfigs[guildId];

  if (guildConfig && guildConfig.active) {
    trackActivity(message.member);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, guild, member } = interaction;
  if (!guild) {
    return interaction.reply({ content: 'Comandos só podem ser usados em servidores.', flags: 64 });
  }

  const guildId = guild.id;

  // Garante estrutura inicial
  if (!config.guildConfigs) config.guildConfigs = {};
  if (!config.guildConfigs[guildId]) {
    config.guildConfigs[guildId] = {
      logChannelIds: [],
      staffRoles: [],
      inactivityThresholdHours: 24
    };
  }

  const guildConfig = config.guildConfigs[guildId];

  switch (commandName) {
    case 'setup':
      await handleSetup(interaction, guildConfig, member, client);
      break;
    case 'help':
      await handleHelp(interaction);
      break;
    case 'addchannel':
      await handleAddChannel(interaction, guildConfig);
      break;
    case 'removechannel':
      await handleRemoveChannel(interaction, guildConfig);
      break;
    case 'addrole':
      await handleAddRole(interaction, guildConfig);
      break;
    case 'removerole':
      await handleRemoveRole(interaction, guildConfig);
      break;
    case 'setthreshold':
      await handleSetThreshold(interaction, guildConfig);
      break;
    case 'statusstaff':
      await statusStaff(interaction);
      break;
  }
});

client.on('guildDelete', guild => {
  const guildId = guild.id;

  if (config.guildConfigs[guildId]?.ativo) {
    console.log(`🔴 Bot foi removido do servidor ${guild.name} (${guild.id})`);
    config.guildConfigs[guildId].active = false;
    saveConfig();
  }
});

client.login(process.env.TOKEN_BOT_SECRET);
