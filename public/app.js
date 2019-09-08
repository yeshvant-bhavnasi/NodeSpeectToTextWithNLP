$(function() {
  console.log("js loaded ");
  let callButton = document.getElementById("callButton");
  let hangupButton = document.getElementById("hangupButton");

  let socket = io.connect("http://127.0.0.1:3000");
  //let socket = io.connect("http://10.190.97.146:3000");
  let username = $("#userType");

  try {
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recognition = new SpeechRecognition();
  }
  catch(e) {
    console.error(e);
    $('.no-browser-support').show();
    $('.app').hide();
  }

  recognition.continuous = true;
  recognition.onresult = function(event) {

    // event is a SpeechRecognitionEvent object.
    // It holds all the lines we have captured so far.
    // We only need the current one.
    var current = event.resultIndex;
    console.log(event.results[current]);
    // Get a transcript of what was said.
    var dt = new Date();
    var utcDate = dt.toUTCString()
    var data = {
      'transcript':event.results[current][0].transcript,
      'confidence': event.results[current][0].confidence,
      'timestamp' : utcDate
    }
    socket.emit("transcript", data);
  };

  recognition.addEventListener('end', function() {
    recognition.start();
    console.log('Speech recognition service disconnected');
  });

  recognition.onerror = function(event) {
    console.log('Speech recognition error detected: ' + event.error);
    recognition.start();
  }

  $('#callButton').click(function() {
    recognition.start();
    hangupButton.disabled = false;
    callButton.disabled = true;
  });

  $('#hangupButton').click(function() {
    recognition.stop();
    hangupButton.disabled = true;
    callButton.disabled = false;
    socket.emit("conversation_end",{});
  });

  let setProfile = $("#setProfile");
  setProfile.click(function() {
    console.log(username.val())
    callButton.disabled = false;
    hangupButton.disabled = true;

    socket.emit("change_username", { username: username.val() });
  });

  socket.on("reset", data => {
    console.log("got reset request");
    callButton.disabled = true;
    hangupButton.disabled = true;
    recognition.stop();
  });

  socket.on("render", conversation => {
    console.log("got render request")
    document.getElementById('transcription').innerHTML = JSON.stringify(conversation,null,2);
  });

});
