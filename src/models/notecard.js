class Note {
  constructor(deckName, word, front, back, tags) {
    this.deckName = deckName;
    this.modelName = "BasicCamCard2";
    this.fields = { Word: word, Front: front, Back: back };
    this.tags = tags;
  }
}
module.exports = Note;
