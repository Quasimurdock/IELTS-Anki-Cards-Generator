const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const invoke = require("./utils/anki_connector");
const Note = require("./models/notecard");
const writeToLog = require("./utils/logger");

const directoryPath = __dirname;
const HTML_DIR = directoryPath + "/output/html/";
const DEFAULT_DECK_NAME = "IELTS-CamDict-Words2";
const DEFAULT_NOTE_TYPE_NAME = "BasicCamCard2";
const DEFAULT_CSS_FILENAME = "common.css";

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
let batch_cnt = 0;
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
            console.log(
              `(${index + 1}/${files.length})Word ${
                note.fields.Word
              } pushed to waiting list.`
            );
            const BATCH_SIZE = 100;
            if (notesList.length > BATCH_SIZE) {
              batch_cnt++;
              console.log(`>>>>> current batch index: ${batch_cnt}`);
              addNotes(notesList);
              notesList = [];
            } else if (index == files.length - 1) {
              batch_cnt++;
              console.log(`>>>>> current batch index: ${batch_cnt}`);
              addNotes(notesList);
            }
            // console.log(`Current word: [${file.match(/^(.+)\.html$/)[1]}]`);
          } catch (err) {
            writeToLog(`[ERR] Error processing ${file}: ${err.message}`);
          }
        });
      }
    });
  });
}

async function createNewDeck() {
  const result = await invoke("deckNames", 6);
  if (result.indexOf(DEFAULT_DECK_NAME) == -1) {
    try {
      await invoke("createDeck", 6, { deck: DEFAULT_DECK_NAME });
      writeToLog("[OK] Created a new deck for cards.\n");
    } catch (err) {
      writeToLog(`[ERR] While creating a new deck:: ${err.message}`);
      process.exit(1);
    }
  }
  writeToLog(`[INF] Got list of current decks: ${result}`);
}

async function createNewNoteType() {
  let commonCSS = null;
  const cssData = fs.readFileSync(HTML_DIR + DEFAULT_CSS_FILENAME, "utf8");
  if (cssData === null) {
    writeToLog(err.message);
    process.exit(1);
  }
  commonCSS = cssData;
  const modelParams = {
    modelName: DEFAULT_NOTE_TYPE_NAME,
    inOrderFields: ["Word", "Front", "Back"],
    css: commonCSS,
    cardTemplates: [
      {
        Word: "",
        Front: `<div class="frontSide">{{Front}}</div>`,
        Back: `{{Back}}`,
      },
    ],
  };
  const result = await invoke("modelNames", 6);
  if (result.indexOf(DEFAULT_NOTE_TYPE_NAME) == -1) {
    try {
      await invoke("createModel", 6, modelParams);
      writeToLog("[OK] Created a new note for cards.\n");
    } catch (err) {
      writeToLog(`[ERR] While creating a new note type: ${err.message}`);
      process.exit(1);
    }
  }
  try {
    const newResult = await invoke("modelNames", 6);
    writeToLog(`[INF] Got list of current note types: ${newResult}`);
  } catch (err) {
    writeToLog(`[ERR] While fetching list of note type: ${err.message}`);
  }
}

async function convert() {
  await createNewDeck();
  await createNewNoteType();
  await processHtmlFiles();
}

convert();
