const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const puppeteer = require("puppeteer");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("screenshot")
    .setDescription("screenshot a list of hosts")
    .addStringOption((option) =>
      option
        .setName("list")
        .setDescription("file containing the list of hosts")
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const listPath = interaction.options.getString("list");

    fs.access(listPath, fs.constants.F_OK, async (err) => {
      if (err) {
        return interaction.reply("File does not exist.");
      }

      try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        await page.setViewport({ width: 1280, height: 720 });

        const urls = fs
          .readFileSync(listPath, "utf-8")
          .split("\n")
          .filter((url) => url.trim() !== "");
        for (const url of urls) {
          try {
            await page.goto(url);
            const hostname = new URL(url).hostname;
            const outputPath = `./output/${hostname}.png`;
            await page.screenshot({ path: outputPath });

            const screenshotFile = fs.readFileSync(outputPath);

            await interaction.followUp({
              content: `**${hostname}**`,
              files: [{ attachment: screenshotFile, name: `${hostname}.png` }],
            });
          } catch (error) {
            await interaction.followUp(
              `couldn't screenshot ${url}; check console for errors.`
            );
            console.error(`error while taking screenshot of ${url}:`, error);
          }
        }

        await browser.close();
        interaction.followUp("done.");
      } catch (error) {
        console.error("Error:", error);
      }
    });
  },
};
