import { ChatInputCommandInteraction, GuildMember, Client } from 'discord.js';
import { saveConfig } from '../utils/config';

export async function handleSetup(
  interaction: ChatInputCommandInteraction,
  guildConfig: any,
  member: GuildMember | null,
  client: Client
) {
  if (!member?.permissions.has('Administrator')) {
    return interaction.reply({ content: 'Você precisa ser administrador para usar este comando.', flags: 64 });
  }

  const canal = interaction.options.getChannel('canal');
  const cargo = interaction.options.getRole('cargo');
  const tempo = interaction.options.getInteger('tempo') ?? 24;

  guildConfig.logChannelIds = canal ? [canal.id] : 'all';
  guildConfig.staffRoles = cargo ? [cargo.name] : 'all';
  guildConfig.inactivityThresholdHours = tempo;
  guildConfig.active = true;
  saveConfig();

  client.user?.setPresence({
    status: 'online',
    activities: [{ name: 'Monitorando a staff', type: 0 }]
  });

  await interaction.reply({
    content: `✅ Bot configurado com sucesso!\n• Canal: ${canal ? `<#${canal.id}>` : 'Todos os canais'}\n• Cargo: ${
      cargo ? cargo.name : 'Todos os cargos'
    }\n• Inatividade: ${tempo}h`,
    flags: 64
  });
}
