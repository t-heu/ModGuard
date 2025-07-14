import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.resolve(__dirname, '../../data/config.json');

interface GuildConfig {
  logChannelIds: string[] | 'all';
  staffRoles: string[] | 'all';
  inactivityThresholdHours: number;
  active?: boolean;
}

interface Config {
  config: {
    inactivityThresholdHours: number[];
  };
  configDefault: {
    logChannelId: string | 'all';
    staffRoles: string[] | 'all';
    inactivityThresholdHours: number;
  };
  guildConfigs: Record<string, GuildConfig>;
}

let config: Config;

if (fs.existsSync(CONFIG_PATH)) {
  const rawData = fs.readFileSync(CONFIG_PATH, 'utf-8');
  config = JSON.parse(rawData) as Config;
} else {
  config = {
    config: {
      inactivityThresholdHours: [24, 48, 72]
    },
    configDefault: {
      logChannelId: 'all',
      staffRoles: ['all'],
      inactivityThresholdHours: 24
    },
    guildConfigs: {}
  };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function saveConfig() {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

const activityPath = path.resolve(__dirname, '../../data/activity.json');

interface ActivityMap {
  [memberId: string]: number;
}

let activity: ActivityMap = {};
if (fs.existsSync(activityPath)) {
  const raw = fs.readFileSync(activityPath, 'utf-8');
  activity = JSON.parse(raw);
}

export { config, saveConfig, activity, activityPath };
