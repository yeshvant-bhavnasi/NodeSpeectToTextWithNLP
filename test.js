var annotations = require('./annotations');


annotations.annotations(" No, it was just his and my car.")
.then(function(data) {
  console.log(data);
});
