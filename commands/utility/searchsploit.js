const { SlashCommandBuilder, codeBlock } = require("discord.js");
const { exec } = require("child_process");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("searchsploit")
    .setDescription("Query exploitdb")
    .addStringOption((option) =>
      option.setName("search").setDescription("exploit title").setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const search = interaction.options.getString("search");

    try {
      let command = `searchsploit ${search}`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error("Error:", error);
          interaction.editReply(
            "Error while executing the command, check console."
          );
          return;
        }
        if (stderr) {
          console.error("stderr:", stderr);
          interaction.editReply("Stderr, check console.");
          return;
        }
        interaction.editReply(codeBlock(stdout));
      });
    } catch (error) {
      console.error("Error:", error);
      interaction.editReply("Something went wrong, check console for errors.");
    }
  },
};
