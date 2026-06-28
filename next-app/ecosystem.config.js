module.exports = {
  apps: [{
    name: 'jeval-app',
    script: 'npm',
    args: 'start',
    cwd: '/opt/jeval-frontend',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/jeval-frontend/error.log',
    out_file: '/var/log/jeval-frontend/out.log',
    log_file: '/var/log/jeval-frontend/combined.log',
    time: true
  }]
}