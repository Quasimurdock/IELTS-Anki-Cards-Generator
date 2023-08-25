const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const anki = require("mkanki");
const writeToLog = require("./utils/logger");

const directoryPath = __dirname;
const DEFAULT_HTML_DIR = directoryPath + "/output/html/";
const DEFAULT_AUDIO_DIR = directoryPath + "/output/audios/";
const DEFAULT_DECK_NAME = "IELTS-CamDict-Words";
const DEFAULT_NOTE_TYPE_NAME = "BasicCamCard";
const DEFAULT_CSS_FILENAME = "common.css";
const DEFAULT_APKG_NAME = DEFAULT_DECK_NAME + ".apkg";

const cssData = fs.readFileSync(DEFAULT_HTML_DIR + DEFAULT_CSS_FILENAME, "utf8");
const audioPlayScriptBlock = `<script>
  function playAudio(id) {
      const audio = document.getElementById(id);
      if (audio) audio.querySelector(".replay-button, .replaybutton").click();
  }
  </script>`;

const model = new anki.Model({
	name: DEFAULT_NOTE_TYPE_NAME,
	id: Date.now().toString(),
	flds: [{ name: "Word" }, { name: "Front" }, { name: "Back" }],
	req: [[0, "all", [0]]],
	tmpls: [
		{
			name: "Card 1",
			qfmt: "{{Front}}" + `\n${audioPlayScriptBlock}`,
			afmt: "{{Back}}" + `\n${audioPlayScriptBlock}`,
		},
	],
	css: cssData,
});
const deck = new anki.Deck(Date.now(), DEFAULT_DECK_NAME);
const package = new anki.Package();

async function processHtmlFilesNew() {
	try {
		const files = await new Promise((resolve, reject) => {
			fs.readdir(DEFAULT_HTML_DIR, (err, files) => {
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
					const filePath = path.join(DEFAULT_HTML_DIR, file);
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
										front +=
											$(ele).html() + "<hr color='grey'>";
									});
								front += $(".audioGroup").html();
								const back = $("body").html();
								if (!front || !back) {
									throw new Error(
										"EMPTY RESULT OF EXTRACTING FRONT OR BACK NOTES"
									);
								}
								const tags = $(".def-info.ddef-info")
									.toArray()
									.map((ele) =>
										$(ele)
											.find(
												"span[class*='epp-xref dxref']"
											)
											.html()
									)
									.filter((ele) => ele !== null);
								let tagResult = [];
								if (tags.length != 0) {
									const tagsDictinct = [
										...new Set(tags),
									].sort();
									tagResult = tagsDictinct;
								}
								deck.addNote(
									model.note(
										[currentWord, front, back],
										tagResult
									)
								);
								console.log(
									`[INFO] ${++cnt}/${
										files.length - 1
									} CURRENT WORD: ${currentWord}`
								);
								resolve();
							} catch (err) {
								writeToLog(
									`[ERR] ERROR PROCESSSING ${file}: ${err.message}`
								);
								reject(err);
							}
						}
					});
				} else {
					resolve();
				}
			});
		}
		await Promise.allSettled(files.map(addNote));
	} catch (err) {
		writeToLog(`[ERR] UNKNONW ERROR ${err.message}`);
	}
}

async function processAudioFiles() {
	try {
		const audioFiles = await new Promise((resolve, reject) => {
			fs.readdir(DEFAULT_AUDIO_DIR, (err, files) => {
				if (err) {
					writeToLog(err.message);
					reject(err);
				}
				resolve(files);
			});
		});
		let cnt = 0;
		function addAudio(file) {
			return new Promise((resolve, reject) => {
				if (path.extname(file) === ".mp3") {
					try {
						const audioFilePath = path.join(DEFAULT_AUDIO_DIR, file);
						/**
						 * Note: package.addMediaFile
						 *    1st param for absolute path,
						 *    2nd param for real filename   */
						package.addMediaFile(audioFilePath, file);
						console.log(
							`[INFO] ${++cnt}/${
								audioFiles.length
							} CURRENT AUDIO: ${file}`
						);
						resolve(file);
					} catch (err) {
						writeToLog(
							`[ERR] WHILE ADDING AUDIO ${file} ` + err.message
						);
						reject(err);
					}
				} else {
					resolve(`NOT FOUND ${file}`);
				}
			});
		}
		await Promise.allSettled(audioFiles.map(addAudio));
	} catch (err) {
		writeToLog(`[ERR] UNKNONW ERROR ${err.message}`);
	}
}

async function convert() {
	await processHtmlFilesNew();
	await processAudioFiles();
	package.addDeck(deck);
	package.writeToFile(DEFAULT_APKG_NAME);
}

convert();
