const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const puppeteer = require("puppeteer");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nxdomain")
    .setDescription("finds resources that failed to load on targets..")
    .addStringOption((option) =>
      option
        .setName("list")
        .setDescription("file containing the list of urls")
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const listPath = interaction.options.getString("list");

    fs.access(listPath, fs.constants.F_OK, async (err) => {
      if (err) {
        return interaction.reply("File does not exist.");
      }
      const startTime = new Date();
      try {
        const browser = await puppeteer.launch({
          headless: true,
          ignoreHTTPSErrors: true,
          ignoreDefaultArgs: ["--ignore-certificate-errors"],
          timeout: 30000,
        });
        const page = await browser.newPage();

        const urls = fs
          .readFileSync(listPath, "utf-8")
          .split("\n")
          .filter((url) => url.trim() !== "");
        for (const url of urls) {
          try {
            const failedResources = [];

            page.on("requestfailed", (request) => {
              const url = request.url();
              if (request.failure()) {
              const failure = {
                url,
                failureText: request.failure().errorText,
              };
              failedResources.push(failure);
              }
            });
            await page.goto(url);
            await interaction.followUp(`**Testing ${url}**`);
            let report = "";

            failedResources.forEach((resource) => {
              report = `**URL**: ${url} - **Resource**: ${resource.url} - **Reason**: \`${resource.failureText}\`\n`;
            });
            if (report) {
              interaction.followUp(report);
            }

          } catch (error) {
            await interaction.followUp(
              `couldn't load \`${url}\`, check console for errors.`
            );
            console.error(`${url}:`, error);
          }
        }


        await browser.close();
      } catch (error) {
        console.error("Error:", error);
      }
    });
  },
};
