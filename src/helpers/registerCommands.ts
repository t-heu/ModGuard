import { REST, Routes, SlashCommandBuilder } from 'discord.js';

export async function registerCommands(clientId: string, guildId: string): Promise<void> {
  const commands = [
    new SlashCommandBuilder()
      .setName('setup')
      .setDescription('Configura o bot para este servidor')
      .addChannelOption(option =>
        option
          .setName('canal')
          .setDescription('Canal para envio dos relatórios')
          .setRequired(false)
      )
      .addRoleOption(option =>
        option
          .setName('cargo')
          .setDescription('Cargo da staff que será monitorado')
          .setRequired(false)
      )
      .addIntegerOption(option =>
        option
          .setName('tempo')
          .setDescription('Tempo de inatividade (em horas)')
          .setRequired(false)
          .addChoices(
            { name: '24h', value: 24 },
            { name: '48h', value: 48 },
            { name: '72h', value: 72 }
          )
      ),
    new SlashCommandBuilder()
      .setName('addchannel')
      .setDescription('Adiciona um canal para log')
      .addChannelOption(option =>
        option
          .setName('canal')
          .setDescription('Canal para adicionar')
          .setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('removechannel')
      .setDescription('Remove um canal de log')
      .addChannelOption(option =>
        option
          .setName('canal')
          .setDescription('Canal para remover')
          .setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('addrole')
      .setDescription('Adiciona um cargo da staff')
      .addRoleOption(option =>
        option
          .setName('cargo')
          .setDescription('Cargo a adicionar')
          .setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('removerole')
      .setDescription('Remove um cargo da staff')
      .addRoleOption(option =>
        option
          .setName('cargo')
          .setDescription('Cargo a remover')
          .setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('setthreshold')
      .setDescription('Define o tempo de inatividade')
      .addIntegerOption(option =>
        option
          .setName('tempo')
          .setDescription('Tempo (em horas)')
          .setRequired(true)
          .addChoices(
            { name: '24h', value: 24 },
            { name: '48h', value: 48 },
            { name: '72h', value: 72 }
          )
      ),
    new SlashCommandBuilder()
      .setName('statusstaff')
      .setDescription('Exibe o monitoramento da staff'),
    new SlashCommandBuilder()
      .setName('help')
      .setDescription('Mostra ajuda sobre o bot')
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN_BOT_SECRET ?? '');

  try {
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );
    console.log(`✅ Comandos registrados no servidor ${guildId}`);
  } catch (error) {
    console.error('❌ Erro ao registrar comandos:', error);
  }
}
