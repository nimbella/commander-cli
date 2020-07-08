// Copyright (c) 2020-present, Nimbella, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const replCommands = [
  '.clear',
  '.exit',
  '.help',
  'login',
  'workbench',
  'nim',
  'command_set',
];

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
