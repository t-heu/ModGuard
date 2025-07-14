import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import {
  Guild,
  TextChannel,
  GuildMember,
  Collection,
  Snowflake
} from 'discord.js';

import configJson from '../data/config.json';

interface GuildConfig {
  logChannelIds: string | string[];
  staffRoles: string[] | 'all';
  inactivityThresholdHours: number;
  active: boolean;
}

interface Config {
  configDefault: {
    logChannelId: string | 'all';
    staffRoles: string[] | 'all';
    inactivityThresholdHours: number;
  };
  guildConfigs: {
    [guildId: string]: GuildConfig;
  };
}

const config: Config = configJson as Config;

const activityPath = path.resolve(__dirname, '../data/activity.json');

interface ActivityMap {
  [memberId: string]: number;
}

let activity: ActivityMap = {};
if (fs.existsSync(activityPath)) {
  const raw = fs.readFileSync(activityPath, 'utf-8');
  activity = JSON.parse(raw);
}

function isTextChannel(channel: any): channel is TextChannel {
  return channel?.type === 0; // 0 = GUILD_TEXT (discord.js v14)
}

export function trackActivity(member: GuildMember | null | undefined): void {
  if (!member || !member.id) return;

  activity[member.id] = Date.now();
  fs.writeFileSync(activityPath, JSON.stringify(activity, null, 2));
}

export async function checkInactivity(guild: Guild): Promise<void> {
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

  const members = await guild.members.fetch();

  const inativos = members.filter(member => {
    let isStaff: boolean;
    if (staffRoles === 'all') {
      isStaff = member.roles.cache.some(role => !role.managed && role.name !== '@everyone');
    } else {
      isStaff = member.roles.cache.some(role => staffRoles.includes(role.name));
    }

    const lastSeen = activity[member.id] || 0;
    return isStaff && lastSeen < threshold;
  });

  if (inativos.size > 0) {
    const list = inativos.map(m => {
      const ts = activity[m.id] || 0;
      const date = ts ? format(new Date(ts), 'dd/MM/yyyy HH:mm') : 'sem registro';
      return `- ${m.user.tag} — Última atividade: ${date}`;
    }).join('\n');

    const header = [
      `📊 Relatório de Inatividade — Servidor: ${guild.name}`,
      `⏰ Membros inativos há mais de ${thresholdHours}h`,
      `👥 Total: ${inativos.size} membro${inativos.size > 1 ? 's' : ''}`,
      ``
    ].join('\n');

    const fullMessage = `${header}\n${list}`;

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
