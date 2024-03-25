const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const puppeteer = require("puppeteer");

async function sendChunkedMessage(interaction, message) {
  const chunks = message.match(/[\s\S]{1,2000}/g) || [];
  for (const chunk of chunks) {
    await interaction.followUp(chunk);
  }
}

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
      const startTime = new Date();
      try {
        const browser = await puppeteer.launch({
          headless: true,
          ignoreHTTPSErrors: true,
          ignoreDefaultArgs: ["--ignore-certificate-errors"],
          timeout: 30000,
        });
        const page = await browser.newPage();

        await page.setViewport({ width: 1280, height: 720 });

        const urls = fs
          .readFileSync(listPath, "utf-8")
          .split("\n")
          .filter((url) => url.trim() !== "");

        const statusCodes = {};

        for (const url of urls) {
          try {
            const response = await page.goto(url);
            const statusCode = response.status();
            const hostname = new URL(url).hostname;
            const outputPath = `./output/${hostname}.png`;
            await page.screenshot({ path: outputPath });

            const screenshotFile = fs.readFileSync(outputPath);

            await interaction.followUp({
              content: `\`${hostname}\` - response code: ${statusCode}`,
              files: [{ attachment: screenshotFile, name: `${hostname}.png` }],
            });

            fs.unlinkSync(outputPath);

            if (!statusCodes[statusCode]) {
              statusCodes[statusCode] = [];
            }
            statusCodes[statusCode].push(hostname);
          } catch (error) {
            await interaction.followUp(
              `couldn't screenshot \`${url}\`, check console for errors.`
            );
            console.error(`error while taking screenshot of ${url}:`, error);
          }
        }

        await browser.close();
        const endTime = new Date();
        const timeDifference = endTime - startTime;
        const seconds = Math.floor(timeDifference / 1000);
        const minutes = Math.floor(seconds / 60);

        console.log(
          `completed in ${seconds < 60 ? seconds : minutes} ${
            seconds < 60 ? "second" : "minute"
          }${seconds < 60 && seconds !== 1 ? "s" : ""}`
        );

        let report = "```\nReport:\n";
        const topStatusCodes = Object.keys(statusCodes)
          .sort((a, b) => statusCodes[b].length - statusCodes[a].length)
          .slice(0, 5);

        for (const code of topStatusCodes) {
          report += `\nStatus code - ${code}:\n`;
          statusCodes[code].forEach((website) => {
            report += `${website}\n`;
          });
        }
        report += "```";

        await sendChunkedMessage(interaction, report);
      } catch (error) {
        console.error("Error:", error);
      }
    });
  },
};
