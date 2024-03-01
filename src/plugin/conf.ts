import { GroupMessageEvent } from "@icqqjs/icqq";
import * as pluginModel from "@potato/bot/model/plugin.ts";
import botConf from "@potato/config/bot.json";
import { msgNoCmd, replyGroupMsg } from "../util/bot";

const info = {
  name: "设置",
  type: "plugin",
  defaultActive: true,
  plugin: plugin,
};

//bot设置
async function plugin(event: GroupMessageEvent) {
  const msg = msgNoCmd(event.raw_message, [botConf.trigger, info.name]);
  const secondCmd = [
    {
      name: "开启",
      comment: `功能：开启插件\n使用方式：${botConf.trigger}设置 开启 插件1 插件2`,
      auth: true,
      plugin: active,
    },
    {
      name: "关闭",
      comment: `功能：关闭插件\n使用方式：${botConf.trigger}设置 关闭 插件1 插件2`,
      auth: true,
      plugin: disable,
    },
    {
      name: "AI人格",
      comment: `功能：切换群聊AI人格\n使用方式：${botConf.trigger}设置 AI人格 人格名\n获取人格名：${botConf.trigger}帮助 AI人格列表`,
      auth: false,
      plugin: setPromptName,
    },
    {
      name: "自定义AI人格",
      auth: true,
      comment: `功能：切换群聊AI人格为自定义人格\n使用方式：${botConf.trigger}设置 自定义AI人格 人格内容`,
      plugin: setPrompt,
    },
  ];
  if (msg === "") {
    const reply = secondCmd
      .map(
        (cmd) =>
          `${cmd.name}\n${cmd.comment}\n需要管理员权限:${
            cmd.auth ? "是" : "否"
          }`
      )
      .join("\n");
    await replyGroupMsg(event, [reply], true);
    return;
  }
  for (const cmd of secondCmd) {
    if (!msg.startsWith(cmd.name)) {
      continue;
    }
    if (
      (cmd.auth && event.sender.role === "member") ||
      (cmd.auth && !botConf.admin.includes(event.sender.user_id))
    ) {
      await replyGroupMsg(
        event,
        ["您使用的命令需要群管理员权限，请联系群管理员。"],
        true
      );
    }
    cmd.plugin(cmd.name, event);
    break;
  }
}
//bot设置 AI人格
function setPromptName() {}

//bot设置 自定义AI人格
function setPrompt() {}

//bot设置 开启
async function active(message: string, event: GroupMessageEvent) {
  const msg = msgNoCmd(message, ["开启"]).split(" ");
  if (msg.length === 0) {
    await replyGroupMsg(
      event,
      [
        `命令错误，开启插件命令：\n${botConf.trigger}设置 开启 插件名1 插件名2 ...`,
      ],
      true
    );
    return;
  }
  const activeResult = await pluginSwitch(msg, event.group_id, true);
  if (activeResult.length === 0) {
    await replyGroupMsg(event, [`未搜索到需要开启的插件`], true);
    return;
  }
  await replyGroupMsg(event, [`已开启插件：${activeResult.join(" ")}`], true);
}

//bot设置 关闭
async function disable(message: string, event: GroupMessageEvent) {
  const msg = msgNoCmd(message, ["关闭"]).split(" ");
  if (msg.length === 0) {
    await replyGroupMsg(
      event,
      [
        `命令错误，关闭插件命令：\n${botConf.trigger}设置 关闭 插件名1 插件名2 ...`,
      ],
      true
    );
    return;
  }
  const activeResult = await pluginSwitch(msg, event.group_id, false);
  if (activeResult.length === 0) {
    await replyGroupMsg(event, [`未搜索到需要关闭的插件`], true);
    return;
  }
  await replyGroupMsg(event, [`已关闭插件：${activeResult.join(" ")}`], true);
}

async function pluginSwitch(
  pluginNames: string[],
  group_id: number,
  active: boolean
) {
  const switchedPluginNames = await Promise.all(
    pluginNames.map(async (pluginName) => {
      const updateResult = await pluginModel.update(
        group_id,
        pluginName,
        active
      );
      if (!updateResult) {
        return undefined;
      }
      return pluginName;
    })
  );
  return switchedPluginNames.filter(
    (name): name is string => name !== undefined
  );
}

export { info };
