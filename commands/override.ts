import { Context } from "../util";

interface DiscordOverride {
  targetBuildOverride: Record<string, object>;
  releaseChannel: string;
  validForUserIds: string[];
  allowLoggedOut: boolean;
  expiresAt: string;
}

interface FireOverride {
  bucket: number;
  experiment: number;
  id: number;
  releaseChannel: string;
  validForUserIds: string[];
}

export default function ({ message, args, api }: Context) {
  if (!args.length)
    return api.createMessage(message.channel_id, { content: "Please specify an override URL" });

  let url: URL;
  try {
    url = new URL(args.join(" "));
  } catch {
    return api.createMessage(message.channel_id, { content: "Invalid URL" });
  }

  const param = url.searchParams.get("s");
  if (url.host === "discord.com" || url.host === "discordapp.com") {
    const [, encoded] = param.split(".");
    if (!encoded) return api.createMessage(message.channel_id, { content: "Invalid Parameter" });

    let decoded: string;
    try {
      decoded = Buffer.from(encoded, "base64").toString();
    } catch {
      return api.createMessage(message.channel_id, { content: "Invalid Base64" });
    }

    let data: DiscordOverride;
    try {
      data = JSON.parse(decoded);
    } catch {
      return api.createMessage(message.channel_id, { content: "Invalid JSON" });
    }

    const fields = Object.entries(data.targetBuildOverride).map(([platform, target]) => ({
      name: platform,
      //@ts-ignore im lazy
      value: "`" + target.type + "` " + target.id
    }));

    api.createMessage(message.channel_id, {
      content: "```json\n" + JSON.stringify(data, null, 2) + "```",
      embeds: [
        {
          timestamp: new Date(data.expiresAt),
          footer: {
            text: "Expires"
          },
          fields: [
            {
              name: "Users",
              value: data.validForUserIds.join("\n") || "None",
              inline: true
            },
            {
              name: "Release Channel",
              value: data.releaseChannel ?? "None",
              inline: true
            },
            {
              name: "Allow Logged Out",
              value: data.allowLoggedOut ? "Yes" : "No",
              inline: true
            },
            ...fields
          ]
        }
      ]
    });
  } else if (url.host === "inv.wtf") {
    let decoded: string;
    try {
      decoded = Buffer.from(param, "base64").toString();
    } catch {
      return api.createMessage(message.channel_id, { content: "Invalid Base64" });
    }

    let data: FireOverride;
    try {
      data = JSON.parse(decoded);
    } catch {
      return api.createMessage(message.channel_id, { content: "Invalid JSON" });
    }

    api.createMessage(message.channel_id, {
      content: "```json\n" + JSON.stringify(data, null, 2) + "```",
      embeds: [
        {
          fields: [
            {
              name: "ID",
              value: data.id.toString(),
              inline: true
            },
            {
              name: "Bucket",
              value: data.bucket.toString(),
              inline: true
            },
            {
              name: "Experiment",
              value: data.experiment.toString(),
              inline: true
            },
            {
              name: "Release Channel",
              value: data.releaseChannel ?? "None"
            },
            {
              name: "Users",
              value: data.validForUserIds.join("\n") || "None"
            }
          ]
        }
      ]
    });
  } else return api.createMessage(message.channel_id, { content: "Invalid origin" });
}