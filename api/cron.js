import indexnowHandler from './_crons/indexnow.js';
import remindersHandler from './_crons/reminders.js';
import automationsHandler from './_crons/automations.js';
import dailyDigestHandler from './_crons/daily-digest.js';
import blogHandler from './_crons/blog.js';

export default async function handler(req, res) {
  const { task } = req.query;
  console.log(`Running cron task: ${task}`);
  
  switch (task) {
    case 'indexnow':
      return indexnowHandler(req, res);
    case 'reminders':
      return remindersHandler(req, res);
    case 'automations':
      return automationsHandler(req, res);
    case 'daily-digest':
      return dailyDigestHandler(req, res);
    case 'blog':
      return blogHandler(req, res);
    default:
      return res.status(400).json({ error: `Unknown or missing task parameter: ${task}` });
  }
}
