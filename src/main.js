const fs = require("fs");
const bent = require("bent");
const cheerio = require("cheerio");
const path = require("path");

// define directory path and file path
const directoryPath = __dirname;
const filePath = path.join(__dirname, "words.txt");

// define URL prefix
const urlString =
  "https://dictionary.cambridge.org/dictionary/english-chinese-simplified";

function checkDuplicateFiles(directory, filename) {
  const files = fs.readdirSync(directory); // read all files under the directory
  for (let file of files) {
    if (file === filename) {
      return true; // duplicated files existed
    }
  }
  return false;
}

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
      continue;
    }

    // check if duplicated file exists
    if (checkDuplicateFiles(directoryPath + "/output/html", word + ".html")) {
      console.log(`[SKIP] Duplicated [${word}] file exists.`);
      continue;
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
      fs.writeFile(
        `${directoryPath}/output/html/${word}.html`,
        target,
        (err) => {
          if (err) {
            console.log(`[ERR] While writing [${word}]:`, err);
          } else {
            console.log(`[OK] Word [${word}] is written.`);
          }
        }
      );
    } catch (error) {
      const fetchUrl = urlString + "/" + word;
      console.error(`[ERR] While finding ${word}：`, fetchUrl);
      console.error(error);
      fs.appendFile(
        `${directoryPath}/output/log/missing_words.txt`,
        word + "\n",
        (err) => {
          if (err) {
            console.log(`[LOG-ERR] While logging missing of [${word}]:`, err);
          } else {
            console.log(`[LOG-OK] Missing of word [${word}] is logged.`);
          }
        }
      );
    }
  }
});
