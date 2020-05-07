const replCommands = ['.clear', '.exit', '.help', 'login', 'workbench', 'nim'];

const commanderCommands = [
  'api_get',
  'app_admins',
  'app_current',
  'app_desc',
  'app_info',
  'app_list',
  'app_log',
  'app_workbench',
  'app_rename',

  'channel_add',
  'channel_delete',
  'channel_list',

  'command_code',
  'command_coders',
  'command_params',
  'command_create',
  'command_copy',
  'command_delete',
  'command_desc',
  'command_log',
  'command_info',
  'command_list',
  'command_runners',
  'command_webhook',

  'csm_commands',
  'csm_create',
  'csm_delete',
  'csm_desc',
  'csm_export',
  'csm_info',
  'csm_install',
  'csm_list',
  'csm_uninstall',
  'csm_update',
  'csm',

  'group_create',
  'group_delete',
  'group_list',
  'group_members',

  'help',
  'register',

  'secret_add',
  'secret_create',
  'secret_delete',
  'secret_list',

  'task_channel',
  'task_create',
  'task_delete',
  'task_info',
  'task_list',
  'task_rate',
  'task_schedule',
  'task_start',
  'task_stop',

  'trigger_channel',
  'trigger_create',
  'trigger_delete',
  'trigger_disable',
  'trigger_enable',
  'trigger_info',
  'trigger_list',

  'user_log',

  'account_info',
  'account_upgrade',
  'activation_log',
  'csproxy_start',
  'csproxy_stop',
  'csproxy_info',
  'csproxy_install',
];

module.exports = {
  replCommands,
  commanderCommands,
};
