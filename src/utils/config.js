const fs = require('fs');

const CONFIG_PATH = './config.json';

// Carrega o config.json ou cria padrão se não existir
let config;
if (fs.existsSync(CONFIG_PATH)) {
  config = JSON.parse(fs.readFileSync(CONFIG_PATH));
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

module.exports = {config}