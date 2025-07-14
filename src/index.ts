import 'dotenv/config';
import { Client, GatewayIntentBits, Partials, Guild } from 'discord.js';

import { trackActivity, checkInactivity } from './tracker';
import { registerCommands } from './helpers/registerCommands';

import { handleVerDetalhes } from './interactions/buttonHandlers';
import { handleCommand } from './interactions/commandHandler';

import { config, saveConfig } from './utils/config';

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

client.on('guildCreate', async (guild: Guild) => {
  console.log(`✅ Registrados no servidor ${guild.name} ${guild.id}`);
  if (client.user) {
    await registerCommands(client.user.id, guild.id);
  }
});

client.once('ready', async () => {
  console.log(`✅ ModGuard ativo como ${client.user?.tag}`);

  const hasActiveGuild  = Object.values(config.guildConfigs).some(cfg => cfg.active === true);

  if (hasActiveGuild && client.user) {
    await client.user.setPresence({
      status: 'online',
      activities: [{ name: 'Monitorando a staff', type: 0 }]
    });
  }

  for (const [guildId] of client.guilds.cache) {
    await registerCommands(client.user!.id, guildId);
  }

  // Rodar checagem a cada 1 hora
  setInterval(async () => {
    for (const [guildId, guildConfig] of Object.entries(config.guildConfigs)) {
      if (guildConfig.active) {
        const guild = client.guilds.cache.get(guildId);
        if (guild) {
          try {
            await checkInactivity(guild);
          } catch (error) {
            console.error(`Erro ao checar inatividade no servidor ${guildId}:`, error);
          }
        }
      }
    }
  }, 1000 * 60 * 60);
});

client.on('messageCreate', message => {
  if (message.author.bot) return;

  const guildId = message.guildId;
  if (!guildId) return;

  const guildConfig = config.guildConfigs[guildId];
  if (guildConfig?.active) {
    trackActivity(message.member ?? null);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton() && interaction.customId === 'ver_detalhes' && interaction.guild) {
    await handleVerDetalhes(interaction);
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  await handleCommand(interaction, client);
});

client.on('guildDelete', (guild: Guild) => {
  const guildId = guild.id;

  if (config.guildConfigs[guildId]?.active) {
    console.log(`🔴 Bot foi removido do servidor ${guild.name} (${guild.id})`);
    config.guildConfigs[guildId].active = false;
    saveConfig();
  }
});

client.login(process.env.TOKEN_BOT_SECRET);
