// Imports the Google Cloud client library
const language = require('@google-cloud/language');
const client = new language.LanguageServiceClient();
var compromisenlp = require('compromise');

module.exports.analyzeSentiment = function(text) {
  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };
  // Detects the sentiment of the text
  return client
    .analyzeSentiment({document: document})
};

module.exports.entitiesDetection = function(text) {
  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };
  return client
      .analyzeEntities({document});
}
