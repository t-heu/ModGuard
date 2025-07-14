
import { Client, GuildMember, ChatInputCommandInteraction } from 'discord.js';

import { 
  handleAddChannel, 
  handleAddRole, 
  handleHelp, 
  handleRemoveChannel, 
  handleRemoveRole, 
  handleSetThreshold, 
  handleSetup,
  handleStatusStaff
} from '../commands';

import { config } from '../utils/config';

export async function handleCommand(
  interaction: ChatInputCommandInteraction,
  client: Client
) {
  const guild = interaction.guild;
  const member = interaction.member as GuildMember | null;
  const guildId = guild?.id;
  if (!guildId) return;

  if (!config.guildConfigs) config.guildConfigs = {};
  if (!config.guildConfigs[guildId]) {
    config.guildConfigs[guildId] = {
      logChannelIds: [],
      staffRoles: [],
      inactivityThresholdHours: 24,
      active: false,
    };
  }

  const guildConfig = config.guildConfigs[guildId];

  switch (interaction.commandName) {
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
      await handleStatusStaff(interaction, client);
      break;
  }
}
