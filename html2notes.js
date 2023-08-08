const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const invoke = require("./anki_connector");
const Note = require("./notecard");

const HTML_DIR = "./output/html/";
const LOG_FILE = "log_html2notes.txt";
const DEFAULT_DECK_NAME = "IELTS-CamDict-Words";

// add anki notes
async function addNotes(notes) {
  try {
    if (notes == null) throw new Error("addNotes() got a null input of notes");

    const multiParamsActions = notes.map((note) => ({
      action: "addNote",
      version: 6,
      params: { note },
    }));
    const results = await invoke("multi", 6, { actions: multiParamsActions });

    if (results === null) {
      throw new Error("addNotes() returned null");
    }
    if (results.length == 0) {
      throw new Error("addNotes() returned an empry result");
    } else {
      results.forEach((result, i) => {
        if (result.error) {
          console.error("addNotes() error: ", JSON.stringify(result));
          throw new Error(`word failed to add: ${notes[i].fields.Word}`);
        }
      });  
    }
    return results;
  } catch (error) {
    writeToLog("[ERR] While adding notes:" + error);
  }
}
let notesList = [];
async function processHtmlFiles() {
  fs.readdir(HTML_DIR, (err, files) => {
    if (err) {
      writeToLog(err.message);
      return;
    }
    files.forEach((file, index) => {
      if (path.extname(file) === ".html") {
        const filePath = path.join(HTML_DIR, file);
        fs.readFile(filePath, "utf8", (err, data) => {
          if (err) {
            writeToLog(err.message);
            return;
          }
          try {
            const $ = cheerio.load(data);
            let front = "";
            $(".pos-header.dpos-h")
              .toArray()
              .forEach((ele) => {
                front += $(ele).html() + "<hr color='grey'>";
              });
            const back = $("body").html();
            const tags = $(".def-info.ddef-info")
              .toArray()
              .map((ele) => $(ele).find("span[class*='epp-xref dxref']").html())
              .filter((ele) => ele !== null);
            let tagResult = null;
            if (tags.length != 0) {
              const tagsDictinct = [...new Set(tags)].sort();
              tagResult = tagsDictinct;
            }
            const note = new Note(
              DEFAULT_DECK_NAME,
              file.match(/^(.+)\.html$/)[1],
              front,
              back,
              tagResult
            );
            notesList.push(note);
            const BATCH_SIZE = 100;
            if (notesList.length > BATCH_SIZE) {
              addNotes(notesList);
              notesList = [];
            }
            if (index == files.length - 1) {
              addNotes(notesList);
            }
            console.log(`Current word: [${file.match(/^(.+)\.html$/)[1]}]`);
          } catch (err) {
            writeToLog(`[ERR] Error processing ${file}: ${err.message}`);
          }
        });
      }
    });
  });
}

function writeToLog(message) {
  console.log(message);
  const logMessage = `[${new Date().toLocaleString()}] ${message}\n`;
  fs.appendFile("./output/log/" + LOG_FILE, logMessage, (err) => {
    if (err) {
      console.error("[LOG-ERR] Failed to write to log file:", err);
    }
  });
}

async function createNewDeck() {
  const result = await invoke("deckNames", 6);
  if (result.indexOf(DEFAULT_DECK_NAME) == -1) {
    try {
      await invoke("createDeck", 6, { deck: DEFAULT_DECK_NAME });
      writeToLog("[OK] Created a new deck for cards.\n");
    } catch (error) {
      writeToLog(`[ERR] While creating a new deck:: ${err.message}`);
    }
  }
  writeToLog(`[INF] Got list of current decks: ${result}`);
}

createNewDeck();
processHtmlFiles();
