import { format } from 'date-fns';

function generateInactivityReport(
  guild: any,
  members: any,
  activity: Record<string, number>,
  threshold: number,
  staffRoles: string[] | 'all',
  botId: string
) {
  const inativos = members.filter((member: any) => {
    if (member.id === botId) return false; // Ignora o próprio bot

    let isStaff: boolean;
    if (staffRoles === 'all') {
      isStaff = member.roles.cache.some((role: any) => !role.managed && role.name !== '@everyone');
    } else {
      isStaff = member.roles.cache.some((role: any) => staffRoles.includes(role.name));
    }

    const lastSeen = activity[member.id] || 0;
    return isStaff && lastSeen < threshold;
  });

  const lista = inativos.size > 0
    ? inativos.map((m: any) => {
        const ts = activity[m.id] || 0;
        const date = ts ? format(new Date(ts), 'dd/MM/yyyy HH:mm') : 'sem registro';
        return `- ${m.user.tag} — Última atividade: ${date}`;
      }).join('\n')
    : 'Nenhum membro inativo.';

  return { inativos, lista };
}

export { generateInactivityReport };
