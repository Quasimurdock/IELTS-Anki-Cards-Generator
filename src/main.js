/*
 * Copyright (c) 2023 @Quasimurdock
 *
 * Portions of this file are subject to the Apache License, Version 2.0 ("License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at:
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed
 * under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 * */

const fs = require("fs");
const bent = require("bent");
const cheerio = require("cheerio");
const path = require("path");
const writeToLog = require("./utils/logger");
const fetchAudios = require("./utils/audio_downloader");

// define directory path and file path
const directoryPath = __dirname;
const DEFAULT_WORDLIST_PATH = path.join(__dirname, "words.txt");
const DEFAULT_HTML_DIR = `${directoryPath}/output/html/`;

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
fs.readFile(DEFAULT_WORDLIST_PATH, "utf8", async (err, data) => {
	if (err) {
		console.error("ERROR READING FILE:", err);
		writeToLog(`[ERR] FAILED TO READ FILE: ${err.message}`);
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
		if (
			checkDuplicateFiles(directoryPath + "/output/html", word + ".html")
		) {
			console.log(`[SKIP] Duplicated [${word}] file exists.`);
			continue;
		}
		// concat strings
		try {
			const get = bent(urlString, "GET", "string", 200);
			const data = await get(`/` + word);
			const $ = cheerio.load(data);
			let audioDIVsBuffer = [];
			fetchAudios($, word, audioDIVsBuffer);
			const audioDIVsString = audioDIVsBuffer.join("");
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
				`<html><head><link rel="stylesheet" href="common.css"></head><body>` +
				$(".entry-body").html() +
				"<div class='audioGroup'>" +
				audioDIVsString +
				"</div></body></html>";
			fs.writeFile(
				`${DEFAULT_HTML_DIR}${word}.html`,
				target,
				(err) => {
					if (err) {
						writeToLog(
							`[ERR] WHILE WRITING [${word}]: ${err.message}`
						);
					} else {
						writeToLog(`[OK] WORD [${word}] WRITTEN.`);
					}
				}
			);
		} catch (err) {
			const fetchUrl = urlString + "/" + word;
			writeToLog(
				`[ERR] WHILE FINDING ${word}: ${fetchUrl} ${err.message}`
			);
			fs.appendFile(
				`${directoryPath}/output/log/missing_words.txt`,
				word + "\n",
				(err) => {
					if (err) {
						writeToLog(
							`[LOG-ERR] WHILE LOGGING MISSING of [${word}]:${err.message}`
						);
					}
				}
			);
		}
	}
});
