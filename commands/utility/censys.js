const { SlashCommandBuilder, codeBlock } = require("discord.js");
const { exec } = require("child_process");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("censys")
    .setDescription("Query Censys search")
    .addStringOption((option) =>
      option
        .setName("target")
        .setDescription("Target domain, e.g hackerone.com")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("output")
        .setDescription("File name to save output (optional)")
        .setRequired(false)
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const target = interaction.options.getString("target");
    const output = interaction.options.getString("output");

    try {
      let command = `censys search ${target} | grep "ip" | egrep -v "description" | cut -d ":" -f2 | tr -d "\\"\\,"`;

      if (output) {
        command += ` | tee ${output}`;
      }

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error("Error:", error);
          interaction.editReply("Error while executing the command, check console.");
          return;
        }
        if (stderr) {
          console.error("stderr:", stderr);
          interaction.editReply("Stderr, check console.");
          return;
        }
        const ips = stdout.trim().split('\n').map(ip => ip.trim());
        const res = ips.length > 0 ? ips.join('\n') : "No IPs found.";
        interaction.editReply(codeBlock(res));
      });
    } catch (error) {
      console.error("Error:", error);
      interaction.editReply("Something went wrong, check console for errors.");
    }
  },
};

