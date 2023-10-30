const axios = require("axios").default;
const FormData = require("form-data");
const config = require("../config.json");

module.exports = {
	data: new SlashCommandBuilder()
        .setName('private_upload')
        .setDescription('(プライベート)ファイルをcdnにアップロード')
        .addAttachmentOption(option =>
            option
                .setName("file")
                .setRequired(true)
                .setDescription("アップロードするファイル"))
        .addStringOption(option =>
            option
                .setName("filename")
                .setDescription("ファイル名")
        ),
    execute: async function (interaction) {
        if (!config.cdnUploadURL || !config.uploadAllowUsers) {
            return interaction.reply("内部エラー (missing config.json)");
        }
        if (!config.uploadAllowUsers.includes(interaction.user.id)) {
            return interaction.reply({
                content: "ねえ君権限ないよ？ざぁこざぁこ♡www権限ないのに好奇心でコマンド実行しちゃうなんてかわいいね",
                ephemeral: true
            });
        }
        await interaction.deferReply();
        const file = interaction.options.getAttachment("file")
        try {
            let res = await axios.get(file.proxyURL, {
                responseType: "stream"
            });
            const form = new FormData()
            let filename = interaction.options.get("filename")?.value;
            form.append('file', res.data, filename || file.name)
            let res2 = await axios.post(config.cdnUploadURL2, form, { headers: form.getHeaders() });
            if (!res2.data?.success) throw new Error();
            interaction.editReply(`/private/${res2.data.fileName} としてアップロードしました！`);
			const user = interaction.user
			const dmChannel = await user.createDM();
			dmChannel.send({
				embeds: [{
					title: `${res2.data.fileName}がアップロードされました!`,
					color: 0x5865f2,
					fields: [{
						name: "URL",
						value: "```" + `https://cdn.mcsv.life/private/${res2.data.fileName}` + "```" + `\n[Click to copy!](https://paste-pgpj.onrender.com/?p=https://cdn.mcsv.life/private/${res2.data.fileName})`,
					}]
				}]
			});
        } catch (e) {
            if (e?.name == "AxiosError" && e?.response?.status) {
                await interaction.editReply({
                    embeds: [{
                        title: "エラー",
                        description: `内部エラー: ${e.response.statusText}(${e.response.status})`,
                        color: 0xff0000,
                        footer: {
                            text: "ringoXD's Discord.js Bot"
                        }
                    }]
                })
            } else {
                throw e;
            }
        }
    }
}