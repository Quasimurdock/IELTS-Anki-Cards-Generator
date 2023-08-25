const fs = require("fs");
const bent = require("bent");
const cheerio = require("cheerio");
const path = require("path");
const { Worker, isMainThread, workerData } = require("worker_threads");
const writeToLog = require("./utils/logger");
const DEFAULT_WORKER_NUM = 8;
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

async function processWord(word) {
	// judge if empty
	if (word === "" || word.length == 0) {
		return;
	}

	// check if duplicated file exists
	if (checkDuplicateFiles(directoryPath + "/output/html", word + ".html")) {
		console.log(`[SKIP] Duplicated [${word}] file exists.`);
		return;
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
					writeToLog(`[OK] WORD [${word}] WRITTEN.`);
				}
			}
		);
	} catch (error) {
		writeToLog(`[ERR] WHILE FINDING ${word}: `, error.message);
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

async function workerExecution() {
	if (isMainThread) {
		// read file and process the token of each line
		fs.readFile(DEFAULT_WORDLIST_PATH, "utf8", async (err, data) => {
			if (err) {
				writeToLog(`[ERR] ERROR READING FILE : ${err.message}`);
				return;
			}

			const words = data.split("\n");
			const numWorkers = DEFAULT_WORKER_NUM; // number of worker threads to create
			const batchSize = Math.ceil(words.length / numWorkers); // calculate batch size
			const workers = [];

			for (let i = 0; i < numWorkers; i++) {
				const start = i * batchSize;
				const end = start + batchSize;

				const worker = new Worker(__filename, {
					workerData: words.slice(start, end),
				});

				worker.on("error", (err) => {
					writeToLog(`[ERR] WORKER ERROR: ${err.message}`);
				});

				worker.on("exit", () => {
					writeToLog(`[INFO] WORKER-${i} EXIT.`);
				});

				workers.push(worker);
			}

			for (let worker of workers) {
				await new Promise((resolve, reject) => {
					worker.on("message", resolve);
					worker.on("error", reject);
				});
			}
			writeToLog("[INFO] ALL WORKERS FINISHED.");
		});
	} else {
		const words = workerData;
		for (let word of words) {
			word = word.trim();
			await processWord(word);
		}
	}
}

workerExecution();
