module.exports = {
  apps: [
    {
      name: 'solana-follower-bot',
      script: 'npm',
      args: 'start',
      log_date_format: 'YYYY-MM-DDTHH:mm:ss',
      out_file: './logs/out.log',      // Path for standard logs
      error_file: './logs/err.log',    // Path for error logs
      merge_logs: true,                 // Merge logs from all instances
    },
  ],
};