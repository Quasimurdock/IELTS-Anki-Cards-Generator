const fs = require("fs");
const bent = require("bent");
const cheerio = require("cheerio");

// 定义目录和文件路径
const directoryPath = ".";
const filePath = `${directoryPath}/test.txt`;

// 定义URL前缀
const urlString =
  "https://dictionary.cambridge.org/dictionary/english-chinese-simplified";

// 读取文件并处理每行的单词
fs.readFile(filePath, "utf8", async (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }

  const words = data.split("\n");
  for (let word of words) {
    word = word.trim();
    // 判空
    if (word === "" || word.length == 0) {
      return;
    }
    // 拼接URL
    try {
      const get = bent(urlString, "GET", "string", 200);
      const data = await get(`/` + word);
      const $ = cheerio.load(data);
      const target = $(".entry-body").html();
      fs.writeFile(`${directoryPath}/${word}_html.txt`, target, (err) => {
        if (err) {
          console.log(`[ERR] 写入单词${word}时发生错误`, err);
        } else {
          console.log(`[OK] 单词${word}写入成功`);
        }
      });
    } catch (error) {
      const fetchUrl = urlString + word;
      console.error(`[ERR] 请求查询单词${word}时发生错误：`, fetchUrl);
      console.error(error);
    }
  }
});
