const { SlashCommandBuilder } = require('discord.js');
const { setTimeout } = require('timers/promises');
const { LANG, strFormat } = require('../util/languages');
const axios = require('axios').default;
module.exports = {
    data: new SlashCommandBuilder()
        .setName(LANG.commands.checktcp.name)
        .setDescription(LANG.commands.checktcp.description)
        .addStringOption(option => (
            option
                .setName(LANG.commands.checktcp.options.ip.name)
                .setDescription(LANG.common.optionDescription.ipAddress)
                .setRequired(true)
        )),
    execute: async function (interaction) {
        const url = interaction.options.getString(LANG.commands.checktcp.options.ip.name);
        try { new URL(url) } catch { return interaction.reply(LANG.commands.checktcp.invalidUrlError) };
        const res = await axios.get("https://check-host.net/check-ping", {
            params: {
                host: url,
                max_nodes: 40
            },
            headers: {
                "Accept": "application/json"
            }
        })
        const msg = await interaction.reply(LANG.common.message.checking);
        let res2;
        for (let checkCount = 1 ; checkCount < 8 ; checkCount++) {
            await setTimeout(2000);
            res2 = await axios.get("https://check-host.net/check-result/" + res.data.request_id)
            if ((Object.values(res2.data).filter(x => x?.length != 0)).length >= (res.data.nodes.length * 0.8))
                break;
        }
        const str = Object.entries(res2.data).map(([key, value]) => {
            const nodeName = key.replace(".node.check-host.net", "");
            const data = value?.[0];
            console.log(strFormat(LANG.common.message.dataFor, [nodeName]), data);
            if (!value || !data) return `[${nodeName}] Timeout`;
            return `[${nodeName}] ${data[3] || "Error"}/${data[2]} | Ping: ${Math.floor(data[1] * 1000)}ms`;
        }).filter(x => !!x).join("\n");
        msg.edit({
            content: LANG.common.message.result,
            files: [{
                attachment: Buffer.from(str),
                name: "result.txt"
            }]
        });
    }
};