# IELTS-Dict-Cards-Metadata-Generator

## Intro

It's a simple online dictionary words fetching project for generating IELTS **anki cards**. It contains two main script `main.js` for fetching html and `html2notes.js` for convert html to notes in anki.

All words in `words.txt` comes from the [IELTS](https://github.com/Quasimurdock/IELTS) repo.

## How to use

### Simply import

If u just wanna use the note cards of IELTS words, follow the steps below:

1. Find the release package in the **right nav bar** of this page and download it.
2. Import the `.apkg` file inside that package to Anki.

### Develop

1. Install `npm` or `pnpm`.
2. `npm install` or `pnpm install` to pull all dependencies.
3. `pnpm start` to generate html files from Cam dict.
4. Open ur Anki program.
4. Install the Anki plugin [AnkiConnect](https://ankiweb.net/shared/info/2055492159).
5. `pnpm note` to convert html files to notes in your Anki.

## Template

Check the `HTML` files under `output` directory once generation process completed.

## Disclaimer

The dictionary data used in this project is sourced from a publicly available online dictionary. All data obtained has been used solely for non-profit personal or educational purposes and is intended for reference and learning purposes only. I do not claim ownership of the data nor do I guarantee its accuracy or completeness.

**This project is not intended for commercial use, and I will not be held responsible for any infringement of commercial rights that may arise from the use of this data.** Users of this project are solely responsible for their own use of the data and should ensure that they comply with all applicable laws and regulations.
