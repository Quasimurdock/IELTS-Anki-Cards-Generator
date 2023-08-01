const fs = require("fs");
const bent = require("bent");
const cheerio = require("cheerio");

// define directory path and file path
const directoryPath = ".";
const filePath = `${directoryPath}/words.txt`;

// define URL prefix
const urlString =
  "https://dictionary.cambridge.org/dictionary/english-chinese-simplified";

// read file and process the token of each line
fs.readFile(filePath, "utf8", async (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }

  const words = data.split("\n");
  for (let word of words) {
    word = word.trim();
    // judge if empty
    if (word === "" || word.length == 0) {
      return;
    }
    // concat strings
    try {
      const get = bent(urlString, "GET", "string", 200);
      const data = await get(`/` + word);
      const $ = cheerio.load(data);
      // remove unusable icon and hint nodes
      $(".daud").remove();
      $(".i.i-caret-right.dtrans.fs18.lpb-4").remove();
      $(".dwla.wordlist-add-button").remove();
      $(".hfr.lpb-2").remove();
      $("i.i-plus.ca_hi").remove();
      $("script").remove();
      // remove all dictionary href links from <a> nodes with 
      // and underlines of its <span> sub nodes
      $("a[href*='dictionary'] span").removeClass("dx-h");
      $("a[href*='dictionary']").removeAttr("href");
      const target =
        `<html><head><link rel="stylesheet" href="common.css"></head>` +
        $(".entry-body").html() +
        `</html>`;
      fs.writeFile(`${directoryPath}/output/${word}.html`, target, (err) => {
        if (err) {
          console.log(`[ERR] While writing [${word}]:`, err);
        } else {
          console.log(`[OK] Word [${word}] is written.`);
        }
      });
    } catch (error) {
      const fetchUrl = urlString + "/" + word;
      console.error(`[ERR] While finding ${word}：`, fetchUrl);
      console.error(error);
    }
  }
});
