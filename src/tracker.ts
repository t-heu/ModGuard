import fs from 'fs';
import {
  Guild,
  TextChannel,
  GuildMember,
  Collection,
  Snowflake
} from 'discord.js';

import { config, activity, activityPath } from './utils/config';
import { generateInactivityReport } from './utils/generateInactivityReport';

function isTextChannel(channel: any): channel is TextChannel {
  return channel?.type === 0;
}

export function trackActivity(member: GuildMember | null | undefined): void {
  if (!member || !member.id) return;

  activity[member.id] = Date.now();
  fs.writeFileSync(activityPath, JSON.stringify(activity, null, 2));
}

export async function checkInactivity(guild: Guild, botId: string): Promise<void> {
  const guildConfig = config.guildConfigs?.[guild.id];

  const logChannelIds = guildConfig?.logChannelIds || config.configDefault.logChannelId;
  const staffRoles = guildConfig?.staffRoles || config.configDefault.staffRoles;
  const thresholdHours = guildConfig?.inactivityThresholdHours || config.configDefault.inactivityThresholdHours;

  const threshold = Date.now() - thresholdHours * 60 * 60 * 1000;

  let channelsToLog: Collection<Snowflake, TextChannel>;

  if (logChannelIds === 'all') {
    channelsToLog = guild.channels.cache.filter(
      (c): c is TextChannel => c.isTextBased() && c.viewable && !c.isThread()
    );
  } else {
    channelsToLog = new Collection<Snowflake, TextChannel>();
    for (const id of logChannelIds) {
      const ch = guild.channels.cache.get(id);
      if (ch && isTextChannel(ch) && ch.viewable && !ch.isThread()) {
        channelsToLog.set(id, ch);
      }
    }
  }

  const membersCollection = await guild.members.fetch();

  // ❗ Ignora o próprio bot e outros bots
  const members = membersCollection.filter(member => !member.user.bot || member.id === botId);

  const { inativos, lista } = generateInactivityReport(
    guild,
    members,
    activity,
    threshold,
    staffRoles,
    botId // ✅ Ignora o próprio bot
  );

  if (inativos.size > 0) {
    const header = [
      `📊 Relatório de Inatividade — Servidor: ${guild.name}`,
      `⏰ Membros inativos há mais de ${thresholdHours}h`,
      `👥 Total: ${inativos.size} membro${inativos.size > 1 ? 's' : ''}`,
      ``
    ].join('\n');

    const fullMessage = `${header}\n${lista}`;

    try {
      const owner = await guild.fetchOwner();
      await owner.send(fullMessage);
    } catch {
      channelsToLog.forEach(channel => {
        channel.send(fullMessage).catch(() => {});
      });
    }
  }
}
