'use strict';
exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || 'NR-Demo-Cart-Service'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY || '',
  logging: { level: 'info' },
  allow_all_headers: true,
  distributed_tracing: { enabled: true },
  application_logging: {
    enabled: true,
    forwarding: { enabled: true },
    local_decorating: { enabled: true },
  },
  datastore_tracer: {
    instance_reporting: { enabled: true },
    database_name_reporting: { enabled: true },
  },
};
