import autobind from "autobind-decorator";
import Module from "@/module";
import Message from "@/message";
import serifs from "@/serifs";
import config from "@/config";
import { graphql } from "@octokit/graphql";

export default class extends Module {
	public readonly name = "request";

	@autobind
	public install() {
		return {
			mentionHook: this.mentionHook,
		};
	}

	@autobind
	private async mentionHook(msg: Message) {
		let text = msg.extractedText.toLowerCase();
		if (!text.startsWith("req")) return false;

		if (text.match(/^(.+?)\s(.+)/)) {
			text = text.replace(/^(.+?)\s/, "");
		} else {
			text = "";
		}

		const separatorIndex =
			text.indexOf(" ") > -1 ? text.indexOf(" ") : text.indexOf("\n");
		const thing = text.substr(separatorIndex + 1).trim();

		if (
			(thing === "" && msg.quoteId == null) ||
			msg.visibility === "followers"
		) {
			msg.reply(serifs.req.invalid);
			return {
				reaction: "🆖",
				immediate: true,
			};
		}

		await this.sendRequest(thing);

		msg.reply(serifs.req.reply);

		return {
			reaction: "🆗",
			immediate: true,
		};
	}

	@autobind
	private async sendRequest(thing: string) {
		const graphqlWithAuth = graphql.defaults({
			headers: {
				authorization: `token ${config.githubAccessToken}`,
			},
		});

		const query = `
		mutation {
			addProjectV2DraftIssue(input: {
				projectId:${config.githubProjectId},
				title:${thing},
				body: "",
			}) {
				projectItem {
					id
				}
			}
		}
		`;

		try {
			await graphqlWithAuth(query, { login: "KingYoSun" });
			return true;
		} catch (e) {
			this.log(e);
			return false;
		}
	}
}
