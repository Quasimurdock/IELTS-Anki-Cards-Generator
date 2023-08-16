const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const anki = require("mkanki");
const writeToLog = require("./utils/logger");

const directoryPath = __dirname;
const HTML_DIR = directoryPath + "/output/html/";
const DEFAULT_DECK_NAME = "IELTS-CamDict-Words";
const DEFAULT_NOTE_TYPE_NAME = "BasicCamCard";
const DEFAULT_CSS_FILENAME = "common.css";
const DEFAULT_APKG_NAME = DEFAULT_DECK_NAME + ".apkg";

const cssData = fs.readFileSync(HTML_DIR + DEFAULT_CSS_FILENAME, "utf8");

const model = new anki.Model({
  name: DEFAULT_NOTE_TYPE_NAME,
  id: Date.now().toString(),
  flds: [{ name: "Word" }, { name: "Front" }, { name: "Back" }],
  req: [[0, "all", [0]]],
  tmpls: [
    {
      name: "Card 1",
      qfmt: "{{Front}}",
      afmt: "{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}",
    },
  ],
  css: cssData,
});
const deck = new anki.Deck(Date.now(), DEFAULT_DECK_NAME);
const package = new anki.Package();

async function processHtmlFilesNew() {
  try {
    const files = await new Promise((resolve, reject) => {
      fs.readdir(HTML_DIR, (err, files) => {
        if (err) {
          writeToLog(err.message);
          reject(err);
        }
        resolve(files);
      });
    });
    let cnt = 0;
    function addNote(file) {
      return new Promise((resolve, reject) => {
        if (path.extname(file) === ".html") {
          const currentWord = file.match(/^(.+)\.html$/)[1];
          const filePath = path.join(HTML_DIR, file);
          fs.readFile(filePath, "utf8", (err, data) => {
            if (err) {
              writeToLog(err.message);
              reject(err);
            } else {
              try {
                const $ = cheerio.load(data);
                let front = "";
                $(".pos-header.dpos-h")
                  .toArray()
                  .forEach((ele) => {
                    front += $(ele).html() + "<hr color='grey'>";
                  });
                const back = $("body").html();
                if (!front || !back) {
                  throw new Error(
                    "EMPTY RESULT OF EXTRACTING FRONT OR BACK NOTES"
                  );
                }
                const tags = $(".def-info.ddef-info")
                  .toArray()
                  .map((ele) =>
                    $(ele).find("span[class*='epp-xref dxref']").html()
                  )
                  .filter((ele) => ele !== null);
                let tagResult = null;
                if (tags.length != 0) {
                  const tagsDictinct = [...new Set(tags)].sort();
                  tagResult = tagsDictinct;
                }
                deck.addNote(model.note([currentWord, front, back], tagResult));
                console.log(
                  `[INFO] ${++cnt}/${
                    files.length - 1
                  } CURRENT WORD: ${currentWord}`
                );
                resolve();
              } catch (err) {
                writeToLog(`[ERR] ERROR PROCESSSING ${file}: ${err.message}`);
                reject(err);
              }
            }
          });
        } else {
          resolve();
        }
      });
    }
    const result = await Promise.allSettled(files.map(addNote));
    result.forEach((e, i) => {
      if (e.status === "rejected") {
        writeToLog(
          `[ERR] ADD ${files[i].match(/^(.+)\.html$/)[1]} FAILED: ${e.reason}`
        );
      }
    });
  } catch (err) {
    writeToLog(`[ERR] UNKNONW ERROR ${err.message}`);
  }
}

async function convert() {
  await processHtmlFilesNew();
  package.addDeck(deck);
  package.writeToFile(DEFAULT_APKG_NAME);
}

convert();
