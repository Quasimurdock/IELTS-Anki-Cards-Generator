# Camb-Dict-Anki-Cards-Generator

## Intro

It's a simple online dictionary words fetching project for generating IELTS **anki cards**. It contains four main script `main.js` /` main-worker.js`  for fetching html,  `html2notes.js` for converting html to notes in anki and `mkanki.js` for generating apkg from html files.

All words in `words.txt` comes from the [IELTS](https://github.com/Quasimurdock/IELTS) repo.

## Sample

### Front side

![front](./img/front.jpg)

### Back side

![back](./img/back.jpg)

## How to use

### Simply import

If u just wanna use the note cards of IELTS words, follow the steps below:

1. Find the release in the **right nav bar** of this page and download it.
2. Import the `.apkg` file to ur Anki program, that's it.

### Develop

There're actually two ways of fetching HTML files and two ways of generating notes to ur Anki program:

- `pnpm start` for fetching HTML files synchronously.
- `pnpm start-worker` for fetching HTML files asynchronously through workers.
- `pnpm note` for converting HTML files and directly importing notes to ur Anki program.
- `pnpm note-mkanki` is what we **HIGHLY RECOMMEND** for converting HTML files into `apkg`.

#### For `pnpm note`:

1. Install `npm` or `pnpm`, here we recommend `pnpm`.
2. `npm install` or `pnpm install` to pull all dependencies.
3. `pnpm start` or `pnpm start-worker` to generate HTML files from Camb dict.
4. Open ur Anki program.
5. Install the Anki plugin [AnkiConnect](https://ankiweb.net/shared/info/2055492159).
6. `pnpm note` to convert html files to notes in your Anki.

#### For `pnpm note-mkanki`:

1. Install `npm` or `pnpm`, here we recommend `pnpm`.
2. `npm install` or `pnpm install` to pull all dependencies.
3. `pnpm start `or `pnpm start-worker` to generate HTML files from Camb dict.
4. `pnpm note-mkanki` to generate `apkg` file from HTML files
5. import output `apkg` file to ur Anki program manually.

Note: If you encounter `node-gyp` relevant errors during the installation of `mkanki`, you could set up your environment according to this [doc](https://github.com/nodejs/node-gyp#installation), then try to install again. (and make sure u've installed Python3)

## Template

Check the `HTML` files under `output` directory once generation process completed.

## Customize

### Words list

It's obvious that the functionality of this repo is not specific to IELTS words. More precisely, this project is an **Anki cards generator for [Cambridge Dictionary](https://dictionary.cambridge.org/)**. It's easy for u to replace the `words.txt` with ur own word list.

### Dictionaries

Default dictionary is bilingual `English-Chinese(Simplified)`, u can also modify it to ur target dictionary version by changing the variable `urlString` in file `main.js` or `main-worker.js` depending on which operation u wanna use. U can get it from cambridge dictionary official website.

There're quite a lot to choose from:

* **English–Chinese (Simplified)**
* **English–Chinese (Traditional)**
* **English–Dutch**
* **English–French**
* **English–German**
* **English–Indonesian**
* **English–Italian**
* **English–Japanese**
* **English–Norwegian**
* **English–Polish**
* **English–Portuguese**
* **English–Spanish**

## Contribute

Glory to [Serifold](https://github.com/Serifold), who really did a great job in helping make this proj better.

If u also wanna contribute to this repo, just make a new fork or open a new issue to let me know.

## Disclaimer

The dictionary data used in this project is sourced from a publicly available online dictionary. All data obtained has been used solely for non-profit personal or educational purposes and is intended for reference and learning purposes only. I do not claim ownership of the data nor do I guarantee its accuracy or completeness.

**This project is not intended for commercial use, and I will not be held responsible for any infringement of commercial rights that may arise from the use of this data.** Users of this project are solely responsible for their own use of the data and should ensure that they comply with all applicable laws and regulations.

## Contact

If u have any questions, just open an issue of this repo or simply mail to my [outlook](mailto:sh1wnt@outlook.com). And... Don't forget to leave a star if u like it.

## License

### [IELTS-Anki-Cards-Generator](https://github.com/Quasimurdock/IELTS-Anki-Cards-Generator)

[GNU Affero General Public License v3](https://opensource.org/licenses/AGPL-3.0)

Copyright (c) 2023 Quasimurdock

## Other Third Party Licenses

[License.md](https://github.com/Quasimurdock/IELTS-Anki-Cards-Generator/blob/mkanki-dev/License.md)
