import { GroupMessageEvent, segment } from "@icqqjs/icqq";
import botConf from "@potato/config/bot.json";
import { createFetch, fetchBuffer } from "../util/http";
import seeAnimeConf from "@potato/config/seeAnime.json";
import { z } from "zod";
import { msgNoCmd, replyGroupMsg } from "../util/bot";

const info = {
  name: "看二次元",
  type: "plugin",
  defaultActive: true,
  passive: false,
  comment: [
    `说明：看一张二次元图片`,
    `使用“${botConf.trigger}看二次元 图片描述”命令看一张二次元图片`,
  ],
  plugin: plugin,
};

//bot看二次元
async function plugin(event: GroupMessageEvent) {
  const msg = msgNoCmd(event.raw_message, [botConf.trigger, info.name]);
  if (msg === "") {
    await replyGroupMsg(event, [
      `未发现图片描述，请使用“${botConf.trigger}看二次元 图片描述”命令看一张二次元图片。`,
    ]);
    return;
  }
  const image = await search(msg.split(" "));
  if (image === undefined) {
    await replyGroupMsg(event, [`看图失败，请稍后重试或修改描述语`]);
    return;
  }
  await replyGroupMsg(event, [
    segment.image(`base64://${image.toString("base64")}`),
  ]);
}

async function search(tag: string[]) {
  const fetchImageInfo = await createFetch(seeAnimeConf.api, 20000, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tag: tag,
      r18: "0",
      num: "1",
    }),
  })
    .then(async (resp) => resp?.json())
    .catch((_) => undefined);
  const imageInfoSchema = z.object({
    data: z
      .array(z.object({ urls: z.object({ original: z.string() }) }))
      .min(1),
  });
  const safeImageInfo = imageInfoSchema.safeParse(fetchImageInfo);
  if (!safeImageInfo.success) {
    return undefined;
  }
  const data = safeImageInfo.data.data[0];
  if (data === undefined) {
    return undefined;
  }
  return fetchBuffer(data.urls.original);
}

export { info };
