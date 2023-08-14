const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const anki = require('mkanki');
const writeToLog = require('./utils/logger');

const directoryPath = __dirname;
const HTML_DIR = directoryPath + '/output/html/';
const DEFAULT_DECK_NAME = 'IELTS-CamDict-Words';
const DEFAULT_NOTE_TYPE_NAME = 'BasicCamCard';
const DEFAULT_CSS_FILENAME = 'common.css';

const cssData = fs.readFileSync(HTML_DIR + DEFAULT_CSS_FILENAME, 'utf8');

const model = new anki.Model({
  name: DEFAULT_NOTE_TYPE_NAME,
  id: Date.now().toString(),
  flds: [{ name: 'Word' }, { name: 'Front' }, { name: 'Back' }],
  req: [[0, 'all', [0]]],
  tmpls: [
    {
      name: 'Card 1',
      qfmt: '{{Front}}',
      afmt: '{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}',
    },
  ],
  css: cssData,
});
const deck = new anki.Deck(Date.now(), DEFAULT_DECK_NAME);
const package = new anki.Package();

async function processHtmlFiles() {
  fs.readdir(HTML_DIR, async (err, files) => {
    if (err) {
      writeToLog(err.message);
      return;
    }

    async function addNote(file) {
      if (path.extname(file) === '.html') {
        const filePath = path.join(HTML_DIR, file);
        fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
            writeToLog(err.message);
            return;
          }
          try {
            const $ = cheerio.load(data);
            let front = '';
            $('.pos-header.dpos-h')
              .toArray()
              .forEach((ele) => {
                front += $(ele).html() + "<hr color='grey'>";
              });
            const back = $('body').html();
            const tags = $('.def-info.ddef-info')
              .toArray()
              .map((ele) => $(ele).find("span[class*='epp-xref dxref']").html())
              .filter((ele) => ele !== null);
            let tagResult = null;
            if (tags.length != 0) {
              const tagsDictinct = [...new Set(tags)].sort();
              tagResult = tagsDictinct;
            }

            // console.log(`deck: ${JSON.stringify(deck)}`)
            deck.addNote(
              model.note(
                [file.match(/^(.+)\.html$/)[1], front, back],
                tagResult
              )
            );
          } catch (err) {
            writeToLog(`[ERR] Error processing ${file}: ${err.message}`);
          }
        });
      }
    }
    async function addNotes(_files) {
      const res = await Promise.allSettled(_files.map(async (e) => await addNote(e)));
      return res;
    }

    const result = await addNotes(files);
    console.log(`addNotes() result: ${JSON.stringify(result)}`);

    // function asyncForEach(array, fn) {
    //   return new Promise((resolve) => {
    //     array.forEach((item) => {
    //       fn(item);
    //     });
    //     resolve();
    //   });
    // }
    // async function addNote() {
    //   await asyncForEach(files, (file) => {
    //     if (path.extname(file) === '.html') {
    //       const filePath = path.join(HTML_DIR, file);
    //       fs.readFile(filePath, 'utf8', (err, data) => {
    //         if (err) {
    //           writeToLog(err.message);
    //           return;
    //         }
    //         try {
    //           const $ = cheerio.load(data);
    //           let front = '';
    //           $('.pos-header.dpos-h')
    //             .toArray()
    //             .forEach((ele) => {
    //               front += $(ele).html() + "<hr color='grey'>";
    //             });
    //           const back = $('body').html();
    //           const tags = $('.def-info.ddef-info')
    //             .toArray()
    //             .map((ele) =>
    //               $(ele).find("span[class*='epp-xref dxref']").html()
    //             )
    //             .filter((ele) => ele !== null);
    //           let tagResult = null;
    //           if (tags.length != 0) {
    //             const tagsDictinct = [...new Set(tags)].sort();
    //             tagResult = tagsDictinct;
    //           }

    //           // console.log(`deck: ${JSON.stringify(deck)}`)
    //           deck.addNote(
    //             model.note(
    //               [file.match(/^(.+)\.html$/)[1], front, back],
    //               tagResult
    //             )
    //           );
    //         } catch (err) {
    //           writeToLog(`[ERR] Error processing ${file}: ${err.message}`);
    //         }
    //       });
    //     }
    //   });
    // }
    // addNote()
  });
}

async function convert() {
  await processHtmlFiles();
  package.addDeck(deck);
  package.writeToFile('test.apkg');
}

convert();
