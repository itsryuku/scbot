const { SlashCommandBuilder, codeBlock } = require("discord.js");
const fs = require("fs");
const { secKey } = require("./../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tsub")
    .setDescription("Get all subdomains of a company.")
    .addStringOption((option) =>
      option
        .setName("target")
        .setDescription("company domain name e.g example.com")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("output")
        .setDescription("save output to a file, provide path+name")
        .setRequired(false)
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const domain = interaction.options.getString("target");
    const output = interaction.options.getString("output");

    try {
      const options = {
        method: "GET",
        headers: { accept: "application/json", APIKEY: secKey },
      };

      const response = await fetch(
        `https://api.securitytrails.com/v1/domain/${domain}/subdomains?children_only=false&include_inactive=true`,
        options
      );
      const jsonResponse = await response.json();
      const subdomains = jsonResponse.subdomains.map(
        (subdomain) => `${subdomain}.${domain}`
      );
      const res = subdomains.join("\n");

      if (output) {
        fs.writeFile(output, res, (err) => {
          if (err) {
            console.error("Error writing:", err);
            interaction.editReply(
              "Something went wrong, check console for errors."
            );
          } else {
            interaction.editReply(
              `Subdomains **fetched** and **written** to \`${output}\`.`
            );
          }
        });
        return;
      }

      await interaction.editReply(codeBlock(res));
    } catch (error) {
      console.error("Error:", error);
      interaction.editReply("Something went wrong, check console for errors.");
    }
  },
};
