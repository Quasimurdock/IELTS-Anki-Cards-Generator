const fs = require("fs");
const bent = require("bent");
const writeToLog = require("./logger");
const stream = require("stream");
const { promisify } = require("util");
const pipeline = promisify(stream.pipeline);

const DEFAULT_AUDIO_PATH = "src/output/audios";
const DEFAULT_ROOT_URL_STR = "https://dictionary.cambridge.org";

async function downloadFile(urlToken, filePath) {
	const get = bent(DEFAULT_ROOT_URL_STR);
	const readable = await get(urlToken);
	const writable = fs.createWriteStream(filePath);
	const res = await pipeline(readable, writable).then((res) => {
		return Promise.resolve(extractAudioFilename(urlToken, true));
	});
	return res;
}

function mkdir4Audios() {
	const directoryName = DEFAULT_AUDIO_PATH;
	if (!fs.existsSync(directoryName)) {
		try {
			fs.mkdirSync(directoryName, { recursive: true });
			writeToLog(`[INFO] DIR ${directoryName} CREATED`);
			return true;
		} catch (error) {
			writeToLog(`[ERR] FAILED TO CREATE DIR${directoryName}:`, error);
			return false;
		}
	} else {
		// writeToLog(`[INFO] DIR ${directoryName} EXISTED`);
		return true;
	}
}

function extractAudioFilename(url, isSuffix) {
	const regex = /\/([^/]+\.mp3)$/;
	if (!isSuffix) return url.match(/\/([^/]+)\.mp3$/)[1];
	return url.match(regex)[1];
}

function fetchAudios($, word, audioDIVsBuffer) {
	const daud = $(".entry-body .daud");
	const pronunUrlArray = daud
		.toArray()
		.flatMap((e) =>
			e.childNodes.filter((k) => k.type == "tag" && k.name == "audio")
		)
		.map((e) => e.childNodes[3].attribs["src"]);
	/** ============================================================
	 *   construct div elements for anki pronun audio support
	 */
	const pron = $(".entry-body .pron.dpron").toArray();
	for (let i = 0; i < pron.length; i++) {
		const target =
			word + "-" + extractAudioFilename(pronunUrlArray[i], false);
		// console.log(target);
		audioDIVsBuffer.push(
			`<div class="sound" id="${target}">[sound:${target}.mp3]</div>`
		);
		$(pron[i]).attr("onClick", `playAudio('${target}');`);
	}
	/** ============================================================ */
	const pronunUrlArrayUnique = [...new Set(pronunUrlArray)];
	// console.log(pronunUrlArrayUnique);
	const isMkdir = mkdir4Audios();
	if (!isMkdir) return;
	Promise.allSettled(
		pronunUrlArrayUnique.map((url) => {
			const regex = /\/([^/]+\.mp3)$/;
			const filename = url.match(regex)[1];
			return downloadFile(
				url,
				DEFAULT_AUDIO_PATH + `/${word}-${filename}`
			);
		})
	)
		.then((result) =>
			writeToLog(
				`[INFO] AUDIO FILE [${result
					.map((e) => e.value)
					.join(", ")}] WRITTEN`
			)
		)
		.catch((err) => writeToLog(err.message));
}

module.exports = fetchAudios;
